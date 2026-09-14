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
      "Pourquoi certains cotons tiennent des années quand d'autres se déforment après cinq lavages. Ça se joue surtout sur le grammage, le tissage et la provenance.",
    date: "2026-08-12",
    readTime: "4 min",
  },
  {
    slug: "petite-serie-pourquoi",
    title: "Pourquoi on produit en petite série",
    excerpt:
      "Ce que ça change concrètement, sur la qualité et sur le reste, de limiter chaque drop et de le numéroter.",
    date: "2026-07-03",
    readTime: "3 min",
  },
  {
    slug: "entretien-tshirt",
    title: "Faire durer un t-shirt : le guide",
    excerpt:
      "Trois ou quatre gestes simples, au lavage et au séchage, qui peuvent doubler la durée de vie d'un t-shirt en coton.",
    date: "2026-06-18",
    readTime: "5 min",
  },
];
