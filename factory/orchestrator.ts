import "dotenv/config";

import { createGameSpec } from "./director.js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function createGameId(): string {
  const now = new Date();

  const timestamp =
    now
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

  return `GAME-${timestamp}`;
}

async function main() {
  console.log("");
  console.log("🎮 GAME FACTORY v0.1");
  console.log("----------------------");
  console.log("");

  const request = process.argv.slice(2).join(" ").trim();

  if (!request) {
    console.error("❌ Falta la descripción del juego.");
    console.log("");
    console.log('Ejemplo:');
    console.log(
      'npm run factory:create -- "Zeus lanza rayos y hay que esquivarlos"'
    );
    console.log("");

    process.exit(1);
  }

  const gameId = createGameId();

  console.log(`🆔 ${gameId}`);
  console.log("");
  console.log("📝 Guardando solicitud...");

  const requestsDirectory =
    path.resolve("factory-data/requests");

  await mkdir(requestsDirectory, {
    recursive: true,
  });

  const requestPath =
    path.join(requestsDirectory, `${gameId}.md`);

  await writeFile(
    requestPath,
    `# GAME REQUEST

Game ID: ${gameId}

## Solicitud

${request}
`,
    "utf8"
  );

  console.log(`✅ ${requestPath}`);
  console.log("");
  console.log("🧠 Director diseñando el juego...");

  const result =
    await createGameSpec(gameId, request);

  console.log("");
  console.log("✅ GAME SPEC creada.");
  console.log(`📄 ${result.specPath}`);
  console.log("");
  console.log("----------------------");
  console.log("");
  console.log(result.spec);
  console.log("");
  console.log("----------------------");
  console.log("");
  console.log("🎯 Etapa Director completada.");
  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error("❌ GAME FACTORY ERROR");
  console.error("");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  console.error("");

  process.exit(1);
});
