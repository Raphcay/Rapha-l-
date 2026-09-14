export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const PRODUCT_IMAGES = {
  front: "/products/arc-tee-front.png",
  back: "/products/arc-tee-back.png",
  detailLogo: "/products/arc-tee-detail-logo.png",
  detailCollar: "/products/arc-tee-detail-collar.png",
  detailShoulder: "/products/arc-tee-detail-shoulder.png",
};

export type Product = {
  slug: string;
  name: string;
  price: number;
  material: string;
  cut: string;
  colorName: string;
  colorHex: string;
  description: string;
};

export const products: Product[] = [
  {
    slug: "tee-arc-blanc",
    name: "Tee Arc",
    price: 25,
    material: "100% coton premium 220g/m²",
    cut: "Oversize / Streetwear",
    colorName: "Blanc",
    colorHex: "#fefefe",
    description: "Logo Arc brodé, col rond côtelé, épaules tombantes.",
  },
  {
    slug: "tee-arc-noir",
    name: "Tee Arc",
    price: 25,
    material: "100% coton premium 220g/m²",
    cut: "Oversize / Streetwear",
    colorName: "Noir",
    colorHex: "#151515",
    description: "Logo Arc brodé, col rond côtelé, épaules tombantes.",
  },
  {
    slug: "tee-arc-gris",
    name: "Tee Arc",
    price: 25,
    material: "100% coton premium 220g/m²",
    cut: "Oversize / Streetwear",
    colorName: "Gris",
    colorHex: "#9d9d9d",
    description: "Logo Arc brodé, col rond côtelé, épaules tombantes.",
  },
  {
    slug: "tee-arc-beige",
    name: "Tee Arc",
    price: 25,
    material: "100% coton premium 220g/m²",
    cut: "Oversize / Streetwear",
    colorName: "Beige",
    colorHex: "#cebdab",
    description: "Logo Arc brodé, col rond côtelé, épaules tombantes.",
  },
];
