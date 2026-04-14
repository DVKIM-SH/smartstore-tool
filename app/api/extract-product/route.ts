import { extractProductInfo } from "@/lib/extract-product";

export async function POST(req: Request) {
  const body = await req.json();
  const result = await extractProductInfo(body);
  return Response.json(result);
}
