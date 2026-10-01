import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { TITLE_RUN_HISTORY, TITLE_RUN_ID, type TitleRun } from "./title-builder.ts";

/**
 * Titel-Builder runs live as one JSON file each under data/title-runs/ (gitignored),
 * until a Convex table exists for them. One file per run, so two runs started in
 * parallel never overwrite each other.
 */
export const TITLE_RUN_DIR = path.join(process.cwd(), "data", "title-runs");

export function titleRunPath(id: string, dir = TITLE_RUN_DIR) {
  if (!TITLE_RUN_ID.test(id)) throw new Error("Unknown title run id.");
  return path.join(dir, `${id}.json`);
}

export async function saveTitleRun(run: TitleRun, dir = TITLE_RUN_DIR) {
  const target = titleRunPath(run.id, dir);
  await mkdir(dir, { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(run, null, 2)}\n`, "utf8");
  await rename(temporary, target);
}

export async function readTitleRun(id: string, dir = TITLE_RUN_DIR): Promise<TitleRun | null> {
  try {
    return JSON.parse(await readFile(titleRunPath(id, dir), "utf8")) as TitleRun;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/** Newest first. A file that does not parse is skipped, not fatal. */
export async function listTitleRuns(limit = TITLE_RUN_HISTORY, dir = TITLE_RUN_DIR): Promise<TitleRun[]> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const runs = await Promise.all(
    names
      .filter((name) => name.endsWith(".json") && TITLE_RUN_ID.test(name.slice(0, -5)))
      .map((name) => readTitleRun(name.slice(0, -5), dir).catch(() => null)),
  );
  return runs
    .filter((run): run is TitleRun => Boolean(run))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}
