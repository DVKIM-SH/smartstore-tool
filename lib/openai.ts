import OpenAI from "openai";

export const MODEL_NAME = "gpt-4.1-mini";

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  return new OpenAI({ apiKey });
}
