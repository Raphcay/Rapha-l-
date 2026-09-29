# Jarvis — double clap → bureau

Écoute ton micro. Quand tu claques deux fois dans les mains, ça :

1. Ouvre **VS Code** sur l'écran principal.
2. Ouvre une fenêtre **Safari** vide sur le deuxième écran (celui du dessus).
3. Fait dire par une voix ElevenLabs : *« Bonjour monsieur, que puis-je faire pour vous ? »*

Adapté de [hectorg2211/jarvis](https://github.com/hectorg2211/jarvis) pour macOS
(le projet d'origine est écrit pour Windows).

⚠️ Ce script tourne **sur ta machine**, pas dans un environnement distant : il a
besoin d'accéder à ton micro, ton écran et tes applications en local.

## Installation

Dans le dossier `jarvis/` (celui de ce README) :

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

macOS bloque `pip install` direct (erreur PEP 668 "externally managed") — c'est
pour ça qu'on passe par un environnement virtuel (`.venv`) dédié à ce projet.

## Configuration (voix ElevenLabs)

1. Copie `.env.example` en `.env` :
   ```bash
   cp .env.example .env
   ```
2. Remplis `ELEVENLABS_API_KEY` et `ELEVENLABS_VOICE_ID` dans `.env` (voir
   guide plus bas pour les obtenir).

Sans ces deux valeurs, Claude et Safari s'ouvrent quand même, mais sans la voix.

## Lancer

```bash
.venv/bin/python jarvis.py
```

macOS va demander l'autorisation d'accéder au micro la première fois — accepte.
Arrête avec `Ctrl+C`.

### Mode debug

Pour voir le niveau sonore mesuré et le seuil à chaque pic détecté (utile pour
régler la sensibilité) :

```bash
JARVIS_DEBUG=1 .venv/bin/python jarvis.py
```

## Réglages (en haut de `jarvis.py`)

| Constante | Effet |
| --- | --- |
| `SPIKE_RATIO` | Augmente si les claps se déclenchent tout seuls (voix, musique) ; diminue si les claps ne sont pas détectés. |
| `MIN_RMS` | Plancher absolu de volume pour qu'un pic compte. Augmente dans une pièce bruyante. |
| `CONFIRM_DROP_RATIO` | Un vrai clap retombe vite : le niveau doit descendre sous ce ratio du pic en 100ms. Augmente si des claps francs sont ignorés. |
| `MIN_DOUBLE_GAP_S` / `MAX_DOUBLE_GAP_S` | Fenêtre de temps acceptée entre les deux claps. |
| `COOLDOWN_S` | Temps d'attente après un double clap avant d'en accepter un nouveau. |

## Obtenir une clé ElevenLabs et un Voice ID

1. Crée un compte sur [elevenlabs.io](https://elevenlabs.io) (un plan gratuit suffit pour tester).
2. Clique sur ton icône de profil (en haut à droite) → **API Keys** → crée une clé,
   colle-la dans `ELEVENLABS_API_KEY`.
3. Va dans **Voices** → choisis une voix **parmi celles déjà dans "My Voices"**
   (les voix par défaut du compte) → copie son **Voice ID**, colle-le dans `ELEVENLABS_VOICE_ID`.

⚠️ **Piège plan gratuit** : si tu piques une voix dans la **Voice Library**
(bibliothèque publique) sans l'ajouter d'abord à "My Voices", l'API refuse avec
une erreur **402**. Utilise uniquement une voix déjà présente dans "My Voices"
pour rester sur le plan gratuit, ou clique "Add to my voices" sur celle qui te plaît
avant de récupérer son ID.

## Dépannage

- **Rien ne se passe quand je claque** : lance en mode debug (`JARVIS_DEBUG=1`)
  et regarde si le niveau dépasse le seuil affiché. Sinon, baisse `SPIKE_RATIO`
  ou `MIN_RMS`, ou claque plus près/fort.
- **Ça se déclenche tout seul en parlant/avec de la musique** : augmente
  `CONFIRM_DROP_RATIO` légèrement, ou `SPIKE_RATIO`.
- **Mauvais micro utilisé** : liste tes micros avec
  `.venv/bin/python -c "import sounddevice as sd; print(sd.query_devices())"`,
  puis mets l'index ou un bout du nom dans `JARVIS_INPUT_DEVICE` (`.env`).
- **Pas de voix** : vérifie `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` dans
  `.env`, et l'erreur affichée dans le terminal (402 = voix hors "My Voices" sur
  le plan gratuit).
- **Safari ne va pas sur le bon écran** : nécessite deux écrans détectés par
  macOS ; vérifie dans Réglages Système > Écrans que les deux sont bien branchés
  et disposés comme dans la vraie vie (celui du dessus doit être placé "au-dessus"
  dans l'arrangement des écrans).
