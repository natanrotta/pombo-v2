// gen-web-version.mjs — grava <outDir>/version.json no build de cada frontend
// (Cloudflare Pages), pra dar pra confirmar DE FORA qual commit está no ar — o
// equivalente web do `version` em /api/health da API.
//
// Roda no build:web / build:admin (package.json raiz), DEPOIS do turbo e FORA
// da task cacheada — então sempre pega o CF_PAGES_COMMIT_SHA do build atual.
// Uso: node scripts/gen-web-version.mjs <outDir>   (ex.: apps/web/dist)
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const outDir = process.argv[2];
if (!outDir) {
  console.error("uso: node scripts/gen-web-version.mjs <outDir>");
  process.exit(1);
}

const gitSha = () => {
  try {
    return execSync("git rev-parse HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
};

const version = {
  // O Cloudflare Pages injeta CF_PAGES_COMMIT_SHA/BRANCH no build. Fallback p/
  // git (build local) ou "unknown".
  commit: process.env.CF_PAGES_COMMIT_SHA || gitSha(),
  branch: process.env.CF_PAGES_BRANCH || "unknown",
  builtAt: new Date().toISOString(),
};

writeFileSync(`${outDir}/version.json`, `${JSON.stringify(version, null, 2)}\n`);
console.log(`[gen-web-version] ${outDir}/version.json →`, version);
