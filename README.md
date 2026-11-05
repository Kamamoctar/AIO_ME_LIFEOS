# 👑 AIO LifeOS — SuperApp Unifiée

SuperApp mobile Android (APK) personnelle, 100% hors-ligne et souveraine, fusionnant en une seule application cohérente :
1. **Solo Leveling (Silent Monarch)** : Système RPG, stats (STR, INT, CHA, VIT, DSC, WLT, SPI), streaks NoFap/Quêtes, Protocole SOS Tentation et Calisthenics Corps de Thor.
2. **Système MK** : Règle R1 des 3 projets actifs max, boîte à idées sous séquestre 30 jours, priorité absolue du jour, 4 blocs de temps, Contrat de Saturne (10 ans).
3. **Zone d'Évolution (v1.7)** : Catalogue de 141 micro-actions, Trio de Focus d'habitudes, gestion des récurrences et rendez-vous espacés (coiffure, bilans).
4. **FinanceOS Foyer** : Budget par enveloppes, projection de trésorerie sur 120 jours, jauge d'objectifs (203 000 → 733 333 FCFA), mode Foyer partagé.
5. **Misbaha & Mon Astre** : Moteur astronomique de calcul des 5 prières hors-ligne, décompte temps réel, grand Tasbih tactile persistant, cures de 40 jours (Ya-Aziz), mémorisation du Coran et grille des 45 jours / 9 intentions.

---

## 📱 Fichier APK Compilé
Le fichier binaire Android compilé et prêt à installer est disponible directement à la racine :
👉 `AIO_LifeOS.apk` (4,28 Mo)

---

## 🚀 Structure du Projet
- `SuperApp_LifeOS/` : Code source unifié React 19 + TypeScript + Vite + Tailwind CSS + Capacitor Android.
  - `src/components/DashboardView.jsx` : Statut du joueur, rangs E à S, stats, streaks, boss d'inertie.
  - `src/components/DailyView.jsx` : Quêtes quotidiennes, priorité MK, 4 blocs de temps, trio focus, rituels matin/soir & journal tête/cœur/mental.
  - `src/components/ProjectsView.jsx` : Les 3 projets stricts, 5 donjons business, boîte à idées 30j, récurrences espacées, catalogue 141 actions.
  - `src/components/SpiritualView.jsx` : 5 prières Adhan en direct, Tasbih digital tactile haute précision, cure 40j, Coran, grille 45j.
  - `src/components/FinancesView.jsx` : Jauge de revenus, budget enveloppes, cashflow 120 jours, transactions foyer.
  - `src/components/SystemView.jsx` : Corps de Thor (calisthenics, minuteur de repos, handstand), Contrat de Saturne, bilans hebdo/mois, défi 30j, sauvegarde JSON.
  - `src/components/PanicModal.jsx` : Protocole d'urgence Pureté (respiration 4-4-4, 20 pompes tactiles, Istighfar...).

---

## 🛠️ Compilation Locale
```bash
cd SuperApp_LifeOS
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```
L'APK debug sera généré dans `android/app/build/outputs/apk/debug/app-debug.apk`.

