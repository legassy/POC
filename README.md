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
pnpm start               # lance tous les moteurs
pnpm start zfe           # lance uniquement le moteur ZFE
pnpm start safety        # lance uniquement le moteur Safety
pnpm dev                 # mode watch (relance à chaque modification)
```

## Tests

```bash
pnpm test          # tests unitaires (node:test)
pnpm typecheck     # vérification des types
```

## Structure du projet

```text
src/
├── index.ts                    # point d'entrée (argument : zfe | safety)
├── engines/
│   ├── zfe/                    # module 1 : détection ZFE (+ tests)
│   └── safety/                 # module 2 : détection des freinages (+ tests)
├── data/
│   ├── zfe/                    # polygone ZFE et trace GPS
│   ├── safety/                 # données accéléromètre
│   │   └── output/             # daily_score.json (généré)
│   └── test/                   # fichiers volontairement cassés
│       ├── zfe/
│       └── safety/
├── types/                      # types partagés
├── utils/                      # lecture de fichiers
└── assets/                     # images du README
```

## Module 1 — ZFE

Aperçu du polygone et du trajet GPS :

![Polygone ZFE et trace GPS](./src/assets/image/polygone_zfe_lyon_trace_gps.png)

Convention : **lon = x, lat = y**.

### Périmètre

**Bounding box**

Pour éviter les calculs inutiles dans le code, j'ai commencé par ne garder que les points situés dans la bounding box, grâce aux min et max des abscisses et des ordonnées.
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

**Le cas du point 3**

Le jeu de données indique `"expected": "IN (Bordure)"` pour le point 3 (lat: 45.785, lon: 4.805) mais le moteur le classe à l'extérieur et c'est volontaire.
Je n'ai pas introduit de notion de « bordure »pour cette premiere version,un point est soit dans la zone, soit en dehors.
Un test unitaire compare le résultat du moteur à la valeur `expected` de chaque point et vérifie que le point 3 est le seul écart.

**Tests de robustesse**

Plusieurs cas sont pris en compte :

- fichier JSON malformé (exemple : il manque un crochet fermant à la liste)
- un polygone de moins de 3 points n'est pas un polygone
- la latitude et la longitude sont obligatoirement des nombres (`number`) : un polygone invalide lève une erreur, un point GPS invalide est ignoré et les autres points sont traités
- un point GPS `null` est ignoré avec un avertissement, sans arrêter le traitement
- le cas où les données du polygone et du camion ne sont pas fournies
- fichier vide

## Module 2 — Safety

Détection des freinages violents pour le bonus assurance.

**Lecture**

Le fichier CSV est lu en flux (stream), ligne par ligne, en un seul passage : la complexité est donc en O(n).
Seuls les événements filtrés sont conservés en mémoire, pas l'ensemble du fichier.

**Filtrage**

Le filtrage porte sur l'axe Y, car c'est l'axe longitudinal (avant/arrière).
Une valeur est retenue lorsque la décélération dépasse le seuil de 2,5 m/s², c'est-à-dire lorsque `acc_y < -2.5`.
Dans l'énoncé, le seuil de détection est de 2,5 G, or 2,5 G ≈ 24,5 m/s², ce qui ne déclencherait aucun événement : je suis donc parti sur 2,5 m/s².

**Daily score**

J'ai pris la date de la première ligne valide du fichier comme date de référence de la journée ce qui permet d'avoir une date même quand aucun freinage n'est détecté.
J'ai ensuite ajouté d'autres informations qui me semblent utiles : l'unité, le seuil, un compteur, les événements et le score.

Le score est calculé avec la formule suivante : `100 - (nombre d'événements × 5)`, avec un minimum de 0.
J'ai choisi la valeur 5 pour accepter 10 fautes maximum : au-delà de 10 fautes, le score tombe sous 50, c'est-à-dire sous la moyenne d'un score sur 100. Cette valeur de `5` peut être ajustée selon le nombre de freinages violents tolérés.

Format choisi :

```jsonc
{
  "date": "2023-03-15", // date de la journée analysée
  "count": 1, // nombre d'événements
  "unit": "m/s²", // unité des mesures
  "threshold": -2.5, // seuil utilisé
  "events": [
    // événements détectés
    {
      "timestamp": 1678880005,
      "acc_x": 0.25,
      "acc_y": -3.45,
      "acc_z": 9.65,
    },
  ],
  "score": 95, // score journalier
}
```

**Fichiers**

```text
src/data/safety/
├── accelerometer_data.csv      # fichier lu (entrée)
└── output/
    └── daily_score.json        # fichier exporté (sortie)
```

**Tests de robustesse**

Plusieurs cas sont pris en compte (fichiers dans `src/data/test/safety/`) :

- fichier vide : erreur
- fichier qui ne contient que l'en-tête : erreur
- valeur non numérique : la ligne est ignorée avec un avertissement
- ligne incomplète : la ligne est ignorée avec un avertissement
- aucun freinage violent : score parfait de 100
- nombreux freinages : le score ne descend jamais sous 0

**Bibliothèques utilisées**

- [`dayjs`](https://www.npmjs.com/package/dayjs) : conversion du timestamp Unix en date lisible pour les logs
- [`csv-parser`](https://www.npmjs.com/package/csv-parser) : lecture et découpage (parsing) du CSV ligne par ligne, en flux

**Résultat attendu :**

```
[ALERT SAFETY] 2023-03-15 12:33: Harsh braking detected (acc_y: -3.45)
```
