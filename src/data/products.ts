export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type ProductImageSet = {
  front: string;
  back: string;
  detailLogo: string;
  detailCollar: string;
  detailShoulder: string;
};

function buildImageSet(slug: "basique" | "special"): ProductImageSet {
  return {
    front: `/products/tee-${slug}-front.png`,
    back: `/products/tee-${slug}-back.png`,
    detailLogo: `/products/tee-${slug}-detail-logo.png`,
    detailCollar: `/products/tee-${slug}-detail-collar.png`,
    detailShoulder: `/products/tee-${slug}-detail-shoulder.png`,
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

// Two lines, not colorways of one product: Basique is the plain tee (chest
// embroidery only), Spécial adds the "Montagne — Mer — Sud" back print.
// Both only exist in Blanc for now — the old 4-colorway recoloring
// (scripts/recolor-products.py) hasn't been re-run against these new
// photos yet.
export const products: Product[] = [
  {
    slug: "basique",
    name: "T-shirt Basique",
    price: 25,
    material: "100% coton premium 220g/m²",
    cut: "Coupe classique",
    colorName: "Blanc",
    colorHex: "#fefefe",
    description: "Logo LRDN brodé poitrine, dos uni, col rond côtelé.",
    images: buildImageSet("basique"),
  },
  {
    slug: "special",
    name: "T-shirt Spécial",
    price: 32,
    material: "100% coton premium 220g/m²",
    cut: "Coupe classique",
    colorName: "Blanc",
    colorHex: "#fefefe",
    description:
      "Logo LRDN brodé poitrine, impression dos « Montagne — Mer — Sud », col rond côtelé.",
    images: buildImageSet("special"),
  },
];
