import sharp from "sharp";
import type { CanvasNode } from "../model/graph";

export async function assembleGif(
  image: string,
  settings: NonNullable<CanvasNode["gif"]>
) {
  const input = Buffer.from(image.slice(image.indexOf(",") + 1), "base64");
  const { width, height } = await sharp(input, {
    limitInputPixels: 16_777_216,
  }).metadata();
  if (!(width && height)) {
    throw new Error("无法读取网格图片尺寸。");
  }
  const frameWidth = Math.floor(width / settings.columns);
  const frameHeight = Math.floor(height / settings.rows);
  if (!(frameWidth && frameHeight)) {
    throw new Error("网格尺寸超过图片尺寸。");
  }
  const frames: Buffer[] = [];
  for (let row = 0; row < settings.rows; row++) {
    for (let column = 0; column < settings.columns; column++) {
      frames.push(
        await sharp(input, { limitInputPixels: 16_777_216 })
          .extract({
            left: column * frameWidth,
            top: row * frameHeight,
            width: frameWidth,
            height: frameHeight,
          })
          .resize({
            width: 512,
            height: 512,
            fit: "inside",
            withoutEnlargement: true,
          })
          .png()
          .toBuffer()
      );
    }
  }
  const gif = await sharp(frames, { join: { animated: true } })
    .gif({
      loop: 0,
      delay: frames.map(() => Math.round(100 / settings.fps) * 10),
      keepDuplicateFrames: true,
    })
    .toBuffer();
  return `data:image/gif;base64,${gif.toString("base64")}`;
}
