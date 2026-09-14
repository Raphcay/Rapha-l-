# Arc

Site vitrine de **Arc**, marque de vêtements techniques (première pièce : un t-shirt en coton épais, produit en série limitée).

Stack : Next.js (App Router) + TypeScript + Tailwind CSS v4.

Direction artistique : **Blanc Studio** — fond papier clair, accent vert forêt, typographie serif (Fraunces) + sans (Public Sans) + mono (IBM Plex Mono) pour les libellés techniques.

## Lancer le projet en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Structure

```
src/
  app/
    page.tsx           # Accueil
    collection/         # Grille produits (t-shirts)
    a-propos/            # Histoire de la marque
    journal/             # Blog / actualités
    contact/             # Formulaire de contact
  components/            # Nav, Footer, Mark (logo), ProductVisual, ContactForm
  data/                  # products.ts, posts.ts — contenu éditable sans toucher au design
```

## À faire avant mise en ligne

- Remplacer les emplacements produit (`ProductVisual`) par les vraies photos/rendus des t-shirts.
- Brancher le formulaire de contact à un service d'envoi (actuellement il ouvre le client email via `mailto:`).
- Ajouter le paiement en ligne si la boutique doit vendre directement (Stripe).
- Adapter `src/data/products.ts` et `src/data/posts.ts` au vrai catalogue et aux vrais articles.

## Déploiement

Le plus simple : [Vercel](https://vercel.com/new) (créateurs de Next.js), déploiement automatique à chaque push.
