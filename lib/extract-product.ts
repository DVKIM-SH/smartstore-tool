export async function extractProductInfo({ productLink }) {
  try {
    const res = await fetch(productLink);
    const html = await res.text();
    return {
      success: true,
      extractedText: html.slice(0, 2000)
    };
  } catch (e) {
    return {
      success: false,
      extractedText: ""
    };
  }
}
