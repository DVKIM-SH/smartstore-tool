import { openai, MODEL_NAME } from "@/lib/openai";
import { buildDescriptionPrompt } from "@/lib/prompts";

export async function POST(req) {
  const body = await req.json();

  const prompt = buildDescriptionPrompt(body);

  const res = await openai.responses.create({
    model: MODEL_NAME,
    input: prompt,
  });

  return Response.json({ result: res.output_text });
}
