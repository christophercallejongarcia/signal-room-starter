import { STRATEGY_BRIDGE_URL } from "./config.ts";
import type { CoverPackage, Idea, IdeaCoverUpdate, StorageAdapter } from "./contracts.ts";
import {
  COVER_FORMATS,
  coverBoard,
  coverBoardFor,
  parseCoverRequest,
  parseCoverResponse,
  type CoverRequest,
  type CoverResponsePackage,
} from "./cover-lab.ts";
import { coverAssetUrl, writeGeneratedCover } from "./adapters/storage/cover-lab-cache.ts";
import { cropPngToRatio } from "./cover-crop.ts";
import { loadFaceReferences, type FaceReference } from "./face-references.ts";

type CoverStorage = Pick<StorageAdapter, "getIdea" | "saveIdeaCover">;

export class CoverRunError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CoverRunError";
    this.status = status;
  }
}

function ideaForRequest(idea: Idea | null, request: CoverRequest) {
  if (!idea) throw new CoverRunError(`unknown idea ${request.ideaId}`, 404);
  if (!idea.storyboard) throw new CoverRunError("Develop the idea before creating a cover.", 409);
  return idea;
}

function bridgeIdea(idea: Idea) {
  return {
    title: idea.title,
    ...(idea.goal ? { goal: idea.goal } : {}),
    ...(idea.storyboard
      ? {
          storyboard: {
            hook: idea.storyboard.hook,
            caption: idea.storyboard.caption,
            takeaway: idea.storyboard.takeaway,
          },
        }
      : {}),
  };
}

function bridgePackage(pkg: CoverPackage) {
  return {
    id: pkg.id,
    label: pkg.label,
    textOverlay: pkg.textOverlay,
    imageIdea: pkg.imageIdea,
    colorWorld: pkg.colorWorld,
    imagePrompt: pkg.imagePrompt,
  };
}

/** "face" means Chris from his real stills (SIGNAL_ROOM_FACE_DIR), never an invented face. */
async function faceStills(request: CoverRequest): Promise<FaceReference[]> {
  if (request.treatment !== "face") return [];
  const faces = await loadFaceReferences().catch((error: unknown) => {
    throw new CoverRunError(error instanceof Error ? error.message : "Face stills cannot be read.", 409);
  });
  if (faces.length === 0) throw new CoverRunError("No face stills configured. Set SIGNAL_ROOM_FACE_DIR in .env.local or pick Faceless.", 409);
  return faces;
}

async function callBridge(request: CoverRequest, idea: Idea, existing: CoverPackage | undefined) {
  const faces = await faceStills(request);
  const body = {
    format: request.format,
    treatment: request.treatment,
    idea: bridgeIdea(idea),
    ...(existing ? { package: bridgePackage(existing) } : {}),
    ...(faces.length > 0 ? { faces } : {}),
  };
  let response: Response;
  try {
    response = await fetch(`${STRATEGY_BRIDGE_URL}/v1/covers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new CoverRunError("The local Codex bridge is unreachable. Start it with `npm run bridge`.", 503);
  }
  const payload = (await response.json().catch(() => ({}))) as unknown;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : `The cover bridge answered with HTTP ${response.status}.`;
    throw new CoverRunError(message, response.status >= 500 ? 503 : response.status);
  }
  return payload;
}

async function persistPackages(
  request: CoverRequest,
  packages: CoverResponsePackage[],
  now: string,
): Promise<CoverPackage[]> {
  const persisted: CoverPackage[] = [];
  for (const pkg of packages) {
    const raw = Buffer.from(pkg.image.data, "base64");
    // GPT Image renders 3:2; the YouTube slot keeps the centred 16:9 band.
    const bytes = request.format === "youtube" && pkg.image.mimeType === "image/png" ? cropPngToRatio(raw, 16, 9).bytes : raw;
    const saved = await writeGeneratedCover(request.ideaId, request.format, pkg.id, bytes);
    persisted.push({
      id: pkg.id,
      label: pkg.label,
      textOverlay: pkg.textOverlay,
      imageIdea: pkg.imageIdea,
      colorWorld: pkg.colorWorld,
      imagePrompt: pkg.imagePrompt,
      imagePath: saved.imagePath,
      imageUrl: `${coverAssetUrl(request.ideaId, request.format, pkg.id)}?v=${encodeURIComponent(now)}`,
      renderedAt: now,
    });
  }
  return persisted;
}

/** Runs a three-package Cover-Lab pass or replaces one package in place. */
export async function runCoverRequest(body: unknown, storage: CoverStorage): Promise<Idea> {
  const request = parseCoverRequest(body);
  const idea = ideaForRequest(await storage.getIdea(request.ideaId), request);
  const board = request.packageId ? coverBoardFor(idea, request.format) : undefined;
  const existing = request.packageId ? board?.packages.find((pkg) => pkg.id === request.packageId) : undefined;
  if (request.packageId && !existing) throw new CoverRunError(`Unknown ${COVER_FORMATS[request.format].label} cover package.`, 404);

  const payload = await callBridge(request, idea, existing);
  const packages = parseCoverResponse(payload, { format: request.format, ...(request.packageId ? { packageId: request.packageId } : {}) });
  const now = new Date().toISOString();
  const persisted = await persistPackages(request, packages, now);
  const update: IdeaCoverUpdate = request.packageId
    ? { kind: "package", format: request.format, package: persisted[0], now }
    : { kind: "board", board: coverBoard(request.format, request.treatment, persisted, now) };
  const next = await storage.saveIdeaCover(idea.id, update);
  if (!next) throw new CoverRunError(`unknown idea ${request.ideaId}`, 404);
  return next;
}
