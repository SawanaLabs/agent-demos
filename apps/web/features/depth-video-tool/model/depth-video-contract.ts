export const DEPTH_VIDEO_RECOMMENDED_DURATION_SECONDS = 5;
export const DEPTH_VIDEO_MAX_DURATION_SECONDS = 15;
export const DEPTH_VIDEO_OUTPUT_FPS = 24;
export const DEPTH_VIDEO_MAX_OUTPUT_SIDE = 1280;

const VIDEO_DIMENSION_ALIGNMENT = 16;

export interface DepthVideoRecordingFormat {
  extension: "mp4" | "webm";
  mimeType: string;
}

const recordingFormats: DepthVideoRecordingFormat[] = [
  {
    extension: "mp4",
    mimeType: 'video/mp4;codecs="avc1.64001f,mp4a.40.2"',
  },
  { extension: "mp4", mimeType: "video/mp4" },
  { extension: "webm", mimeType: "video/webm;codecs=vp9,opus" },
  { extension: "webm", mimeType: "video/webm;codecs=vp8,opus" },
  { extension: "webm", mimeType: "video/webm" },
];

export function validateDepthVideoDuration(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("The selected file does not contain a readable video.");
  }

  if (durationSeconds > DEPTH_VIDEO_MAX_DURATION_SECONDS) {
    throw new Error("Choose a video that is 15 seconds or shorter.");
  }

  return durationSeconds;
}

export function buildDepthSampleTimes(
  durationSeconds: number,
  analysisFramesPerSecond: number
) {
  validateDepthVideoDuration(durationSeconds);

  if (
    !Number.isFinite(analysisFramesPerSecond) ||
    analysisFramesPerSecond <= 0
  ) {
    throw new Error("Analysis frame rate must be greater than zero.");
  }

  const frameCount = Math.max(
    1,
    Math.round(durationSeconds * analysisFramesPerSecond)
  );

  return Array.from(
    { length: frameCount },
    (_, index) => index / analysisFramesPerSecond
  );
}

function alignVideoDimension(dimension: number) {
  return Math.max(
    VIDEO_DIMENSION_ALIGNMENT,
    Math.round(dimension / VIDEO_DIMENSION_ALIGNMENT) *
      VIDEO_DIMENSION_ALIGNMENT
  );
}

export function getDepthVideoOutputSize(
  sourceWidth: number,
  sourceHeight: number
) {
  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    throw new Error("The selected video has invalid dimensions.");
  }

  const scale = Math.min(
    1,
    DEPTH_VIDEO_MAX_OUTPUT_SIDE / Math.max(sourceWidth, sourceHeight)
  );

  return {
    height: alignVideoDimension(sourceHeight * scale),
    width: alignVideoDimension(sourceWidth * scale),
  };
}

export function chooseDepthVideoRecordingFormat(
  isTypeSupported: (mimeType: string) => boolean
) {
  const format = recordingFormats.find(({ mimeType }) => {
    try {
      return isTypeSupported(mimeType);
    } catch {
      return false;
    }
  });

  if (!format) {
    throw new Error(
      "This browser cannot export an MP4 or WebM video. Use the latest Chrome, Edge, or Safari."
    );
  }

  return format;
}
