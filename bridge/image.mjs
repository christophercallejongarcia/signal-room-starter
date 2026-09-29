import { mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Codex } from "@openai/codex-sdk";
import { codexAuthState, codexPathOverride } from "./auth.mjs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 240_000;
/**
 * One fixed working directory for every render. Codex records each working
 * directory it runs in as trusted in ~/.codex/config.toml, so a fresh temp
 * folder per render would add an entry every time. Nothing is written there.
 */
const WORKSPACE = path.join(os.tmpdir(), "signal-room-image-workspace");
const imageOutputSchema = {
  type: "object",
  properties: { generated: { type: "boolean" } },
  required: ["generated"],
  additionalProperties: false,
};

function sniffImageType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  const ascii = (from, to) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

/**
 * Codex stores every image its image_gen tool makes under
 * $CODEX_HOME/generated_images/<thread id>/. That folder belongs to exactly
 * one render, so parallel renders can never pick up each other's image.
 */
export function generatedImagesDir(threadId, env = process.env) {
  if (typeof threadId !== "string" || !/^[A-Za-z0-9-]{8,80}$/.test(threadId)) return null;
  const home = env.CODEX_HOME || path.join(os.homedir(), ".codex");
  return path.join(home, "generated_images", threadId);
}

/** The newest image in a render's folder; the model is told to generate once. */
export async function newestGeneratedImage(directory) {
  const names = await readdir(directory).catch(() => []);
  const files = await Promise.all(
    names
      .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
      .map(async (name) => ({ file: path.join(directory, name), details: await stat(path.join(directory, name)).catch(() => null) })),
  );
  const usable = files.filter((entry) => entry.details?.isFile() && entry.details.size > 0 && entry.details.size <= MAX_IMAGE_BYTES);
  usable.sort((a, b) => b.details.mtimeMs - a.details.mtimeMs);
  return usable[0]?.file ?? null;
}

/**
 * Renders one image with Codex's built-in image_gen tool (GPT Image; the
 * Codex backend picks the model version, since 2026-09-08 GPT Image 2.5).
 * The Bridge reads the bytes from the render's own generated_images folder
 * and deletes that folder afterwards, so face-derived images do not pile up
 * in the Codex home. `images` are validated local files (face photos,
 * reference thumbnails, approved layers) the image model receives, in order.
 */
export async function renderCoverWithCodex(prompt, allImages = []) {
  // Codex's image_gen tool refuses more than five input images; callers order them by importance.
  const images = allImages.slice(0, 5);
  if (codexAuthState() === "logged-out") {
    throw Object.assign(new Error("Codex is not logged in. Run `codex login` in a terminal."), { status: 503 });
  }

  await mkdir(WORKSPACE, { recursive: true });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  let thread = null;

  try {
    const codex = new Codex({ ...codexPathOverride(), config: { features: { image_generation: true } } });
    thread = codex.startThread({
      model: process.env.CODEX_IMAGE_MODEL || process.env.CODEX_MODEL || undefined,
      workingDirectory: WORKSPACE,
      sandboxMode: "read-only",
      approvalPolicy: "never",
      networkAccessEnabled: false,
      webSearchMode: "disabled",
      skipGitRepoCheck: true,
    });
    const instruction = [
      prompt,
      "Call the built-in image_gen tool exactly once with the attached images as input and the highest quality it offers.",
      "Do not run shell commands, do not read, search, copy or write files. Codex keeps the image itself.",
      'When the image is generated, return {"generated":true}.',
    ].join("\n");
    await thread.run(
      images.length > 0 ? [{ type: "text", text: instruction }, ...images.map((file) => ({ type: "local_image", path: file }))] : instruction,
      { outputSchema: imageOutputSchema, signal: controller.signal },
    );
    const directory = generatedImagesDir(thread.id);
    const file = directory ? await newestGeneratedImage(directory) : null;
    if (!file) throw new Error("Codex did not generate a usable image.");
    const bytes = await readFile(file);
    const mimeType = sniffImageType(bytes);
    if (!mimeType) throw new Error("Codex generated an image in an unsupported format.");
    return { mimeType, data: bytes.toString("base64") };
  } finally {
    clearTimeout(timeout);
    // Also after a failed or aborted turn: nothing of this render stays in the Codex home.
    const directory = generatedImagesDir(thread?.id);
    if (directory) await rm(directory, { recursive: true, force: true });
  }
}
