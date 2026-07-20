export function calculateDiscountedPrice(
  price: number,
  discount: number,
): number {
  if (discount === 0) {
    return price;
  }

  return Math.round((price * (100 - discount)) / 100);
}
