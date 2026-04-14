import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MODEL_NAME = process.env.OPENAI_MODEL || "gpt-5.4-thinking";
