import { type Cast, type CastPhoto, moveCastPhoto, type SeatId } from "./cast";

type PhotoIssue = "file-type" | "decode" | "size";
type PhotoSelection = { cast: Cast<CastPhoto> } | { issue: PhotoIssue };

export function createCastPhotos() {
  let cast: Cast<CastPhoto> = {};
  let revision = 0;

  async function add(file: File, seat: SeatId): Promise<PhotoSelection | null> {
    const selectionRevision = revision;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      return { issue: "file-type" };
    }
    let image: ImageBitmap;
    try {
      image = await createImageBitmap(file);
    } catch {
      return selectionRevision === revision ? { issue: "decode" } : null;
    }
    const tooSmall = Math.min(image.width, image.height) < 160;
    image.close();
    if (selectionRevision !== revision) {
      return null;
    }
    if (tooSmall) {
      return { issue: "size" };
    }
    const photo = { name: file.name, url: URL.createObjectURL(file) };
    if (cast[seat]) {
      URL.revokeObjectURL(cast[seat].url);
    }
    cast = { ...cast, [seat]: photo };
    return { cast };
  }

  function remove(seat: SeatId) {
    if (cast[seat]) {
      URL.revokeObjectURL(cast[seat].url);
    }
    const next = { ...cast };
    delete next[seat];
    cast = next;
    return cast;
  }

  function move(from: SeatId, to: SeatId) {
    cast = moveCastPhoto(cast, from, to);
    return cast;
  }

  function reset() {
    revision += 1;
    for (const photo of Object.values(cast)) {
      URL.revokeObjectURL(photo.url);
    }
    cast = {};
    return cast;
  }

  return { add, move, remove, reset };
}
