# LifeOS

LifeOS réunit six systèmes personnels dans une seule application Android hors
ligne : organisation quotidienne, évolution, finances, planification
personnelle, gamification et spiritualité.

## Modules intégrés

- **Aujourd'hui** : vue commune des priorités, focus, quêtes, rituels, prières
  et indicateurs financiers.
- **Évolution** : catalogue de 141 actions, trio de focus, validation quotidienne
  et XP par domaine.
- **Système MK** : priorité unique, quatre blocs, rituels, journal, boîte à idées
  temporisée et limite de trois projets actifs.
- **Mon Astre** : moteur local de lecture du jour et classement des 45 prochains
  jours selon une intention.
- **Royaume** : quêtes, XP, statistiques, rangs, donjons, entraînements et
  protocole SOS.
- **Misbaha** : calcul local des prières, programme de zikr, tasbih persistant,
  intentions et progression.
- **FinanceOS Foyer** : comptes, budgets, transactions, objectifs, patrimoine,
  investissements, décisions et simulations.

Les modules partagent la navigation, la page quotidienne et une sauvegarde JSON
globale. Les données de l'APK sont conservées sur l'appareil.

## Stack

- Next.js 16, React 19 et TypeScript
- Tailwind CSS, shadcn/ui, Radix UI et Lucide
- Zustand pour l'état client hors ligne
- Prisma/libSQL et Clerk pour le mode web/foyer optionnel
- Capacitor Android pour produire l'APK
- Vitest pour les moteurs métier

## Développement

Prérequis : Node.js 20 ou supérieur.

```bash
npm install
npm run dev
```

L'application web est disponible sur `http://localhost:3000`.

## Tests et vérifications

```bash
npm test
npx tsc --noEmit
```

Les tests couvrent notamment le moteur financier, les permissions du foyer, le
catalogue Évolution, Mon Astre et les horaires/programmes spirituels.

## Construire l'APK

Prérequis supplémentaires : Android SDK et JDK 21 ou supérieur. Le script
détecte automatiquement Android Studio ou un JDK compatible. La variable
`LIFEOS_JAVA_HOME` permet de désigner explicitement le JDK si nécessaire.

```bash
npm run build:apk
```

La commande effectue successivement :

1. l'export statique Next.js ;
2. la synchronisation Capacitor ;
3. la compilation Gradle ;
4. la copie du résultat vers `LifeOS.apk`.

L'APK, les dépendances et les sorties de build sont volontairement ignorés par
Git. Ils doivent être reconstruits localement ou dans une chaîne CI.

## Structure principale

```text
src/components/lifeos/      Socle FinanceOS et coquille applicative
src/components/modules/     Écrans des modules fusionnés
src/lib/lifeos/             Moteur financier et backend local
src/lib/modules/            État partagé des nouveaux modules
src/modules/destiny/        Moteur Mon Astre
src/modules/spiritual/      Calcul des prières, temporalité et cures
src/data/                   Catalogues et grilles réutilisés
tests/                      Tests métier et d'intégration
android/                    Projet Capacitor Android
```

Les six dossiers historiques situés à la racine du dépôt ne font pas partie de
ce projet et sont exclus de Git.
