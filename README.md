# Arc

Site vitrine de **Arc**, marque de vêtements techniques (première pièce : un t-shirt en coton épais, produit en série limitée).

Stack : Next.js (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion + Anthropic SDK (assistant client).

Direction artistique : **Noir Absolu** — fond sombre, hero plein cadre avec une illustration de montagne (dans l'esprit du mark ARC, voir `MountainHero`), typographie condensée majuscule (Anton) + sans (Work Sans) + mono (IBM Plex Mono) pour les libellés techniques.

## Lancer le projet en local

```bash
npm install
cp .env.example .env.local   # puis renseigner ANTHROPIC_API_KEY (voir plus bas)
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Structure

```
src/
  app/
    page.tsx              # Accueil
    collection/            # Grille produits (t-shirts)
    a-propos/               # Histoire de la marque
    journal/                # Blog / actualités
    contact/                # Formulaire de contact
    api/chat/route.ts       # Endpoint de l'assistant client IA (Claude)
  components/               # Nav, Footer, Mark (logo), MountainHero (hero illustré),
                             # ProductVisual (zoom interactif), TShirtIllustration (rendu produit),
                             # ContactForm, ChatWidget, ScrollReveal, AnimatedNumber, MagneticButton
  data/                     # products.ts, posts.ts — contenu éditable sans toucher au design
  lib/chat-context.ts       # Base de connaissance de l'assistant, générée depuis data/
```

## Rendu produit

`TShirtIllustration` est une **illustration vectorielle** du t-shirt (silhouette + mark ARC imprimé), déclinée par coloris — pas un rendu 3D photoréaliste ni une vraie photo. C'est un visuel honnête et léger en attendant les vraies photos/rendus 3D du produit (à commander séparément : photographe, ou un outil de rendu 3D dédié). Pour remplacer :

1. Déposer les vraies images dans `public/products/`.
2. Dans `src/components/ProductVisual.tsx`, remplacer `<TShirtIllustration product={product} />` par une balise `<Image>` pointant vers le fichier correspondant à `product.slug`.

`ProductVisual` ajoute une interaction de **zoom sur points d'intérêt** : trois pastilles (coupe/taille, mark, matière) qui, au survol ou au clic, zooment sur cette zone du visuel et affichent une légende descriptive tirée de `src/data/products.ts`. Fonctionne aussi avec une vraie photo une fois `TShirtIllustration` remplacée — les positions des pastilles (`x`/`y` en % dans `getHotspots`) sont à ajuster selon le nouveau visuel.

`MountainHero` est une illustration de montagne en SVG (pas une photo — voir la limite ci-dessous) utilisée en fond du hero de l'accueil. Le hero (`src/components/Hero.tsx`) a un **effet de parallaxe** au scroll : l'arrière-plan défile plus lentement que le contenu. Pour brancher une vraie photo : dans `Hero.tsx`, remplacer `<MountainHero />` par `<Image src="/hero-mountain.jpg" alt="" fill className="object-cover" />` (photo déposée dans `public/`) — l'effet de parallaxe s'applique automatiquement, aucune autre modification nécessaire.

## Assistant client IA (autonome)

Un widget de chat (bas à droite, sur toutes les pages) répond automatiquement aux questions des visiteurs — produits, matières, précommande, contact — via l'API Claude (`claude-opus-5`). Le contexte envoyé au modèle est généré à partir de `src/data/products.ts` et `src/data/posts.ts` : toute modification du catalogue met donc à jour les réponses de l'assistant sans rien reconfigurer.

**Pour l'activer :**

1. Créer une clé sur [console.anthropic.com](https://console.anthropic.com/settings/keys).
2. La renseigner en local dans `.env.local` (`ANTHROPIC_API_KEY=sk-ant-...`), et en production dans les variables d'environnement de l'hébergeur (ex. Vercel → Project Settings → Environment Variables).
3. Sans clé configurée, le widget reste visible mais affiche un message d'indisponibilité propre (pas de crash).

**Garde-fous en place** (`src/app/api/chat/route.ts`) :
- Limitation de débit basique par IP (15 messages / 5 min) — best-effort, à remplacer par un vrai rate limiter (Upstash, etc.) si le trafic grossit.
- Longueur de message et historique plafonnés.
- Consignes strictes dans le prompt système (`src/lib/chat-context.ts`) : jamais d'invention de statut de commande, de délai de livraison ou de politique non listée — l'assistant renvoie vers `contact@arc-wear.com` dans le doute.

## À faire avant mise en ligne

- Remplacer `TShirtIllustration` et `MountainHero` par les vraies photos/rendus (voir ci-dessus).
- Configurer `ANTHROPIC_API_KEY` pour activer l'assistant client.
- Brancher le formulaire de contact à un service d'envoi (actuellement il ouvre le client email via `mailto:`).
- Ajouter le paiement en ligne si la boutique doit vendre directement (Stripe).
- Adapter `src/data/products.ts`, `src/data/posts.ts` et la politique dans `src/lib/chat-context.ts` au vrai catalogue et aux vraies conditions.

## Prochaine étape (plus tard, pas maintenant)

Un système de commande/livraison autonome (déclenchement automatique de commande fournisseur + expédition directe au client) est prévu **une fois le site, le catalogue et l'assistant stabilisés** — il suppose d'abord un vrai moyen de paiement (Stripe) et un fournisseur/imprimeur avec une API ou un flux de commande automatisable. Non commencé volontairement.

## Déploiement

Le plus simple : [Vercel](https://vercel.com/new) (créateurs de Next.js), déploiement automatique à chaque push. Ne pas oublier d'y renseigner `ANTHROPIC_API_KEY`.
