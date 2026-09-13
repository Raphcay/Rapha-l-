export type PriceOption = {
  id: string;
  priceDeltaMin: number;
  priceDeltaMax: number;
};

export function computeEstimate(
  basePriceMin: number,
  basePriceMax: number,
  selectedOptions: PriceOption[]
): { min: number; max: number } {
  let min = basePriceMin;
  let max = basePriceMax;

  for (const option of selectedOptions) {
    min += option.priceDeltaMin;
    max += option.priceDeltaMax;
  }

  min = Math.max(0, min);
  max = Math.max(min, max);

  return { min, max };
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
