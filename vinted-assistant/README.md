# Vinted Assistant

Outil **local et gratuit** (Python + Playwright + SQLite) pour gérer ton compte Vinted France :
réponses aux acheteurs, republication aux meilleures heures, offres aux personnes qui ont liké,
veille des articles qui se vendent vite, et aide au sourcing DHgate.

- Aucune API payante, aucun service en ligne : tout tourne sur ton ordinateur.
- Tu te connectes **toi-même** dans une fenêtre Chromium. L'outil ne lit ni ne stocke jamais ton mot de passe.
- **Simulation (dry-run) par défaut** : l'outil affiche ce qu'il ferait. `--live` pour agir réellement.

> ⚠️ **À lire avant usage**
> - Les conditions d'utilisation de Vinted interdisent l'automatisation. Même avec des délais humains et des
>   plafonds bas, ton compte peut être restreint. L'outil s'arrête dès qu'il voit un captcha, un avertissement
>   ou une erreur 429/403, mais le risque reste le tien. Commence petit.
> - **Contrefaçon** : un article « de marque » vendu à bas prix sur DHgate est très souvent une contrefaçon, et la
>   revendre est illégal et interdit sur Vinted. Le module sourcing retire les marques des recherches et exclut de la
>   shortlist les produits liés à une marque. Ne revends que du sans-marque.
> - Acheter pour revendre de façon régulière relève d'une activité professionnelle (déclaration, statut
>   micro-entrepreneur, compte Vinted Pro). Renseigne-toi selon ton volume.

---

## Installation

Prérequis : Python 3.10 ou plus récent.

```bash
cd vinted-assistant
python -m venv .venv
source .venv/bin/activate          # Windows : .venv\Scripts\activate
pip install -r requirements.txt
python -m playwright install chromium
```

Optionnel, pour les notifications bureau sous Windows : `pip install plyer`. Sous macOS et Linux, les notifications
natives sont utilisées automatiquement.

## Premier lancement

```bash
# 1. Essayer sans navigateur, avec des données d'exemple (aucun accès à Vinted)
python main.py --demo replies
python main.py --demo republish
python main.py --demo offers
python main.py --demo scout
python main.py --demo sourcing
python main.py --demo status

# 2. Se connecter à Vinted (une seule fois : la session est conservée dans data/browser-profile)
python main.py login

# 3. Simulation sur TON compte : lectures réelles, aucune écriture
python main.py replies
python main.py republish
python main.py offers

# 4. Quand la simulation te convient : réel, en commençant petit
python main.py replies --live
python main.py republish --live --now --max 1 --item 1234567890   # une seule annonce choisie
python main.py offers --live --max 1
```

En mode réel, l'outil demande de taper `OUI` (sauf avec `--yes`, utile pour `run`).

## Commandes

| Commande | Rôle |
|---|---|
| `python main.py login` | Ouvre Chromium sur vinted.fr. Tu te connectes toi-même (captcha et code compris), puis tu appuies sur Entrée. |
| `python main.py replies` | Lit la messagerie, classe les messages et répond aux questions simples. |
| `python main.py republish [--now] [--max N] [--item ID]` | Republie les annonces de plus de X jours, dans les créneaux. |
| `python main.py offers [--max N]` | Envoie une offre aux membres qui ont ajouté l'annonce en favori. |
| `python main.py scout [--favourite]` | Veille best-sellers : snapshot, détection des ventes, classement CSV et HTML. |
| `python main.py sourcing` | Shortlist DHgate classée par marge. **Ne commande rien.** |
| `python main.py new-listing [--fill]` | Rédige une annonce pour un article reçu, avec tes photos. |
| `python main.py status` | Résumé : compteurs du jour et plafonds, messages à traiter, top veille, dernières actions. |
| `python main.py run [--plan] [--once]` | Planifie toute la journée selon les créneaux. `--plan` affiche le plan sans rien exécuter. |
| `python main.py flags [--close ID\|all]` | Liste ou clôt les messages signalés. |
| `python main.py resume` | Relance l'outil après un arrêt d'urgence. |

Options globales : `--live`, `--yes`, `--demo`, `-v` (logs détaillés), `--config`, `--templates`.

## Les modules

### 1. Réponses aux acheteurs
- Chaque message est classé par mots-clés (modifiables dans `templates.yaml`) : disponibilité, prix/négociation,
  envoi, taille/état, paiement hors Vinted, suspect, litige, autre.
- Réponse automatique **uniquement** pour : disponibilité, envoi, taille/état. Elle est composée avec ton ton :
  > Bonjour, oui l'article est toujours disponible ☺️. Je reste à votre disposition pour tout autre renseignement ou question !
- Infos de l'annonce insérées : taille, état, prix, délai d'envoi (« sous 2 jours »).
- **Jamais de réponse automatique** dans ces cas, seulement un signalement (notification + `status` / `flags`) :
  négociation de prix, litige, paiement hors Vinted (PayPal, virement, WhatsApp, téléphone, e-mail…), lien externe
  ou message suspect, message non reconnu, lot de plusieurs articles, article réservé ou vendu, info manquante
  dans l'annonce (par exemple une taille vide). Dans le doute, l'outil ne répond pas.
- Un message n'est traité qu'une fois (mémorisé en base). Les conversations où tu es l'acheteur sont ignorées.

### 2. Republication aux meilleures heures
- Éligible : annonce de plus de **14 jours** sans vente, non réservée ni masquée, et pas déjà republiée récemment.
- Créneaux par défaut : **7h30-9h** et **18h-21h**, tous les jours. Après 14 jours de relevés, l'outil calcule tes
  meilleures heures à partir des vues et favoris gagnés, jour par jour (`use_my_stats`).
- Ordre de sécurité : **backup** (`backups/<date>_<id>/annonce.json` + photos) → création de la copie (photos,
  titre, description, prix, taille, état, catégorie, marque) → vérification du nouvel identifiant → seulement
  ensuite **suppression** (ou masquage, `old_listing_action: hide`) de l'ancienne. Si la création échoue,
  l'ancienne annonce n'est pas touchée.
- Republications étalées dans les créneaux (30 min minimum entre deux), plafond de 15 par jour.

### 3. Offres aux personnes qui ont liké
- Utilise le bouton natif de Vinted « offre aux membres intéressés ». Sinon, offre individuelle si c'est possible.
  Sinon, signalement avec le prix suggéré pour que tu la fasses à la main.
- Remise tirée entre **-5 % et -10 %**, arrondie à 0,50 €, **jamais sous le plancher** : 90 % du prix par défaut, ou
  le montant que tu fixes par annonce :
  ```yaml
  offers:
    floors:
      "4123456789": 18.00
  ```
- Une seule offre par annonce tous les **7 jours** (mémorisé en base). Les annonces réservées ou masquées sont exclues.

### 4. Veille best-sellers
- Mots-clés dans `config.yaml` → `scout.keywords`. Lecture seule, au rythme humain.
- Chaque jour, un snapshot des résultats. Une annonce récente (moins de 21 jours) qui disparaît d'un jour à l'autre
  est une **vente probable**. Les plus likées sont vérifiées une par une : vendue, ou supprimée par le vendeur.
- Classement par marque et mot-clé, exporté dans `reports/classement_<date>.csv` et `.html` : prix moyen et médian,
  favoris, taux de vente, jours avant vente, score, liens. Les ventes apparaissent **à partir du 2ᵉ jour** de veille.
- `scout --favourite` ajoute en favori **seulement** les annonces que tu as listées dans `scout.favourite_approved`,
  dans la limite de 10 par jour.

### 5. Aide au sourcing DHgate
- Pour chaque produit du classement : lien de recherche DHgate (sans marque) et lecture seule de la page de
  résultats (prix, ventes, note, avis, délai si affiché).
- Marge estimée = prix Vinted moyen − (prix DHgate + livraison + emballage + frais vendeur Vinted). En France, la
  protection acheteur est payée par l'acheteur : elle est affichée (prix total acheteur), pas déduite.
- Rapport `reports/sourcing_<date>.csv` et `.html` classé par marge. Shortlist (en vert) : marge ≥ 5 € et sans marque.
- Si DHgate ne se lit pas (la page change, ou un blocage), saisis le prix à la main dans `sourcing.manual_quotes`.
- **Aucune commande, aucune annonce publiée** pour un article que tu n'as pas en main. À réception :
  `python main.py new-listing` te demande l'article, la taille, l'état et le dossier de **tes photos**, puis propose
  un titre, une description et un prix conseillé (médiane des prix observés − 5 %). `--fill` pré-remplit le
  formulaire Vinted : catégorie, marque et publication restent à faire par toi.

### Mode `run`
`python main.py run --live --yes` laisse tourner l'outil toute la journée, une tâche à la fois :
- messagerie relevée toutes les 20 à 45 min, entre 7h30 et 22h ;
- relevé vues/favoris toutes les ~2 h (il alimente le calcul des meilleurs créneaux) ;
- republications étalées dans les créneaux ;
- offres une fois par jour, dans le dernier créneau ;
- veille une fois par jour, en matinée.

Ctrl+C l'arrête proprement. `run --plan` montre le plan du jour sans rien exécuter.

## Garde-fous

| Garde-fou | Réglage |
|---|---|
| Délai aléatoire avant chaque lecture ou action | `human.min_delay_s` / `max_delay_s` (3 à 12 s) |
| Pause longue régulière | toutes les 5 à 9 actions, 1 à 4 min |
| Plafonds quotidiens (comptés séparément en simulation et en réel) | `limits` : 40 réponses, 30 offres, 15 republications, 10 favoris, 400 lectures |
| Arrêt immédiat + notification | captcha, page d'avertissement, compte restreint, HTTP 429/403, session expirée |
| Reprise manuelle obligatoire après un arrêt | `python main.py resume` |
| Une action à la fois | aucun parallélisme |

Le journal se trouve dans `logs/vinted-assistant.log`, la table `actions` de `data/vinted.sqlite`, et
`logs/alertes.log` pour les alertes.

## Configuration

- `config.yaml` : plafonds, délais, créneaux, remises, planchers, mots-clés de veille, paramètres de marge.
- `templates.yaml` : salutation, formule finale, une phrase par catégorie (plusieurs variantes possibles), et
  mots-clés de classement. Variables : `{titre} {taille} {etat} {prix} {marque} {delai_envoi} {prenom}`.

## Si Vinted change son site

L'outil passe par les appels internes du site web, depuis ta session. Vinted les modifie de temps en temps.
Si un module renvoie « HTTP 404 » ou « réponse non JSON » :
1. Ouvre les outils de développement de Chromium (F12), onglet Réseau, et refais l'action à la main sur le site.
2. Repère le nouveau chemin (`/api/v2/...`) et mets-le dans `config.yaml` :
   ```yaml
   vinted:
     endpoints:
       item_details: /api/v2/items/{id}
   ```
3. Les sélecteurs d'interface (bouton d'offre aux favoris) sont regroupés en haut de
   `vinted_assistant/clients/vinted_web.py` (`UI`).

L'offre individuelle à un membre n'a pas d'équivalent connu sur le site web. Tant que Vinted ne la propose pas,
l'outil te signale l'offre à faire à la main. L'extension se fait dans `send_individual_offer`.

## Tests

```bash
python -m pytest -q
```

Les tests utilisent un client factice (`vinted_assistant/clients/fake.py`) et ne touchent jamais Vinted. Ils
vérifient notamment :
- le classement des messages, et qu'aucune réponse ne part pour un prix, un litige ou une demande de paiement hors Vinted ;
- le respect du plancher et de la période des offres ;
- l'ordre backup → création → suppression, et la conservation de l'ancienne annonce si la création échoue ;
- les plafonds, l'arrêt sur 429/403 et la reprise ;
- la détection des ventes entre deux snapshots ;
- le retrait des marques dans le sourcing et l'absence de toute commande ;
- le respect des créneaux par le planificateur.

## Arborescence

```
vinted-assistant/
├── main.py                     # commandes
├── config.yaml                 # réglages
├── templates.yaml              # modèles de réponse + mots-clés
├── requirements.txt
├── fixtures/demo.json          # données du mode --demo
├── vinted_assistant/
│   ├── app.py                  # contexte + exécution unique des actions (simulation / réel)
│   ├── config.py  db.py  journal.py  notify.py
│   ├── safety.py               # délais, plafonds, arrêt d'urgence
│   ├── classifier.py           # classement des messages
│   ├── templating.py           # génération des réponses
│   ├── pricing.py              # offres, planchers, marges
│   ├── slots.py                # créneaux (défaut / tes stats) et étalement
│   ├── clients/
│   │   ├── base.py             # modèles Item, Conversation, Message
│   │   ├── vinted_web.py       # client réel Playwright
│   │   └── fake.py             # client factice (démo, tests)
│   └── modules/
│       ├── replies.py  republish.py  offers.py  scout.py  sourcing.py
│       ├── new_listing.py  status.py  runner.py
└── tests/
```

Créés à l'usage (ignorés par git) : `data/` (base SQLite, profil navigateur, brouillons), `logs/`, `backups/`,
`reports/`.
