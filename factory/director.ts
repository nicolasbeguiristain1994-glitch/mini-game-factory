import OpenAI from "openai";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DirectorResult {
  gameId: string;
  specPath: string;
  spec: string;
}

export interface ClaudeTaskResult {
  gameId: string;
  taskPath: string;
  task: string;
}

export async function createGameSpec(
  gameId: string,
  request: string
): Promise<DirectorResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Falta OPENAI_API_KEY. Agregala al archivo .env antes de ejecutar Game Factory."
    );
  }

  const directorPrompt = await readFile(
    path.resolve("prompts/DIRECTOR.md"),
    "utf8"
  );

  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    reasoning: {
      effort: "medium",
    },
    input: [
      {
        role: "system",
        content: directorPrompt,
      },
      {
        role: "user",
        content: `GAME ID: ${gameId}

SOLICITUD DEL USUARIO:

${request}

Generá la GAME SPEC siguiendo exactamente las reglas del Director.`,
      },
    ],
  });

  const spec = response.output_text.trim();

  if (!spec) {
    throw new Error("El Director devolvió una especificación vacía.");
  }

  const specsDirectory = path.resolve("factory-data/specs");

  await mkdir(specsDirectory, {
    recursive: true,
  });

  const specPath = path.join(
    specsDirectory,
    `${gameId}-SPEC.md`
  );

  await writeFile(specPath, spec, "utf8");

  return {
    gameId,
    specPath,
    spec,
  };
}

export async function createClaudeTask(
  gameId: string,
  specPath: string
): Promise<ClaudeTaskResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Falta OPENAI_API_KEY.");
  }

  const plannerPrompt = await readFile(
    path.resolve("prompts/CLAUDE_TASK_PLANNER.md"),
    "utf8"
  );

  const spec = await readFile(
    path.resolve(specPath),
    "utf8"
  );

  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    reasoning: {
      effort: "medium",
    },
    input: [
      {
        role: "system",
        content: plannerPrompt,
      },
      {
        role: "user",
        content: `GAME ID: ${gameId}

GAME SPEC:

${spec}

Generá la tarea del primer vertical slice.`,
      },
    ],
  });

  const task = response.output_text.trim();

  if (!task) {
    throw new Error("El Director devolvió una CLAUDE TASK vacía.");
  }

  const tasksDirectory = path.resolve("factory-data/tasks");

  await mkdir(tasksDirectory, {
    recursive: true,
  });

  const taskPath = path.join(
    tasksDirectory,
    `${gameId}-CLAUDE-01.md`
  );

  await writeFile(taskPath, task, "utf8");

  return {
    gameId,
    taskPath,
    task,
  };
}
