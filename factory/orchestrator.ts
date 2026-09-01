import "dotenv/config";

import {
  createGameSpec,
  createClaudeTask
} from "./director.js";

import {
  runClaude
} from "./claude.js";

import {
  mkdir,
  writeFile
} from "node:fs/promises";

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
  console.log("🎮 GAME FACTORY v0.2");
  console.log("----------------------");
  console.log("");

  const request = process.argv.slice(2).join(" ").trim();

  if (!request) {
    console.error("❌ Falta la descripción del juego.");
    console.log("");
    console.log("Ejemplo:");
    console.log(
      'npm run factory:create -- "Zeus lanza rayos y hay que esquivarlos"'
    );
    console.log("");

    process.exit(1);
  }

  const gameId = createGameId();

  console.log(`🆔 ${gameId}`);
  console.log("");

  // ----------------------------------
  // 1. Guardar solicitud
  // ----------------------------------

  console.log("📝 Guardando solicitud...");

  const requestsDirectory =
    path.resolve("factory-data/requests");

  await mkdir(requestsDirectory, {
    recursive: true
  });

  const requestPath =
    path.join(
      requestsDirectory,
      `${gameId}.md`
    );

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

  // ----------------------------------
  // 2. Director → GAME SPEC
  // ----------------------------------

  console.log("🧠 Director creando GAME SPEC...");

  const specResult =
    await createGameSpec(
      gameId,
      request
    );

  console.log("✅ GAME SPEC creada.");
  console.log(`📄 ${specResult.specPath}`);
  console.log("");

  // ----------------------------------
  // 3. Director → CLAUDE TASK
  // ----------------------------------

  console.log("📋 Director creando tarea para Claude...");

  const taskResult =
    await createClaudeTask(
      gameId,
      specResult.specPath
    );

  console.log("✅ CLAUDE TASK creada.");
  console.log(`📄 ${taskResult.taskPath}`);
  console.log("");

  // ----------------------------------
  // 4. Claude Code → implementación
  // ----------------------------------

  console.log("👨‍💻 Claude Code construyendo vertical slice...");
  console.log("");
  console.log(
    "⚠️ Claude puede crear e instalar archivos dentro de game/. Esto puede tardar varios minutos."
  );
  console.log("");

  const claudeResult =
    await runClaude(
      gameId,
      specResult.specPath,
      taskResult.taskPath
    );

  // ----------------------------------
  // 5. Guardar reporte
  // ----------------------------------

  const reportsDirectory =
    path.resolve("factory-data/reports");

  await mkdir(reportsDirectory, {
    recursive: true
  });

  const reportPath =
    path.join(
      reportsDirectory,
      `${gameId}-CLAUDE-01.md`
    );

  await writeFile(
    reportPath,
    `# CLAUDE REPORT

Game ID: ${gameId}

${claudeResult.output}
`,
    "utf8"
  );

  console.log("");
  console.log("----------------------");
  console.log("");
  console.log("✅ ETAPA CLAUDE COMPLETADA");
  console.log("");
  console.log(`GAME ID: ${gameId}`);
  console.log(`GAME SPEC: ${specResult.specPath}`);
  console.log(`CLAUDE TASK: ${taskResult.taskPath}`);
  console.log(`CLAUDE REPORT: ${reportPath}`);
  console.log("");
  console.log(
    "Siguiente etapa futura: TESTS → CODEX REVIEW"
  );
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
