// Neon Vice Cover Studio: the program that hands this entry in.
//
// It runs on Node 22 with the standard library only, inside the grader's
// container (and locally, for a check). It copies this directory's app/ and
// screenshots/ into the output directory and writes dossier.json there — the
// summary the judge reads — using the vendored make.fun library. The output
// directory is /output in the grader; outside it, MAKEFUN_OUTPUT_DIR stands
// in for it:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The two runs the grader does must write identical bytes, so nothing here
// depends on the clock, on chance, or on the machine it runs on.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, from the kit: app/ at most 993 files and 48 MiB,
// screenshots at most 4 files of 256 KiB each, every app/ path at most
// 1000 bytes, and the dossier's source text at most 160 KiB.
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyTree(source, target) {
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
}

writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, DOSSIER_OPTIONS),
);
