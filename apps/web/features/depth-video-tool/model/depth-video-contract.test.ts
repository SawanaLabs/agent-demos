import { describe, expect, it } from "vitest";

import {
  buildDepthSampleTimes,
  chooseDepthVideoRecordingFormat,
  getDepthVideoOutputSize,
  validateDepthVideoDuration,
} from "./depth-video-contract";

describe("depth video input contract", () => {
  it("accepts the recommended five-second clip and rejects clips over fifteen seconds", () => {
    expect(validateDepthVideoDuration(5)).toBe(5);
    expect(validateDepthVideoDuration(15)).toBe(15);
    expect(() => validateDepthVideoDuration(15.01)).toThrow(
      "Choose a video that is 15 seconds or shorter."
    );
  });

  it("samples the full clip without seeking beyond its final decoded frame", () => {
    const sampleTimes = buildDepthSampleTimes(5, 12);

    expect(sampleTimes).toHaveLength(60);
    expect(sampleTimes[0]).toBe(0);
    expect(sampleTimes.at(-1)).toBeCloseTo(59 / 12);
  });

  it("caps output at 1280 pixels and aligns both dimensions to video-safe multiples of sixteen", () => {
    expect(getDepthVideoOutputSize(1080, 1920)).toEqual({
      height: 1280,
      width: 720,
    });
    expect(getDepthVideoOutputSize(1920, 1080)).toEqual({
      height: 720,
      width: 1280,
    });
  });

  it("prefers an MP4 recording and uses WebM only when MP4 is unavailable", () => {
    expect(
      chooseDepthVideoRecordingFormat((mimeType) =>
        ["video/mp4", "video/webm;codecs=vp9,opus"].includes(mimeType)
      )
    ).toEqual({ extension: "mp4", mimeType: "video/mp4" });

    expect(
      chooseDepthVideoRecordingFormat(
        (mimeType) => mimeType === "video/webm;codecs=vp9,opus"
      )
    ).toEqual({
      extension: "webm",
      mimeType: "video/webm;codecs=vp9,opus",
    });
  });
});
