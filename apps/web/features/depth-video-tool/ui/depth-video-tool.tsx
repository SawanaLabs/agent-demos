"use client";

import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { validateDepthVideoDuration } from "../model/depth-video-contract";
import {
  type DepthVideoProcessingStage,
  getDepthRuntimeDevice,
  processDepthVideo,
} from "../runtime/depth-video-processor";
import {
  type DepthVideoResultMeta,
  DepthVideoWorkspace,
  type VideoMetadata,
  type WorkspaceStatus,
} from "./depth-video-workspace";

function getDownloadName(
  metadata: VideoMetadata | undefined,
  resultMeta: DepthVideoResultMeta | undefined
) {
  if (!metadata) {
    return "depth-video.mp4";
  }
  const baseName = metadata.name.replace(/\.[^.]+$/, "");
  return `${baseName}-depth.${resultMeta?.extension ?? "mp4"}`;
}

function useRevocableUrl() {
  const [url, setUrl] = useState<string>();

  const replaceUrl = useCallback((blob: Blob | undefined) => {
    setUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return blob ? URL.createObjectURL(blob) : undefined;
    });
  }, []);

  useEffect(
    () => () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    },
    [url]
  );

  return { replaceUrl, url };
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: This hook-sized component coordinates one explicit processing state machine; rendering lives in focused child components.
export function DepthVideoTool() {
  const [analysisFramesPerSecond, setAnalysisFramesPerSecond] = useState(12);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [file, setFile] = useState<File>();
  const [metadata, setMetadata] = useState<VideoMetadata>();
  const [progress, setProgress] = useState(0);
  const [progressCount, setProgressCount] = useState<{
    completed: number;
    total: number;
  }>();
  const [resultMeta, setResultMeta] = useState<DepthVideoResultMeta>();
  const [status, setStatus] = useState<WorkspaceStatus>("empty");
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { replaceUrl: replaceInputUrl, url: inputUrl } = useRevocableUrl();
  const { replaceUrl: replaceOutputUrl, url: outputUrl } = useRevocableUrl();

  const processing = ["loading-model", "analyzing", "exporting"].includes(
    status
  );
  const stage = processing ? (status as DepthVideoProcessingStage) : undefined;
  const runtimeDevice = useMemo(
    () =>
      typeof navigator === "undefined" ? undefined : getDepthRuntimeDevice(),
    []
  );

  const clearOutput = useCallback(() => {
    replaceOutputUrl(undefined);
    setResultMeta(undefined);
  }, [replaceOutputUrl]);

  const resetWorkspace = useCallback(() => {
    abortControllerRef.current?.abort();
    clearOutput();
    replaceInputUrl(undefined);
    setFile(undefined);
    setMetadata(undefined);
    setErrorMessage(undefined);
    setProgress(0);
    setProgressCount(undefined);
    setStatus("empty");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [clearOutput, replaceInputUrl]);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const loadFile = useCallback(
    (nextFile: File | undefined) => {
      if (!nextFile) {
        return;
      }
      if (!nextFile.type.startsWith("video/")) {
        setErrorMessage("Choose an MP4, MOV, or WebM video file.");
        setStatus("error");
        return;
      }

      clearOutput();
      replaceInputUrl(nextFile);
      setFile(nextFile);
      setMetadata(undefined);
      setErrorMessage(undefined);
      setProgress(0);
      setProgressCount(undefined);
      setStatus("empty");
    },
    [clearOutput, replaceInputUrl]
  );

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    loadFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    loadFile(event.dataTransfer.files[0]);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!(video && file)) {
      return;
    }

    try {
      const duration = validateDepthVideoDuration(video.duration);
      setMetadata({
        duration,
        height: video.videoHeight,
        name: file.name,
        size: file.size,
        width: video.videoWidth,
      });
      setStatus("ready");
      setErrorMessage(undefined);
    } catch (error) {
      setMetadata(undefined);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "The video could not be read."
      );
    }
  };

  const handleProcess = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!(video && canvas && metadata)) {
      return;
    }

    clearOutput();
    setErrorMessage(undefined);
    setProgress(0);
    setProgressCount(undefined);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await processDepthVideo({
        analysisFramesPerSecond,
        canvas,
        onProgress: (nextProgress) => {
          setStatus(nextProgress.stage);
          setProgress(nextProgress.progress);
          setProgressCount(
            nextProgress.completed && nextProgress.total
              ? {
                  completed: nextProgress.completed,
                  total: nextProgress.total,
                }
              : undefined
          );
        },
        signal: controller.signal,
        video,
      });
      replaceOutputUrl(result.blob);
      setResultMeta({
        device: result.device,
        extension: result.extension,
        frameCount: result.frameCount,
        size: result.blob.size,
      });
      setProgress(100);
      setProgressCount(undefined);
      setStatus("done");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("ready");
        setProgress(0);
        setProgressCount(undefined);
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The depth video could not be processed."
      );
      setStatus("error");
    } finally {
      abortControllerRef.current = undefined;
    }
  };

  return (
    <DepthVideoWorkspace
      abortControllerRef={abortControllerRef}
      analysisFramesPerSecond={analysisFramesPerSecond}
      canvasRef={canvasRef}
      downloadName={getDownloadName(metadata, resultMeta)}
      dragActive={dragActive}
      errorMessage={errorMessage}
      file={file}
      fileInputRef={fileInputRef}
      handleDrop={handleDrop}
      handleFileInput={handleFileInput}
      handleLoadedMetadata={handleLoadedMetadata}
      handleProcess={handleProcess}
      inputUrl={inputUrl}
      metadata={metadata}
      outputUrl={outputUrl}
      processing={processing}
      progress={progress}
      progressCount={progressCount}
      resetWorkspace={resetWorkspace}
      resultMeta={resultMeta}
      runtimeDevice={runtimeDevice}
      setAnalysisFramesPerSecond={setAnalysisFramesPerSecond}
      setDragActive={setDragActive}
      stage={stage}
      status={status}
      videoRef={videoRef}
    />
  );
}
