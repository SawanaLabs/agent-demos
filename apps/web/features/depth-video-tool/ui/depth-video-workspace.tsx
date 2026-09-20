import {
  ArrowLeftIcon,
  DownloadSimpleIcon,
  LockKeyIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import { Progress, ProgressLabel } from "@workspace/ui/components/progress";
import Link from "next/link";
import type { ChangeEvent, DragEvent, RefObject } from "react";

import {
  DEPTH_VIDEO_MAX_DURATION_SECONDS,
  DEPTH_VIDEO_RECOMMENDED_DURATION_SECONDS,
} from "../model/depth-video-contract";
import type { DepthVideoProcessingStage } from "../runtime/depth-video-processor";

export type WorkspaceStatus =
  | "empty"
  | "ready"
  | "loading-model"
  | "analyzing"
  | "exporting"
  | "done"
  | "error";

export interface VideoMetadata {
  duration: number;
  height: number;
  name: string;
  size: number;
  width: number;
}

export interface DepthVideoResultMeta {
  device: "wasm" | "webgpu";
  extension: "mp4" | "webm";
  frameCount: number;
  size: number;
}

export interface DepthVideoWorkspaceProps {
  abortControllerRef: RefObject<AbortController | undefined>;
  analysisFramesPerSecond: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  downloadName: string;
  dragActive: boolean;
  errorMessage?: string;
  file?: File;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleDrop: (event: DragEvent<HTMLDivElement>) => void;
  handleFileInput: (event: ChangeEvent<HTMLInputElement>) => void;
  handleLoadedMetadata: () => void;
  handleProcess: () => Promise<void>;
  inputUrl?: string;
  metadata?: VideoMetadata;
  outputUrl?: string;
  processing: boolean;
  progress: number;
  progressCount?: { completed: number; total: number };
  resetWorkspace: () => void;
  resultMeta?: DepthVideoResultMeta;
  runtimeDevice?: "wasm" | "webgpu";
  setAnalysisFramesPerSecond: (value: number) => void;
  setDragActive: (value: boolean) => void;
  stage?: DepthVideoProcessingStage;
  status: WorkspaceStatus;
  videoRef: RefObject<HTMLVideoElement | null>;
}

const stageCopy: Record<
  DepthVideoProcessingStage,
  { label: string; note: string }
> = {
  analyzing: {
    label: "Reading spatial depth",
    note: "Each sampled frame is converted and stabilized locally.",
  },
  exporting: {
    label: "Encoding the control video",
    note: "The browser is composing the final video at 24 fps.",
  },
  "loading-model": {
    label: "Loading Depth Anything V2",
    note: "The first run downloads the model. Later runs use the browser cache.",
  },
};

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(duration: number) {
  return `${duration.toFixed(1)} s`;
}

function DepthVideoIntro({
  runtimeDevice,
}: Pick<DepthVideoWorkspaceProps, "runtimeDevice">) {
  return (
    <>
      <header className="flex items-center justify-between border-border border-b pb-4">
        <Link
          className="inline-flex items-center gap-2 text-muted-foreground text-xs transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"
          href="/"
        >
          <ArrowLeftIcon className="size-4" />
          Agent Demos
        </Link>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <LockKeyIcon className="size-3.5 text-primary" />
          Local processing
        </div>
      </header>

      <section className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
        <div>
          <h1 className="max-w-4xl text-balance font-medium text-4xl tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Turn a shot into spatial motion.
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-muted-foreground text-sm/relaxed sm:text-base/relaxed">
            Convert a short video into a grayscale depth reference. Near pixels
            become light, distant pixels become dark, and the original motion
            and camera path remain readable to video models.
          </p>
        </div>
        <div className="grid grid-cols-3 border border-border text-xs">
          <div className="border-border border-r p-3">
            <p className="text-muted-foreground">Sweet spot</p>
            <p className="mt-2 text-foreground text-lg">
              {DEPTH_VIDEO_RECOMMENDED_DURATION_SECONDS}s
            </p>
          </div>
          <div className="border-border border-r p-3">
            <p className="text-muted-foreground">Hard limit</p>
            <p className="mt-2 text-foreground text-lg">
              {DEPTH_VIDEO_MAX_DURATION_SECONDS}s
            </p>
          </div>
          <div className="p-3">
            <p className="text-muted-foreground">Compute</p>
            <p className="mt-2 truncate text-foreground text-sm">
              {runtimeDevice === "webgpu" ? "WebGPU" : "CPU"}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function SourceVideoPanel(props: DepthVideoWorkspaceProps) {
  const {
    dragActive,
    fileInputRef,
    handleDrop,
    handleFileInput,
    handleLoadedMetadata,
    inputUrl,
    metadata,
    processing,
    setDragActive,
    videoRef,
  } = props;

  return (
    <div className="relative flex min-h-[24rem] flex-col border-border border-b lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between border-border border-b px-4 py-3 text-xs">
        <span>Source video</span>
        <span className="text-muted-foreground">
          {metadata
            ? `${metadata.width}×${metadata.height} · ${formatDuration(metadata.duration)}`
            : "MP4 · MOV · WebM"}
        </span>
      </div>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: HTML has no native drag-and-drop region; file selection remains available through the nested button. */}
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: HTML has no native drag-and-drop region; file selection remains available through the nested button. */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden bg-background p-4"
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          accept="video/mp4,video/quicktime,video/webm,video/*"
          className="sr-only"
          onChange={handleFileInput}
          ref={fileInputRef}
          type="file"
        />
        {inputUrl ? (
          <video
            className="max-h-[32rem] w-full object-contain"
            controls={!processing}
            onLoadedMetadata={handleLoadedMetadata}
            playsInline
            preload="metadata"
            ref={videoRef}
            src={inputUrl}
          />
        ) : (
          <button
            className={`group flex h-full min-h-[20rem] w-full flex-col items-center justify-center border border-dashed px-6 text-center outline-none transition-colors focus-visible:border-primary ${
              dragActive
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary"
            }`}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <UploadSimpleIcon className="size-7 text-primary" />
            <span className="mt-5 text-base">Drop a short clip here</span>
            <span className="mt-2 max-w-sm text-muted-foreground text-xs/relaxed">
              Five seconds is usually enough. Clips over fifteen seconds stop
              before model loading.
            </span>
            <span className="mt-5 border border-border px-3 py-2 text-xs transition-colors group-hover:border-primary">
              Choose video
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function DepthOutputPanel(props: DepthVideoWorkspaceProps) {
  const { canvasRef, metadata, outputUrl, status } = props;

  return (
    <div className="relative flex min-h-[24rem] flex-col">
      <div className="flex items-center justify-between border-border border-b px-4 py-3 text-xs">
        <span>Depth output</span>
        <span className="text-muted-foreground">Near / light · Far / dark</span>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-background p-4">
        {outputUrl && status === "done" ? (
          <video
            className="max-h-[32rem] w-full object-contain"
            controls
            playsInline
            src={outputUrl}
          />
        ) : (
          <canvas
            className={`max-h-[32rem] max-w-full object-contain ${
              metadata ? "block" : "hidden"
            }`}
            ref={canvasRef}
          />
        )}
        {metadata ? null : <EmptyDepthPreview />}
      </div>
    </div>
  );
}

function EmptyDepthPreview() {
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden">
      <div className="absolute inset-y-0 right-8 w-3 bg-gradient-to-b from-foreground via-muted-foreground to-background" />
      <div aria-hidden="true" className="w-[70%] space-y-4 opacity-45">
        {[88, 70, 94, 58, 82, 44].map((width, index) => (
          <div
            className="h-px bg-primary"
            key={width}
            style={{ marginLeft: `${index * 3}%`, width: `${width}%` }}
          />
        ))}
      </div>
      <p className="relative bg-background/80 px-3 py-2 text-muted-foreground text-xs">
        Depth preview waits for a source clip
      </p>
    </div>
  );
}

function getIdleStatusCopy(props: DepthVideoWorkspaceProps) {
  const { metadata, resultMeta, status } = props;

  if (status === "done" && resultMeta) {
    const device = resultMeta.device === "webgpu" ? "WebGPU" : "CPU";
    return {
      detail: `${resultMeta.frameCount} depth frames · ${device} · ${formatBytes(resultMeta.size)} ${resultMeta.extension.toUpperCase()}`,
      label: "Depth video ready",
    };
  }
  if (metadata) {
    return {
      detail: `${formatBytes(metadata.size)} · temporal stabilization on · audio preserved when the browser exposes it`,
      label: metadata.name,
    };
  }
  return {
    detail: "The model and your source video stay in this browser.",
    label: "Choose one video to begin",
  };
}

function ProcessingStatus(props: DepthVideoWorkspaceProps) {
  const { errorMessage, progress, progressCount, stage } = props;
  const idleCopy = getIdleStatusCopy(props);

  return (
    <div className="min-h-24 border-border p-4 lg:border-r">
      {stage ? (
        <Progress
          className="[&_[data-slot=progress-indicator]]:bg-primary"
          value={progress}
        >
          <ProgressLabel className="text-foreground">
            {stageCopy[stage].label}
          </ProgressLabel>
          <span className="ml-auto text-muted-foreground text-xs tabular-nums">
            {progressCount
              ? `${progressCount.completed}/${progressCount.total}`
              : `${Math.round(progress)}%`}
          </span>
        </Progress>
      ) : (
        <div className="flex min-h-12 flex-col justify-center">
          <p className="text-sm">{idleCopy.label}</p>
          <p className="mt-1 text-muted-foreground text-xs/relaxed">
            {idleCopy.detail}
          </p>
        </div>
      )}
      {stage ? (
        <p className="mt-2 text-muted-foreground text-xs">
          {stageCopy[stage].note}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-3 border-destructive border-l-2 pl-3 text-destructive text-xs/relaxed">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function ProcessingActions(props: DepthVideoWorkspaceProps) {
  const {
    abortControllerRef,
    analysisFramesPerSecond,
    downloadName,
    file,
    handleProcess,
    metadata,
    outputUrl,
    processing,
    resetWorkspace,
    resultMeta,
    setAnalysisFramesPerSecond,
    status,
  } = props;

  return (
    <div className="flex min-w-72 flex-col justify-between gap-4 p-4 sm:flex-row sm:items-end lg:flex-col lg:items-stretch">
      <label
        className="block text-muted-foreground text-xs"
        htmlFor="analysis-fps"
      >
        Depth samples
        <NativeSelect
          className="mt-2 w-full [&_select]:border-border [&_select]:bg-background [&_select]:text-foreground"
          disabled={processing}
          id="analysis-fps"
          onChange={(event) =>
            setAnalysisFramesPerSecond(Number(event.target.value))
          }
          value={analysisFramesPerSecond}
        >
          <NativeSelectOption value={6}>6 fps · faster</NativeSelectOption>
          <NativeSelectOption value={12}>12 fps · balanced</NativeSelectOption>
          <NativeSelectOption value={24}>24 fps · precise</NativeSelectOption>
        </NativeSelect>
      </label>

      <div className="flex flex-wrap gap-2">
        {file && !processing ? (
          <Button
            className="border-border bg-transparent text-foreground hover:bg-muted"
            onClick={resetWorkspace}
            size="lg"
            variant="outline"
          >
            <XIcon />
            Clear
          </Button>
        ) : null}
        {processing ? (
          <Button
            className="border-border bg-transparent text-foreground hover:bg-muted"
            onClick={() => abortControllerRef.current?.abort()}
            size="lg"
            variant="outline"
          >
            Cancel
          </Button>
        ) : null}
        {status === "done" && outputUrl ? (
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            nativeButton={false}
            render={
              <a download={downloadName} href={outputUrl}>
                <DownloadSimpleIcon />
                Download {resultMeta?.extension.toUpperCase()}
              </a>
            }
            size="lg"
          />
        ) : (
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!metadata || processing}
            onClick={handleProcess}
            size="lg"
          >
            Build depth video
          </Button>
        )}
      </div>
    </div>
  );
}

export function DepthVideoWorkspace(props: DepthVideoWorkspaceProps) {
  return (
    <main className="dark min-h-svh bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <DepthVideoIntro runtimeDevice={props.runtimeDevice} />
        <section className="grid flex-1 border border-border bg-card lg:min-h-[34rem] lg:grid-cols-2">
          <SourceVideoPanel {...props} />
          <DepthOutputPanel {...props} />
        </section>
        <section className="grid border-border border-x border-b bg-muted/30 lg:grid-cols-[minmax(0,1fr)_auto]">
          <ProcessingStatus {...props} />
          <ProcessingActions {...props} />
        </section>
      </div>
    </main>
  );
}
