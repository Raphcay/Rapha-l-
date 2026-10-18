export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type ProductImageSet = {
  front: string;
  back: string;
  detailLogo: string;
  detailCollar: string;
  detailShoulder: string;
};

// Each non-white colorway is a pre-rendered photo (see scripts/recolor-products.py),
// not a live CSS tint — a plain multiply blend crushed dark colors like Noir to a
// flat, detail-less block. Blanc uses the real product photos directly.
function buildImageSet(colorSlug: "blanc" | "noir" | "gris" | "beige"): ProductImageSet {
  const suffix = colorSlug === "blanc" ? "" : `-${colorSlug}`;
  return {
    front: `/products/tee-front${suffix}.png`,
    back: `/products/tee-back${suffix}.png`,
    detailLogo: `/products/tee-detail-logo${suffix}.png`,
    detailCollar: `/products/tee-detail-collar${suffix}.png`,
    detailShoulder: `/products/tee-detail-shoulder${suffix}.png`,
  };
}

export type Product = {
  slug: string;
  name: string;
  price: number;
  material: string;
  cut: string;
  colorName: string;
  colorHex: string;
  description: string;
  images: ProductImageSet;
};

export const products: Product[] = [
  {
    slug: "tee-blanc",
    name: "Tee La Rue des Nôtres",
    price: 25,
    material: "100% coton premium 220g/m²",
    cut: "Oversize / Streetwear",
    colorName: "Blanc",
    colorHex: "#fefefe",
    description: "Logo La Rue des Nôtres brodé, col rond côtelé, épaules tombantes.",
    images: buildImageSet("blanc"),
  },
  {
    slug: "tee-noir",
    name: "Tee La Rue des Nôtres",
    price: 25,
    material: "100% coton premium 220g/m²",
    cut: "Oversize / Streetwear",
    colorName: "Noir",
    colorHex: "#151515",
    description: "Logo La Rue des Nôtres brodé, col rond côtelé, épaules tombantes.",
    images: buildImageSet("noir"),
  },
  {
    slug: "tee-gris",
    name: "Tee La Rue des Nôtres",
    price: 25,
    material: "100% coton premium 220g/m²",
    cut: "Oversize / Streetwear",
    colorName: "Gris",
    colorHex: "#9d9d9d",
    description: "Logo La Rue des Nôtres brodé, col rond côtelé, épaules tombantes.",
    images: buildImageSet("gris"),
  },
  {
    slug: "tee-beige",
    name: "Tee La Rue des Nôtres",
    price: 25,
    material: "100% coton premium 220g/m²",
    cut: "Oversize / Streetwear",
    colorName: "Beige",
    colorHex: "#cebdab",
    description: "Logo La Rue des Nôtres brodé, col rond côtelé, épaules tombantes.",
    images: buildImageSet("beige"),
  },
];
