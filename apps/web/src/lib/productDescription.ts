export const MAX_PRODUCT_DESCRIPTION_LENGTH = 50_000;

export function hasRichDescriptionContent(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/gu, "")
    .replace(/&(?:nbsp|#160|#x0*a0);/giu, " ")
    .replace(/[\s\u200b-\u200d\ufeff]/gu, "");

  return text.length > 0;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}

export function plainTextToRichDescription(value: string): string {
  const escapedText = escapeHtml(value.replace(/\r\n?/gu, "\n"));

  return `<p>${escapedText.replace(/\n/gu, "<br>")}</p>`;
}
