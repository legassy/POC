# POC Edge computing

POC pour la tablette durcie **Zebra ET40** embarquée dans les camions.
Le script fonctionne **entièrement hors ligne** et traite deux missions :

| Module               | Mission                                                                | Algorithme                             |
| -------------------- | ---------------------------------------------------------------------- | -------------------------------------- |
| **ZFE** (Geo)        | Détecter l'entrée d'un camion dans la Zone à Faibles Émissions de Lyon | Bounding Box + Ray Casting             |
| **Safety** (Physics) | Détecter les freinages violents (boîte noire assurance)                | Seuil sur l'accélération longitudinale |

## Prérequis

- [Node.js](https://nodejs.org/fr/download) **≥ 22.18** (exécute TypeScript nativement, sans build)
- [pnpm](https://pnpm.io/fr/installation) (ou npm)

## Installation

```bash
git clone https://github.com/legassy/POC
cd POC
pnpm install
```

## Lancement

```bash
pnpm start zfe or safety # Argument are needed here to run the engine
```

## Tests

```bash
pnpm test          # tests unitaires (node:test)
pnpm typecheck     # vérification des types
```

## Structure du projet

```
src/
├── index.ts              # point d'entrée
├── data/                 # données d'entrée (mock)
├── engines/
│   └── zfe/              # module 1 : détection ZFE
├── types/                # types partagés
└── utils/                # lecture de fichiers
```

## Module 1 — ZFE

Aperçu du polygone et du trajet GPS :

![Polygone ZFE et trace GPS](./src/assets/image/polygone_zfe_lyon_trace_gps.png)

Convention : **lon = x, lat = y**.

### Périmètre

**Bounding box**

Pour éviter les calculs inutiles dans le code, j'ai commencé par filtrer les points qui sont uniquement dans la bounding box, grâce aux min et max des abscisses et des ordonnées.
Les points qui ne sont pas dans la bounding box sont directement ignorés.
Je ne calcule qu'une seule fois la bounding box au lancement du moteur ZFE.

**Ray casting**

Pour déterminer si le camion est dans une ZFE, on utilise sa position GPS actuelle et on trace un rayon virtuel horizontal vers la droite.
On compte ensuite le nombre de fois que ce rayon traverse les segments du polygone.
Si le nombre est pair, le camion est considéré comme extérieur au polygone. À l'inverse, si ce nombre est impair, le camion est dans le polygone.

**Résultat attendu pour les points dans la zone ZFE :**

```
[ALERT ZFE] 08:00:30: dans la zone ZFE (lat: 45.76, lon: 4.8357)
[ALERT ZFE] 08:00:40: dans la zone ZFE (lat: 45.75, lon: 4.85)
```

**Tests de robustesse**

Plusieurs cas sont pris en compte :

- fichier JSON malformé (exemple : il manque un crochet fermant à la liste)
- un polygone de moins de 3 points n'est pas un polygone
- la latitude et la longitude sont obligatoirement des nombres (`number`)
- le cas où les données du polygone et du camion ne sont pas fournies
- fichier vide

## Module 2 — Safety
