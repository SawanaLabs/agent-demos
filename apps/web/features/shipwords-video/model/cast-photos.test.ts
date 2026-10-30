import { afterEach, describe, expect, it, vi } from "vitest";
import { createCastPhotos } from "./cast-photos";

const photo = new File(["photo"], "cast.png", { type: "image/png" });

function decodedImage() {
  return { width: 300, height: 300, close: vi.fn() } as unknown as ImageBitmap;
}

function pendingImage() {
  let resolve!: (image: ImageBitmap) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<ImageBitmap>((resolveImage, rejectImage) => {
    resolve = resolveImage;
    reject = rejectImage;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("cast photo lifecycle", () => {
  it("discards decoding that completes after reset or cleanup", async () => {
    const decoding = pendingImage();
    const image = decodedImage();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() => decoding.promise)
    );
    const createUrl = vi.spyOn(URL, "createObjectURL");
    const photos = createCastPhotos();

    const pending = photos.add(photo, "lead");
    photos.reset();
    decoding.resolve(image);

    expect(await pending).toBeNull();
    expect(image.close).toHaveBeenCalledOnce();
    expect(createUrl).not.toHaveBeenCalled();
  });

  it("discards decoding errors after reset or cleanup", async () => {
    const decoding = pendingImage();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(() => decoding.promise)
    );
    const photos = createCastPhotos();

    const pending = photos.add(photo, "lead");
    photos.reset();
    decoding.reject(new Error("decoding failed"));

    expect(await pending).toBeNull();
  });

  it("releases displaced photos while moves and swaps retain live URLs", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => decodedImage())
    );
    vi.spyOn(URL, "createObjectURL")
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:replacement")
      .mockReturnValueOnce("blob:second");
    const revokeUrl = vi.spyOn(URL, "revokeObjectURL");
    const photos = createCastPhotos();

    await photos.add(photo, "lead");
    await photos.add(photo, "lead");
    expect(revokeUrl).toHaveBeenCalledExactlyOnceWith("blob:first");

    await photos.add(photo, "sax");
    const swapped = photos.move("lead", "sax");
    expect(swapped.lead?.url).toBe("blob:second");
    expect(swapped.sax?.url).toBe("blob:replacement");
    photos.move("sax", "keys");
    expect(revokeUrl).toHaveBeenCalledTimes(1);

    photos.remove("keys");
    expect(revokeUrl).toHaveBeenLastCalledWith("blob:replacement");
    photos.reset();
    expect(revokeUrl).toHaveBeenLastCalledWith("blob:second");
    expect(revokeUrl).toHaveBeenCalledTimes(3);
  });
});
