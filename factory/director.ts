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
