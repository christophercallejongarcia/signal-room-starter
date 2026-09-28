import { open, readdir, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Chris' real stills as the face reference for Cover Lab ("face") and the
 * Thumbnail-Builder. The folder lives outside every repo and is named only in
 * .env.local: SIGNAL_ROOM_FACE_DIR points at it, the optional
 * SIGNAL_ROOM_FACE_FILES picks file names inside it (comma-separated).
 * Paths never leave the server except to the local Bridge, and nothing here
 * logs them; the browser only sees a count and the expression labels.
 */

export const FACE_REFERENCE_MAX = 6;
/** 4K PNG stills are ~3.5 MB; anything far past that is not a still. */
export const FACE_REFERENCE_MAX_BYTES = 20 * 1024 * 1024;
const EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export type FaceReference = {
  /** File name without extension, e.g. gesicht-00m40s-aufmerksam. */
  id: string;
  /** Absolute path, server-only. */
  path: string;
};

export type FaceReferenceStatus = {
  configured: boolean;
  count: number;
  /** Expression labels read off the file names, never paths. */
  labels: string[];
  problem?: string;
};

type Env = Record<string, string | undefined>;

async function isImageFile(file: string) {
  const details = await stat(file).catch(() => null);
  if (!details?.isFile() || details.size === 0 || details.size > FACE_REFERENCE_MAX_BYTES) return false;
  const handle = await open(file, "r");
  try {
    const head = Buffer.alloc(12);
    await handle.read(head, 0, 12, 0);
    const jpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    const png = head[0] === 0x89 && head.toString("ascii", 1, 4) === "PNG";
    const webp = head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WEBP";
    return jpeg || png || webp;
  } finally {
    await handle.close();
  }
}

/** The configured stills, sorted, capped at FACE_REFERENCE_MAX. Throws only a path-free message. */
export async function loadFaceReferences(env: Env = process.env): Promise<FaceReference[]> {
  const dir = env.SIGNAL_ROOM_FACE_DIR?.trim();
  if (!dir) return [];
  if (!path.isAbsolute(dir)) throw new Error("SIGNAL_ROOM_FACE_DIR must be an absolute path.");
  const picked = (env.SIGNAL_ROOM_FACE_FILES ?? "").split(",").map((name) => name.trim()).filter(Boolean);
  let names: string[];
  if (picked.length > 0) {
    // A picked name is a plain file name; separators would walk out of the folder.
    if (picked.some((name) => name !== path.basename(name) || name.startsWith("."))) {
      throw new Error("SIGNAL_ROOM_FACE_FILES must list plain file names inside SIGNAL_ROOM_FACE_DIR.");
    }
    names = picked;
  } else {
    names = await readdir(dir).catch(() => {
      throw new Error("SIGNAL_ROOM_FACE_DIR cannot be read.");
    });
  }
  const faces: FaceReference[] = [];
  for (const name of [...new Set(names)].sort()) {
    const extension = path.extname(name).toLowerCase();
    if (!EXTENSIONS.has(extension) || name.startsWith(".")) continue;
    const file = path.join(dir, name);
    if (!(await isImageFile(file))) continue;
    faces.push({ id: path.basename(name, path.extname(name)), path: file });
    if (faces.length === FACE_REFERENCE_MAX) break;
  }
  return faces;
}

/** Browser-safe summary: count and labels, no folder, no file path. */
export async function faceReferenceStatus(env: Env = process.env): Promise<FaceReferenceStatus> {
  try {
    const faces = await loadFaceReferences(env);
    return { configured: Boolean(env.SIGNAL_ROOM_FACE_DIR?.trim()), count: faces.length, labels: faces.map((face) => face.id) };
  } catch (error) {
    return { configured: true, count: 0, labels: [], problem: error instanceof Error ? error.message : "Face references cannot be read." };
  }
}
