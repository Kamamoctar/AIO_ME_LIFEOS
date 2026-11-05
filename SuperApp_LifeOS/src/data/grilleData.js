export const GRILLE_DATA = {
  "meta": { "version": 1, "note": "Source : grille de destin. Phrases incomplètes de la source → champ « règles additionnelles » libre dans Réglages." },
  "profil": {
    "signe": "Gémeaux (3e décan) — vertu : patience",
    "dateNaissance": null,
    "etapesChance": [[27,40],[42,58],[61,73]],
    "alertesAge": { "27": "Beaucoup d'ennemis issus du milieu d'origine — prudence renforcée", "adulte": "Perturbation de santé possible — surveiller l'alimentation" },
    "longevite": "Au-delà de 83 ans",
    "protection": "Astre fort : malveillances, mauvais sorts et mauvais œil écartés ; attire l'admiration"
  },
  "semaine": {
    "favorables": ["lundi","mercredi","vendredi"],
    "variables": ["mardi","jeudi","samedi","dimanche"],
    "regleVariable": "Matins difficiles, soirs bons — éviter les engagements financiers"
  },
  "moisFavorables": ["fevrier","avril","juin","juillet","octobre","decembre"],
  "guideDuMois": {
    "1":  { "texte": "Variable, matin comme soir", "impacts": {} },
    "2":  { "texte": "Difficile — éviter les dépenses imprévues", "impacts": { "finance": -2 } },
    "3":  { "texte": "Matin difficile, soir bon", "impacts": { "matin": -1, "soir": 1 } },
    "4":  { "texte": "Bon pour les recherches", "impacts": { "decisions": 1 } },
    "5":  { "texte": "Prudence — éviter longs voyages et déplacements imprévus", "impacts": { "voyages": -2 } },
    "6":  { "texte": "Visites aux aînés/autorités — affaires d'argent favorables", "impacts": { "finance": 2, "social": 1 } },
    "7":  { "texte": "Veillée de prière et propreté — lumière divine", "impacts": { "spirituel": 2 } },
    "8":  { "texte": "Bon pour la recherche de prospérité", "impacts": { "finance": 2 } },
    "9":  { "texte": "Améliorer sa santé si un mal traîne", "impacts": { "sante": 1 } },
    "10": { "texte": "Ne prêter ni emprunter d'argent", "impacts": { "finance": -3 } },
    "11": { "texte": "Augmenter ses avoirs — réussite, gain de cause", "impacts": { "finance": 3 } },
    "12": { "texte": "Ne pas visiter les relations difficiles", "impacts": { "social": -1 } },
    "13": { "texte": "Voyages lointains favorables — succès des activités", "impacts": { "voyages": 2 } },
    "14": { "texte": "Contacts intimes du couple favorables — progéniture heureuse", "impacts": { "couple": 2 } },
    "15": { "texte": "Variable sur 24 h", "impacts": {} },
    "16": { "texte": "Réconciliations — prières et cérémonies spéciales", "impacts": { "spirituel": 2, "social": 1 } },
    "17": { "texte": "Jeûne conseillé — éviter le trop pimenté", "impacts": { "spirituel": 1 } },
    "18": { "texte": "Matin bon de l'aube à midi — éviter discussions dures — si difficulté : aumône (1 m de tissu blanc + 11 pièces blanches à un mendiant guidé)", "impacts": { "matin": 1 } },
    "19": { "texte": "Démarches et contacts avec des personnalités", "impacts": { "decisions": 2, "finance": 1 } },
    "20": { "texte": "Début du déclenchement des choses heureuses (bonus du 20 au 29)", "impacts": { "global": 1 } },
    "21": { "texte": "Surprises agréables — personnalités et autorités chercheront votre aide", "impacts": { "social": 2 } },
    "22": { "texte": "Bon pour déclarer des décisions — elles seront acceptées", "impacts": { "decisions": 3 } },
    "23": { "texte": "Journée difficile — soupe uniquement (éviter complications digestives)", "impacts": { "global": -2, "sante": -1 } },
    "24": { "texte": "Variable — ne pas se débarrasser de son alliance/bague", "impacts": {} },
    "25": { "texte": "Éviter les promenades familiales en groupe", "impacts": { "social": -1 } },
    "26": { "texte": "Coucher seul si possible — révélations discrètes — aumône le lendemain si réalisation", "impacts": { "spirituel": 1 } },
    "27": { "texte": "Chance générale — jeûne/carême si possible", "impacts": { "global": 3, "spirituel": 1 } },
    "28": { "texte": "Aumône — contre l'esclavage et l'orgueil des biens", "impacts": { "spirituel": 1 } },
    "29": { "texte": "Occasions de joie en famille — renforce les liens", "impacts": { "social": 2 } },
    "30": { "texte": "Cadeaux inattendus de personnes en froid : recevoir sans en jouir", "impacts": { "finance": -1 } },
    "31": { "texte": "Non spécifié — traité comme variable (éditable)", "impacts": {} }
  },
  "spirituel": {
    "prieresHebdomadaires": [
      { "jour": "lundi", "heure": null, "texte": "4 rakats + Tousbih (chapelet) — heure configurable" },
      { "jour": "mardi", "heure": "13:30", "texte": "4 rakats" },
      { "jour": "mercredi", "heure": "00:00", "texte": "6 rakats" },
      { "jour": "jeudi", "heure": "01:00", "texte": "6 rakats + Nafila + Tousbih" },
      { "jour": "vendredi", "heure": "16:00", "texte": "4 rakats après l'Asr" }
    ],
    "sacrificeAnnuel": {
      "quand": "Un vendredi à 16:00 — même créneau que la prière du vendredi (unifier en un seul bloc rituel)",
      "elements": ["Bélier blanc", "165 F × 41 = 6 765 F", "41 kolas blancs", "Tenue complète de prière (femme)", "Vêtement complet de prière (homme)", "Turban", "Parasol"]
    },
    "jeunes": [17, 27], "aumones": [18, 28], "veilles": [7, 16, 26]
  },
  "alimentation": {
    "reglesPermanentes": ["moins d'huile", "moins de sucre", "moins de graisse animale"],
    "totheme": "Éviter les viandes à quatre pattes, surtout en juin, août et décembre",
    "venSamDim": "Éviter alcool, cigarette, fruits trop sucrés (surtout vendredi, samedi, dimanche)",
    "apaisement": "Soupe de poisson, fromage et légumes (concentration ; les désirs se réalisent en moins de 3 jours)",
    "vigilances": ["yeux", "ventre"]
  },
  "relations": {
    "mariage": { "signesFavorables": ["Bélier", "Balance", "Poissons"], "ideal": "corpulence moyenne, teint noir, pas de taille courte" },
    "amitiesAVerifier": "Personnes me dépassant beaucoup en âge, surtout teint clair / cheveux roux (trahisons) ; l'ami de quelqu'un en qui je n'ai pas confiance (envoûtements)",
    "ennemis": "À partir de 27 ans, issus du milieu d'origine ; difficultés venant du proche entourage",
    "territoire": "Vie meilleure hors du milieu d'origine, sans jamais abandonner les siens ; prudence partout",
    "argent": "Argent licite vécu avec bonheur ; partage au foyer et vers les proches ; main secourable"
  },
  "symboles": { "couleurs": ["rose", "bleu ciel", "marron"], "parfums": ["Muskou (musc)", "Zanfran (safran)", "Mawaradi"] }
}

