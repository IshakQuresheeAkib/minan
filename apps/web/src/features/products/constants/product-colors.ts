export type ProductColorSwatch = {
  name: string;
  swatch: string;
};

export const productColorSwatches: Record<string, string> = {
  Beige: "#d8c2a7",
  Black: "#111111",
  Blue: "#3468b7",
  Brown: "#7a4b2a",
  Cyan: "#0891b2",
  Gold: "#c99b2e",
  Green: "#16a34a",
  Navy: "#172554",
  Orange: "#c2410c",
  Pink: "#e879f9",
  Purple: "#9333ea",
  Red: "#7f1d1d",
  "Sky Blue": "#7dd3fc",
  Teal: "#14b8a6",
  White: "#ffffff",
  Yellow: "#eab308",
};

export function getProductColorSwatch(color: string): ProductColorSwatch {
  return {
    name: color,
    swatch: productColorSwatches[color] ?? color,
  };
}
