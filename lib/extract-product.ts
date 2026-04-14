type ExtractProductInfoParams = {
  productLink: string;
};

export async function extractProductInfo({
  productLink,
}: ExtractProductInfoParams) {
  try {
    const res = await fetch(productLink);
    const html = await res.text();

    // 나머지 로직...
    return {};
  } catch (error) {
    console.error("extractProductInfo error:", error);
    throw error;
  }
}
