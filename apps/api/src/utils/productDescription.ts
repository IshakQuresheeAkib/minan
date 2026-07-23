import { decodeHTML } from "entities";
import sanitizeHtml from "sanitize-html";

import { AppError } from "../lib/errors.js";

export const MAX_PRODUCT_DESCRIPTION_LENGTH = 50_000;

const allowedTags = ["p", "br", "strong", "em", "ul", "ol", "li"];
const nonTextTags = [
  "style",
  "script",
  "textarea",
  "option",
  "xmp",
  "noscript",
];

function collectDecodedText(html: string): string {
  let decodedText = "";

  sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
    nonTextTags,
    textFilter(text) {
      decodedText += text;
      return text;
    },
  });

  return decodedText;
}

export function richDescriptionToPlainText(html: string): string {
  const blockAwareHtml = html
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<\/p>/giu, "\n\n")
    .replace(/<li>/giu, "\n")
    .replace(/<\/li>/giu, "")
    .replace(/<\/(?:ul|ol)>/giu, "\n");

  return decodeHTML(collectDecodedText(blockAwareHtml))
    .replace(/\u00a0/gu, " ")
    .replace(/\r\n?/gu, "\n")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n[ \t]+/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function hasVisibleText(value: string): boolean {
  return value.replace(/[\s\u200b-\u200d\ufeff]/gu, "").length > 0;
}

export function sanitizeProductDescriptionHtml(
  html: string | null | undefined,
): string | null {
  if (!html) {
    return null;
  }

  const sanitizedHtml = sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {},
    nonTextTags,
    disallowedTagsMode: "discard",
  }).trim();
  const plainText = richDescriptionToPlainText(sanitizedHtml);

  return hasVisibleText(plainText) ? sanitizedHtml : null;
}

export function normalizeProductDescription(input: {
  description?: string;
  description_html?: string;
}): { description: string; description_html: string | null } {
  if (input.description_html !== undefined) {
    const descriptionHtml = sanitizeProductDescriptionHtml(
      input.description_html,
    );

    if (!descriptionHtml) {
      throw new AppError("Description is required", 400);
    }

    return {
      description: richDescriptionToPlainText(descriptionHtml),
      description_html: descriptionHtml,
    };
  }

  const description = input.description?.trim();
  if (!description || !hasVisibleText(description)) {
    throw new AppError("Description is required", 400);
  }

  return { description, description_html: null };
}
