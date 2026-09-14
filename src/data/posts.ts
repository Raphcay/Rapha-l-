export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
};

export const posts: Post[] = [
  {
    slug: "choisir-son-coton",
    title: "Comment on choisit un coton",
    excerpt:
      "Grammage, tissage, provenance : ce qui distingue un coton qui dure de celui qui se déforme après cinq lavages.",
    date: "2026-08-12",
    readTime: "4 min",
  },
  {
    slug: "petite-serie-pourquoi",
    title: "Pourquoi on produit en petite série",
    excerpt:
      "Moins de stock, plus de contrôle : les raisons concrètes derrière chaque drop limité et numéroté.",
    date: "2026-07-03",
    readTime: "3 min",
  },
  {
    slug: "entretien-tshirt",
    title: "Faire durer un t-shirt : le guide",
    excerpt:
      "Température de lavage, séchage, repassage — les gestes simples qui doublent la durée de vie d'une pièce en coton.",
    date: "2026-06-18",
    readTime: "5 min",
  },
];
