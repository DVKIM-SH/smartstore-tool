import { getOpenAI, MODEL_NAME } from "@/lib/openai";
import { buildDescriptionPrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const openai = getOpenAI();
    const body = await req.json();

    const prompt = buildDescriptionPrompt(body);

    const res = await openai.responses.create({
      model: MODEL_NAME,
      input: prompt,
    });

    let result = res.output_text?.trim() || "";

    if (result.length < 1200) {
      const retryPrompt = `${prompt}

추가 지시:
- 방금 작성한 결과는 너무 짧았습니다.
- 이번에는 반드시 공백 포함 1200자 이상 1300자 이하로 맞추세요.
- 제품소개는 문장형 단락으로 유지하세요.
- 특징및장점과 강조포인트는 리스트형으로 유지하되, 각 항목을 더 길고 설명적으로 작성하세요.
- 특히 특징및장점 블록을 가장 풍부하게 확장하세요.
- 짧은 슬로건형 문구나 한 줄짜리 bullet은 금지합니다.
- YAML 형식은 그대로 유지하세요.
- 상품명, 스토어명 라인은 출력하지 마세요.`;

      const retryRes = await openai.responses.create({
        model: MODEL_NAME,
        input: retryPrompt,
      });

      result = retryRes.output_text?.trim() || result;
    }

    return Response.json({ result });
  } catch (error) {
    console.error("generate-description error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "generate-description 처리 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
