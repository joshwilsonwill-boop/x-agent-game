// main.ts - entry point for the Meteor Dodge bounty submission.
//
// What it does: copies POST.json from this repository into the output
// directory the grader gives us, so the grader can read the X post URL.
// It reads nothing else and writes nothing else.
//
// Inputs (environment):
//   MAKEFUN_OUTPUT_DIR - where to place POST.json (default: /output)
//   MAKEFUN_BOT_DIR    - the bot directory (default: /bot), used only
//                        for logging; nothing is read from or written to it.
//
// Safety: this file only ever writes inside MAKEFUN_OUTPUT_DIR. It never
// changes permissions, ownership, or timestamps, and it never touches a
// path outside the output directory.

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here);
const sourcePost = join(repoRoot, "POST.json");

const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");
const botDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";

function main(): void {
  if (!existsSync(sourcePost)) {
    console.error(`POST.json not found at ${sourcePost}`);
    process.exit(1);
  }

  mkdirSync(outputDir, { recursive: true });
  const target = join(outputDir, "POST.json");
  copyFileSync(sourcePost, target);
  console.log(`Copied POST.json to ${target} (bot dir: ${botDir})`);
}

main();
