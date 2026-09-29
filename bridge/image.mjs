import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Codex } from "@openai/codex-sdk";
import { codexAuthState, codexPathOverride } from "./auth.mjs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 240_000;
/**
 * One fixed workspace for every render. Codex records each working directory
 * it runs in as trusted in ~/.codex/config.toml, so a fresh temp folder per
 * render would add an entry every time. Each render owns one file name in it.
 */
const WORKSPACE = path.join(os.tmpdir(), "signal-room-image-workspace");
const imageOutputSchema = {
  type: "object",
  properties: { saved: { type: "boolean" } },
  required: ["saved"],
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
 * Uses the Codex image-generation capability in an isolated temporary
 * workspace. The Bridge receives bytes and the app decides where to persist
 * them, so a model-generated path never becomes an app path. `images` are
 * validated local files (face stills, reference thumbnails) the image model
 * receives as input, in order.
 */
export async function renderCoverWithCodex(prompt, images = []) {
  if (codexAuthState() === "logged-out") {
    throw Object.assign(new Error("Codex is not logged in. Run `codex login` in a terminal."), { status: 503 });
  }

  await mkdir(WORKSPACE, { recursive: true });
  const name = `cover-${randomUUID()}.png`;
  const output = path.join(WORKSPACE, name);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);

  try {
    const codex = new Codex({ ...codexPathOverride(), config: { features: { image_generation: true } } });
    const thread = codex.startThread({
      model: process.env.CODEX_IMAGE_MODEL || process.env.CODEX_MODEL || undefined,
      workingDirectory: WORKSPACE,
      sandboxMode: "workspace-write",
      approvalPolicy: "never",
      networkAccessEnabled: false,
      webSearchMode: "disabled",
      skipGitRepoCheck: true,
    });
    const instruction = `${prompt}\nUse the built-in image_gen tool. Save the selected final PNG exactly to ./${name} in the current workspace. Do not write any other file. Then return {"saved":true}.`;
    await thread.run(
      images.length > 0 ? [{ type: "text", text: instruction }, ...images.map((file) => ({ type: "local_image", path: file }))] : instruction,
      { outputSchema: imageOutputSchema, signal: controller.signal },
    );
    const details = await stat(output).catch(() => null);
    if (!details || details.size === 0 || details.size > MAX_IMAGE_BYTES) {
      throw new Error("Codex did not save a usable cover image.");
    }
    const bytes = await readFile(output);
    const mimeType = sniffImageType(bytes);
    if (!mimeType) throw new Error("Codex saved a cover in an unsupported image format.");
    return { mimeType, data: bytes.toString("base64") };
  } finally {
    clearTimeout(timeout);
    await rm(output, { force: true });
  }
}
