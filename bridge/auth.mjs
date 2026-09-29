import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Whether Codex can run at all. The SDK spawns the Codex CLI, which reads the
 * subscription login from `$CODEX_HOME/auth.json` (default `~/.codex`); an
 * explicit CODEX_API_KEY bypasses that file.
 */
/**
 * The Codex CLI the SDK spawns. The SDK ships its own CLI, which can lag behind
 * the models the subscription offers (gpt-6-astra needs a newer CLI);
 * CODEX_PATH points at an installed one instead, e.g. /opt/homebrew/bin/codex.
 */
export function codexPathOverride(env = process.env) {
  const file = env.CODEX_PATH?.trim();
  return file && path.isAbsolute(file) && fs.existsSync(file) ? { codexPathOverride: file } : {};
}

export function codexAuthState({ home, env = process.env } = {}) {
  if (env.CODEX_API_KEY) return "logged-in";
  const codexHome = home ?? env.CODEX_HOME ?? path.join(os.homedir(), ".codex");
  return fs.existsSync(path.join(codexHome, "auth.json")) ? "logged-in" : "logged-out";
}
