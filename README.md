# Arc

Site vitrine de **Arc**, marque de vêtements techniques (première pièce : un t-shirt en coton épais, produit en série limitée).

Stack : Next.js (App Router) + TypeScript + Tailwind CSS v4 + Framer Motion + API Google Gemini (assistant client).

Direction artistique : **Noir Absolu** — fond sombre, hero plein cadre en photo, typographie condensée majuscule (Anton) + sans (Work Sans) + mono (IBM Plex Mono) pour les libellés techniques.

## Lancer le projet en local

```bash
npm install
cp .env.example .env.local   # puis renseigner GEMINI_API_KEY (voir plus bas)
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
  components/               # Nav, Footer, Mark (logo), Hero (parallaxe),
                             # ProductVisual (zoom interactif), TintedProductImage (photo + teinte coloris),
                             # ContactForm, ChatWidget, ScrollReveal, AnimatedNumber, MagneticButton
  data/                     # products.ts, posts.ts — contenu éditable sans toucher au design
  lib/chat-context.ts       # Base de connaissance de l'assistant, générée depuis data/
public/
  hero-mountain.jpg          # Photo de fond du hero (fournie)
  products/                  # Photos produit détourées (fournies + retouchées)
```

## Rendu produit

Les photos du premier drop (fournies par la marque) sont dans `public/products/` — fond détouré en transparent (`arc-tee-front.png`, `arc-tee-back.png`, + 3 détails macro : logo, col, épaule). Un seul coloris a été photographié (**Blanc**) ; les 3 autres (**Noir**, **Gris**, **Beige**) sont obtenus en **teintant la même photo par CSS** (`TintedProductImage.tsx` — la couleur du produit est appliquée en `mix-blend-mode: multiply`, masquée sur la silhouette réelle du vêtement via `mask-image`) : c'est donc toujours la vraie texture du tissu, juste recolorée, pas une illustration. À remplacer coloris par coloris dès que ces variantes sont réellement photographiées (ajouter un champ image dédié par coloris dans `products.ts`).

`ProductVisual` ajoute une interaction de **zoom sur points d'intérêt** : trois pastilles (coupe/taille, mark, matière) qui, au survol ou au clic, font un fondu vers la photo macro correspondante (`getHotspots` dans `ProductVisual.tsx`) et affichent une légende tirée de `src/data/products.ts`. Un bouton "Voir le dos" bascule vers la photo du dos.

Le hero (`src/components/Hero.tsx`) affiche `public/hero-mountain.jpg` en plein cadre avec un **effet de parallaxe** au scroll (l'arrière-plan défile plus lentement que le contenu, via Framer Motion `useScroll`/`useTransform`, désactivé sous `prefers-reduced-motion`).

## Assistant client IA (autonome)

Un widget de chat (bas à droite, sur toutes les pages) répond automatiquement aux questions des visiteurs — produits, matières, précommande, contact — via l'API **Google Gemini** (`gemini-3.6-flash`, gratuite). Le contexte envoyé au modèle est généré à partir de `src/data/products.ts` et `src/data/posts.ts` : toute modification du catalogue met donc à jour les réponses de l'assistant sans rien reconfigurer.

**Pour l'activer (gratuit) :**

1. Créer une clé sur [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (compte Google, aucune carte bancaire requise pour le quota gratuit).
2. La renseigner en local dans `.env.local` (`GEMINI_API_KEY=...`), et en production dans les variables d'environnement de l'hébergeur (ex. Vercel → Project Settings → Environment Variables), puis redéployer.
3. Sans clé configurée, le widget reste visible mais affiche un message d'indisponibilité propre (pas de crash).

Le quota gratuit de Gemini est limité en nombre de requêtes par minute/jour — largement suffisant pour un site qui démarre. S'il devient trop juste, Google propose un passage en facturation à l'usage sans changer de code.

**Garde-fous en place** (`src/app/api/chat/route.ts`) :
- Limitation de débit basique par IP (15 messages / 5 min) — best-effort, à remplacer par un vrai rate limiter (Upstash, etc.) si le trafic grossit.
- Longueur de message et historique plafonnés.
- Consignes strictes dans le prompt système (`src/lib/chat-context.ts`) : jamais d'invention de statut de commande, de délai de livraison ou de politique non listée — l'assistant renvoie vers `contact@arc-wear.com` dans le doute.

## Formulaire de contact

Le formulaire (`src/components/ContactForm.tsx`) envoie vraiment les messages par email via **Web3Forms** (gratuit, ~250 envois/mois).

**Pour l'activer (gratuit) :**

1. Va sur [web3forms.com](https://web3forms.com), entre l'adresse email qui doit recevoir les messages du site (ex. la vraie boîte derrière `contact@arc-wear.com`) — pas de compte à créer.
2. Une clé d'accès arrive par email, à copier.
3. Renseigner `NEXT_PUBLIC_WEB3FORMS_KEY` en local (`.env.local`) et sur l'hébergeur (Vercel → Environment Variables), puis redéployer.

Sans clé configurée, le formulaire revient au comportement précédent : il ouvre le client email du visiteur (`mailto:`) au lieu d'envoyer directement — fonctionnel mais moins fiable (tout le monde n'a pas de client email configuré), donc à activer dès que possible.

## Responsive

Testé sans débordement horizontal sur mobile (375px), tablette (768px) et desktop (1440px), sur les 5 pages. Grilles produit en 1/2/4 colonnes selon la largeur, hero et typographie fluides, nav mobile dédiée. Le header devient opaque dès qu'on scrolle (`Nav.tsx`) pour rester lisible par-dessus le contenu qui défile.

## SEO

- **Métadonnées** par page (title, description, canonical) + Open Graph et Twitter Card avec image générée automatiquement (`src/app/opengraph-image.tsx`).
- **`sitemap.xml`** (`src/app/sitemap.ts`) et **`robots.txt`** (`src/app/robots.ts`), générés automatiquement à partir des routes du site.
- **`manifest.webmanifest`** (`src/app/manifest.ts`) — icône, couleurs, nom — pour l'ajout à l'écran d'accueil sur mobile.
- **Données structurées JSON-LD** : `ClothingStore` sur tout le site (`layout.tsx`), `Product`/`Offer` sur la page Collection (`collection/page.tsx`), pour l'éligibilité aux résultats enrichis Google.
- Tout ça dépend de l'URL réelle du site : **renseigner `NEXT_PUBLIC_SITE_URL`** (voir `.env.example`) avec le vrai domaine une fois déployé, sinon les métadonnées pointent vers un domaine provisoire.

## À faire avant mise en ligne

- Renseigner `NEXT_PUBLIC_SITE_URL` avec le vrai domaine (SEO — voir ci-dessus).
- Photographier les coloris Noir/Gris/Beige pour remplacer la teinte CSS par de vraies photos (voir "Rendu produit" ci-dessus).
- Confirmer le nombre de tailles réellement produites par coloris (XS-XXL listé pour l'instant).
- Configurer `GEMINI_API_KEY` pour activer l'assistant client (gratuit).
- Configurer `NEXT_PUBLIC_WEB3FORMS_KEY` pour activer l'envoi réel du formulaire de contact (gratuit — voir "Formulaire de contact" ci-dessus).
- Ajouter le paiement en ligne si la boutique doit vendre directement (Stripe).
- Adapter `src/data/products.ts`, `src/data/posts.ts` et la politique dans `src/lib/chat-context.ts` au vrai catalogue et aux vraies conditions.

## Prochaine étape (plus tard, pas maintenant)

Un système de commande/livraison autonome (déclenchement automatique de commande fournisseur + expédition directe au client) est prévu **une fois le site, le catalogue et l'assistant stabilisés** — il suppose d'abord un vrai moyen de paiement (Stripe) et un fournisseur/imprimeur avec une API ou un flux de commande automatisable. Non commencé volontairement.

## Déploiement

Le plus simple : [Vercel](https://vercel.com/new) (créateurs de Next.js), déploiement automatique à chaque push. Ne pas oublier d'y renseigner `GEMINI_API_KEY`.
