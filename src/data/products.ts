export type Product = {
  slug: string;
  name: string;
  price: number;
  material: string;
  colorName: string;
  colorHex: string;
  tone: "raw" | "night" | "clay" | "steel";
  description: string;
};

export const products: Product[] = [
  {
    slug: "tee-arc-01-noir",
    name: "Tee Arc 01",
    price: 45,
    material: "100% coton épais 240g",
    colorName: "Noir",
    colorHex: "#0b0b0c",
    tone: "night",
    description:
      "Coupe droite, col renforcé, teinture pièce pour une matière qui vit avec le temps.",
  },
  {
    slug: "tee-arc-01-ecru",
    name: "Tee Arc 01",
    price: 45,
    material: "100% coton épais 240g",
    colorName: "Écru",
    colorHex: "#e4ddc9",
    tone: "raw",
    description:
      "Coupe droite, col renforcé, teinture pièce pour une matière qui vit avec le temps.",
  },
  {
    slug: "tee-arc-02-brique",
    name: "Tee Arc 02",
    price: 49,
    material: "100% coton biologique 220g",
    colorName: "Brique",
    colorHex: "#8a3a24",
    tone: "clay",
    description: "Coupe oversize, ourlet côtelé, sérigraphie mark dos.",
  },
  {
    slug: "tee-arc-02-gris",
    name: "Tee Arc 02",
    price: 49,
    material: "100% coton biologique 220g",
    colorName: "Gris acier",
    colorHex: "#5a5e64",
    tone: "steel",
    description: "Coupe oversize, ourlet côtelé, sérigraphie mark dos.",
  },
];
