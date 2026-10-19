export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type ProductImageSet = {
  front: string;
  back: string;
  detailLogo: string;
  detailCollar: string;
  detailShoulder: string;
};

type ProductSlug = "basique" | "special";

export type ColorwaySlug = "blanc" | "beige" | "gris" | "noir";

export type Colorway = {
  slug: ColorwaySlug;
  name: string;
  hex: string;
  images: ProductImageSet;
};

const COLORWAY_DEFS: { slug: ColorwaySlug; name: string; hex: string }[] = [
  { slug: "blanc", name: "Blanc", hex: "#fefefe" },
  { slug: "beige", name: "Beige", hex: "#d8d0c4" },
  { slug: "gris", name: "Gris Bleu", hex: "#60646c" },
  { slug: "noir", name: "Noir", hex: "#151515" },
];

function buildImageSet(productSlug: ProductSlug, colorSlug: ColorwaySlug): ProductImageSet {
  // Blanc is the real photography the other colorways are recolored from
  // (see scripts/recolor-catalog.py) — it keeps the bare filename, the
  // others carry a "-{colorSlug}" suffix.
  const suffix = colorSlug === "blanc" ? "" : `-${colorSlug}`;
  return {
    front: `/products/tee-${productSlug}-front${suffix}.png`,
    back: `/products/tee-${productSlug}-back${suffix}.png`,
    detailLogo: `/products/tee-${productSlug}-detail-logo${suffix}.png`,
    detailCollar: `/products/tee-${productSlug}-detail-collar${suffix}.png`,
    detailShoulder: `/products/tee-${productSlug}-detail-shoulder${suffix}.png`,
  };
}

function buildColorways(productSlug: ProductSlug): Colorway[] {
  return COLORWAY_DEFS.map((c) => ({
    slug: c.slug,
    name: c.name,
    hex: c.hex,
    images: buildImageSet(productSlug, c.slug),
  }));
}

export type Product = {
  slug: string;
  name: string;
  price: number;
  material: string;
  cut: string;
  description: string;
  colorName: string;
  colorHex: string;
  colorways: Colorway[];
};

// Two lines, not colorways of one product: Basique is the plain tee (chest
// embroidery only), Spécial adds the "Montagne — Mer — Sud" back print.
// Each line comes in 4 colorways (see scripts/recolor-catalog.py) — Blanc
// is the real photography, Beige/Gris/Noir are recolored from it, with the
// embroidery/print flipped to the light "ink" cream on Noir so it stays
// legible. colorName/colorHex below describe the *default* (Blanc)
// colorway shown before a visitor picks a swatch.
export const products: Product[] = [
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
    colorways: buildColorways("special"),
  },
  {
    slug: "basique",
    name: "T-shirt Basique",
    price: 25,
    material: "100% coton premium 220g/m²",
    cut: "Coupe classique",
    colorName: "Blanc",
    colorHex: "#fefefe",
    description: "Logo LRDN brodé poitrine, dos uni, col rond côtelé.",
    colorways: buildColorways("basique"),
  },
];
