# Estimation

L'estimation immédiate sur ton site — pour les pros du sport dont le prix
dépend de quelques critères (ex : vente/installation d'équipements sportifs
à domicile).

Le visiteur répond à un questionnaire court, voit une fourchette de prix
immédiatement, puis laisse ses coordonnées pour un devis précis. Le pro
reçoit ses demandes classées par montant estimé.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite en développement
- Auth email/mot de passe maison (sessions en base, mots de passe hashés)
- Stripe Checkout pour l'abonnement (45€/mois)

## Démarrer en local

```bash
npm install
npx prisma migrate dev
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Base de données

Le fichier `prisma/schema.prisma` décrit le schéma. En développement, la
base est un simple fichier SQLite (`prisma/dev.db`, non versionné). En
production, `DATABASE_URL` pointera vers une base Postgres (Neon).
