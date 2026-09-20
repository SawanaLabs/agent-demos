import type {
  DepthEstimationPipelineOutput,
  DepthEstimationPipelineType,
  RawImage,
} from "@huggingface/transformers";

import {
  buildDepthSampleTimes,
  chooseDepthVideoRecordingFormat,
  DEPTH_VIDEO_OUTPUT_FPS,
  getDepthVideoOutputSize,
} from "../model/depth-video-contract";

const DEPTH_MODEL_ID = "onnx-community/depth-anything-v2-small";
const DEPTH_MODEL_REVISION = "4472b7362082ad9968fee890ca0f1e5aca36b93d";
const MAX_ANALYSIS_SIDE = 518;
const DEPTH_FRAME_MAX_WIDTH = 384;
const EXPORT_VIDEO_BITRATE = 10_000_000;

export type DepthRuntimeDevice = "wasm" | "webgpu";
export type DepthVideoProcessingStage =
  | "loading-model"
  | "analyzing"
  | "exporting";

export interface DepthVideoProgress {
  completed?: number;
  progress: number;
  stage: DepthVideoProcessingStage;
  total?: number;
}

export interface ProcessDepthVideoOptions {
  analysisFramesPerSecond: number;
  canvas: HTMLCanvasElement;
  onProgress: (progress: DepthVideoProgress) => void;
  signal: AbortSignal;
  video: HTMLVideoElement;
}

export interface ProcessedDepthVideo {
  blob: Blob;
  device: DepthRuntimeDevice;
  extension: "mp4" | "webm";
  frameCount: number;
  mimeType: string;
}

interface PackedDepthFrame {
  data: Uint8Array;
  height: number;
  width: number;
}

interface LoadedDepthRuntime {
  device: DepthRuntimeDevice;
  estimator: DepthEstimationPipelineType;
  RawImage: typeof RawImage;
}

interface ExportAudioGraph {
  context: AudioContext;
  destination: MediaStreamAudioDestinationNode;
}

const depthRuntimePromises = new Map<
  DepthRuntimeDevice,
  Promise<LoadedDepthRuntime>
>();
const exportAudioGraphs = new WeakMap<HTMLVideoElement, ExportAudioGraph>();

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) {
    throw new DOMException(
      "Depth video processing was cancelled.",
      "AbortError"
    );
  }
}

export function getDepthRuntimeDevice(): DepthRuntimeDevice {
  return "gpu" in navigator && navigator.gpu ? "webgpu" : "wasm";
}

async function loadDepthRuntime(
  device: DepthRuntimeDevice,
  onProgress: (progress: number) => void
) {
  const existing = depthRuntimePromises.get(device);

  if (existing) {
    onProgress(100);
    return existing;
  }

  const runtimePromise = (async () => {
    const transformers = await import("@huggingface/transformers");
    transformers.env.allowLocalModels = false;
    transformers.env.useBrowserCache = true;

    const estimator = await transformers.pipeline(
      "depth-estimation",
      DEPTH_MODEL_ID,
      {
        device,
        dtype: device === "webgpu" ? "fp16" : "fp32",
        progress_callback: (event) => {
          if (
            event.status === "progress" &&
            typeof event.progress === "number"
          ) {
            onProgress(Math.max(0, Math.min(100, event.progress)));
          }
        },
        revision: DEPTH_MODEL_REVISION,
      }
    );

    return {
      device,
      estimator,
      RawImage: transformers.RawImage,
    };
  })();

  depthRuntimePromises.set(device, runtimePromise);

  try {
    return await runtimePromise;
  } catch (error) {
    depthRuntimePromises.delete(device);
    throw error;
  }
}

function getAnalysisSize(sourceWidth: number, sourceHeight: number) {
  const scale = Math.min(
    1,
    MAX_ANALYSIS_SIDE / Math.max(sourceWidth, sourceHeight)
  );

  return {
    height: Math.max(32, Math.round(sourceHeight * scale)),
    width: Math.max(32, Math.round(sourceWidth * scale)),
  };
}

function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    if (
      Math.abs(video.currentTime - time) < 0.001 &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      window.requestAnimationFrame(() => resolve());
      return;
    }

    const timeoutId = window.setTimeout(() => {
      video.removeEventListener("seeked", handleSeeked);
      reject(new Error("The browser timed out while reading a video frame."));
    }, 5000);

    function handleSeeked() {
      window.clearTimeout(timeoutId);
      video.removeEventListener("seeked", handleSeeked);
      resolve();
    }

    video.addEventListener("seeked", handleSeeked, { once: true });
    video.currentTime = time;
  });
}

function packDepthFrame(depth: RawImage) {
  const scratch = document.createElement("canvas");
  const scratchContext = scratch.getContext("2d");

  if (!scratchContext) {
    throw new Error("The browser could not create a depth frame canvas.");
  }

  scratch.width = depth.width;
  scratch.height = depth.height;
  const imageData = scratchContext.createImageData(depth.width, depth.height);

  for (let index = 0; index < depth.width * depth.height; index += 1) {
    const sourceOffset = index * depth.channels;
    const targetOffset = index * 4;
    const value = depth.data[sourceOffset] ?? 0;

    imageData.data[targetOffset] = value;
    imageData.data[targetOffset + 1] = value;
    imageData.data[targetOffset + 2] = value;
    imageData.data[targetOffset + 3] = 255;
  }

  scratchContext.putImageData(imageData, 0, 0);

  const width = Math.min(DEPTH_FRAME_MAX_WIDTH, depth.width);
  const height = Math.max(1, Math.round((depth.height * width) / depth.width));
  const packedCanvas = document.createElement("canvas");
  const packedContext = packedCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!packedContext) {
    throw new Error("The browser could not prepare the depth frame cache.");
  }

  packedCanvas.width = width;
  packedCanvas.height = height;
  packedContext.imageSmoothingEnabled = true;
  packedContext.imageSmoothingQuality = "high";
  packedContext.drawImage(scratch, 0, 0, width, height);

  const rgba = packedContext.getImageData(0, 0, width, height).data;
  const data = new Uint8Array(width * height);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = rgba[index * 4] ?? 0;
  }

  return { data, height, width } satisfies PackedDepthFrame;
}

function stabilizeDepthFrame(
  current: PackedDepthFrame,
  previous: PackedDepthFrame | undefined
) {
  if (
    !previous ||
    previous.width !== current.width ||
    previous.height !== current.height
  ) {
    return current;
  }

  const currentWeight = 0.65;

  for (let index = 0; index < current.data.length; index += 1) {
    current.data[index] = Math.round(
      (current.data[index] ?? 0) * currentWeight +
        (previous.data[index] ?? 0) * (1 - currentWeight)
    );
  }

  return current;
}

function renderDepthFrame(frame: PackedDepthFrame, canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("The browser could not render the depth video.");
  }

  const frameCanvas = document.createElement("canvas");
  const frameContext = frameCanvas.getContext("2d");

  if (!frameContext) {
    throw new Error("The browser could not render a depth frame.");
  }

  frameCanvas.width = frame.width;
  frameCanvas.height = frame.height;
  const imageData = frameContext.createImageData(frame.width, frame.height);

  for (let index = 0; index < frame.data.length; index += 1) {
    const offset = index * 4;
    const value = frame.data[index] ?? 0;

    imageData.data[offset] = value;
    imageData.data[offset + 1] = value;
    imageData.data[offset + 2] = value;
    imageData.data[offset + 3] = 255;
  }

  frameContext.putImageData(imageData, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(frameCanvas, 0, 0, canvas.width, canvas.height);
}

async function analyzeVideoFrames({
  analysisFramesPerSecond,
  canvas,
  onProgress,
  runtime,
  signal,
  video,
}: ProcessDepthVideoOptions & { runtime: LoadedDepthRuntime }) {
  const sampleTimes = buildDepthSampleTimes(
    video.duration,
    analysisFramesPerSecond
  );
  const analysisSize = getAnalysisSize(video.videoWidth, video.videoHeight);
  const analysisCanvas = document.createElement("canvas");
  const analysisContext = analysisCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!analysisContext) {
    throw new Error("The browser could not read frames from this video.");
  }

  analysisCanvas.width = analysisSize.width;
  analysisCanvas.height = analysisSize.height;
  video.pause();
  video.muted = true;

  const frames: PackedDepthFrame[] = [];
  let previousFrame: PackedDepthFrame | undefined;

  for (const [index, sampleTime] of sampleTimes.entries()) {
    throwIfAborted(signal);
    await seekVideo(video, sampleTime);
    analysisContext.drawImage(
      video,
      0,
      0,
      analysisSize.width,
      analysisSize.height
    );
    const sourceImageData = analysisContext.getImageData(
      0,
      0,
      analysisSize.width,
      analysisSize.height
    );
    const input = new runtime.RawImage(
      sourceImageData.data,
      analysisSize.width,
      analysisSize.height,
      4
    );
    const rawOutput = await runtime.estimator(input);
    const output = (Array.isArray(rawOutput) ? rawOutput[0] : rawOutput) as
      | DepthEstimationPipelineOutput
      | undefined;

    if (!output?.depth) {
      throw new Error("The depth model returned an empty frame.");
    }

    const frame = stabilizeDepthFrame(
      packDepthFrame(output.depth),
      previousFrame
    );
    frames.push(frame);
    previousFrame = frame;
    renderDepthFrame(frame, canvas);
    onProgress({
      completed: index + 1,
      progress: ((index + 1) / sampleTimes.length) * 100,
      stage: "analyzing",
      total: sampleTimes.length,
    });

    await new Promise<void>((resolve) =>
      window.requestAnimationFrame(() => resolve())
    );
  }

  return frames;
}

async function getExportAudioGraph(video: HTMLVideoElement) {
  const existing = exportAudioGraphs.get(video);

  if (existing) {
    if (existing.context.state === "suspended") {
      await existing.context.resume();
    }
    return existing;
  }

  const AudioContextConstructor =
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!AudioContextConstructor) {
    return;
  }

  const context = new AudioContextConstructor();
  const destination = context.createMediaStreamDestination();
  const source = context.createMediaElementSource(video);
  source.connect(destination);
  await context.resume();

  const graph = { context, destination };
  exportAudioGraphs.set(video, graph);
  return graph;
}

async function exportDepthVideo({
  analysisFramesPerSecond,
  canvas,
  frames,
  onProgress,
  signal,
  video,
}: ProcessDepthVideoOptions & { frames: PackedDepthFrame[] }) {
  throwIfAborted(signal);
  const format = chooseDepthVideoRecordingFormat((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType)
  );
  const stream = canvas.captureStream(DEPTH_VIDEO_OUTPUT_FPS);
  const audioGraph = await getExportAudioGraph(video);
  const audioTrack = audioGraph?.destination.stream.getAudioTracks()[0];

  if (audioTrack) {
    stream.addTrack(audioTrack);
  }

  const recorder = new MediaRecorder(stream, {
    audioBitsPerSecond: 160_000,
    mimeType: format.mimeType,
    videoBitsPerSecond: EXPORT_VIDEO_BITRATE,
  });
  const chunks: Blob[] = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  const recordingStopped = new Promise<void>((resolve) => {
    recorder.addEventListener("stop", () => resolve(), { once: true });
  });

  await seekVideo(video, 0);
  video.muted = false;
  video.volume = 1;
  renderDepthFrame(frames[0] as PackedDepthFrame, canvas);
  recorder.start(500);

  try {
    try {
      await video.play();
    } catch (error) {
      throw new Error(
        `The browser blocked video playback during export: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }

    await new Promise<void>((resolve, reject) => {
      let animationFrameId = 0;

      const cleanUp = () => {
        window.cancelAnimationFrame(animationFrameId);
        video.removeEventListener("ended", finish);
        video.removeEventListener("pause", finishAtBoundary);
        signal.removeEventListener("abort", cancel);
      };
      const finish = () => {
        cleanUp();
        resolve();
      };
      const finishAtBoundary = () => {
        if (video.currentTime >= video.duration - 0.05) {
          finish();
        }
      };
      const cancel = () => {
        cleanUp();
        reject(
          new DOMException(
            "Depth video processing was cancelled.",
            "AbortError"
          )
        );
      };
      const render = () => {
        const frameIndex = Math.min(
          frames.length - 1,
          Math.max(0, Math.floor(video.currentTime * analysisFramesPerSecond))
        );
        renderDepthFrame(frames[frameIndex] as PackedDepthFrame, canvas);
        onProgress({
          progress: Math.min(100, (video.currentTime / video.duration) * 100),
          stage: "exporting",
        });
        animationFrameId = window.requestAnimationFrame(render);
      };

      video.addEventListener("ended", finish, { once: true });
      video.addEventListener("pause", finishAtBoundary);
      signal.addEventListener("abort", cancel, { once: true });
      animationFrameId = window.requestAnimationFrame(render);
    });

    await new Promise<void>((resolve) => window.setTimeout(resolve, 120));
  } finally {
    video.pause();
    video.muted = true;
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    await recordingStopped;
    for (const track of stream.getVideoTracks()) {
      track.stop();
    }
  }

  throwIfAborted(signal);

  if (chunks.length === 0) {
    throw new Error("The browser produced an empty depth video.");
  }

  return {
    blob: new Blob(chunks, { type: format.mimeType }),
    ...format,
  };
}

export async function processDepthVideo({
  analysisFramesPerSecond,
  canvas,
  onProgress,
  signal,
  video,
}: ProcessDepthVideoOptions): Promise<ProcessedDepthVideo> {
  throwIfAborted(signal);
  const outputSize = getDepthVideoOutputSize(
    video.videoWidth,
    video.videoHeight
  );
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  await getExportAudioGraph(video);
  const device = getDepthRuntimeDevice();
  onProgress({ progress: 0, stage: "loading-model" });
  const runtime = await loadDepthRuntime(device, (progress) => {
    onProgress({ progress, stage: "loading-model" });
  });
  throwIfAborted(signal);

  const frames = await analyzeVideoFrames({
    analysisFramesPerSecond,
    canvas,
    onProgress,
    runtime,
    signal,
    video,
  });
  const exported = await exportDepthVideo({
    analysisFramesPerSecond,
    canvas,
    frames,
    onProgress,
    signal,
    video,
  });

  return {
    ...exported,
    device,
    frameCount: frames.length,
  };
}
