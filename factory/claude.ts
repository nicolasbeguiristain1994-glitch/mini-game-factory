import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface ClaudeResult {
  output: string;
}

export async function runClaude(
  gameId: string,
  specPath: string,
  taskPath: string
): Promise<ClaudeResult> {

  const claudePrompt = await readFile(
    path.resolve("prompts/CLAUDE.md"),
    "utf8"
  );

  const gameSpec = await readFile(
    path.resolve(specPath),
    "utf8"
  );

  const task = await readFile(
    path.resolve(taskPath),
    "utf8"
  );

  const prompt = `${claudePrompt}

---

# GAME ID

${gameId}

---

# GAME SPEC

${gameSpec}

---

# TAREA DE IMPLEMENTACIÓN APROBADA POR EL DIRECTOR

${task}

---

La CLAUDE TASK define el alcance de esta iteración.

La GAME SPEC aporta contexto de producto, pero NO implementes todavía elementos que la CLAUDE TASK haya dejado fuera.

Trabajá exclusivamente dentro del alcance definido.

Implementá el vertical slice dentro de game/.

Al finalizar:

1. ejecutá las verificaciones disponibles;
2. corregí errores de compilación;
3. asegurate de que el proyecto pueda ejecutarse;
4. no hagas git push;
5. no leas .env;
6. no agregues funcionalidades fuera del alcance.

Respondé con un resumen breve de lo realizado.
`;

  return new Promise((resolve, reject) => {

    const child = spawn(
      "npx",
      [
        "claude",
        "-p",
        prompt
      ],
      {
        cwd: process.cwd(),
        env: process.env,
        stdio: [
          "ignore",
          "pipe",
          "pipe"
        ]
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", reject);

    child.on("close", (code) => {

      if (code !== 0) {
        reject(
          new Error(
            `Claude Code terminó con código ${code}.\n${stderr}`
          )
        );
        return;
      }

      resolve({
        output: stdout.trim()
      });

    });

  });
}
