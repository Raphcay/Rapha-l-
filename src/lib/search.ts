import { posts } from "@/data/posts";
import { products } from "@/data/products";

export type SearchEntry = {
  title: string;
  subtitle: string;
  href: string;
  type: "Produit" | "Page" | "Journal";
  text: string;
};

const PAGES: SearchEntry[] = [
  { title: "Accueil", subtitle: "La marque et le T-shirt ARC", href: "/", type: "Page", text: "accueil marque t-shirt arc coloris carrousel ambassadeurs parrainage" },
  { title: "Boutique", subtitle: "Tous les coloris du T-shirt ARC", href: "/collection", type: "Page", text: "boutique collection t-shirt coloris tailles" },
  { title: "À propos", subtitle: "L'histoire ARC, deux frères, une marque", href: "/a-propos", type: "Page", text: "a propos histoire frères axel raphaël nom de famille côte d'azur" },
  { title: "Contact", subtitle: "Écrire à l'équipe, précommander, collaborer", href: "/contact", type: "Page", text: "contact email question précommande collaboration formulaire" },
  { title: "Journal", subtitle: "Notes sur la matière, la fabrication, l'entretien", href: "/journal", type: "Page", text: "journal blog articles coton entretien fabrication" },
  { title: "Panier", subtitle: "Les pièces que tu as choisies", href: "/panier", type: "Page", text: "panier commande achat ajouter" },
  { title: "Compte", subtitle: "Espace client, commandes, informations", href: "/compte", type: "Page", text: "compte client connexion commandes adresse parrainage" },
  { title: "Conditions générales de vente", subtitle: "Prix, précommande, livraison", href: "/conditions-generales", type: "Page", text: "cgv conditions vente livraison retours précommande" },
  { title: "Mentions légales", subtitle: "Éditeur du site", href: "/mentions-legales", type: "Page", text: "mentions légales éditeur hébergeur" },
  { title: "Confidentialité", subtitle: "Données personnelles et cookies", href: "/confidentialite", type: "Page", text: "confidentialité données cookies rgpd" },
];

// Built once from the same data the pages use, so search never drifts from the site.
const INDEX: SearchEntry[] = [
  ...products.map((product) => ({
    title: `${product.name} ${product.colorName}`,
    subtitle: `${product.price} € · ${product.colorName}`,
    href: `/collection/${product.slug}`,
    type: "Produit" as const,
    text: `${product.name} ${product.colorName} ${product.description} ${product.material} ${product.cut} t-shirt`,
  })),
  ...PAGES,
  ...posts.map((post) => ({
    title: post.title,
    subtitle: post.excerpt,
    href: "/journal",
    type: "Journal" as const,
    text: `${post.title} ${post.excerpt}`,
  })),
];

// Lowercase and strip accents, so "ecole" finds "école" and "t-shirt" finds "T-shirt".
export function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function search(query: string): SearchEntry[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return INDEX.filter((entry) => {
    const haystack = normalize(`${entry.title} ${entry.subtitle} ${entry.text}`);
    return terms.every((term) => haystack.includes(term));
  });
}
