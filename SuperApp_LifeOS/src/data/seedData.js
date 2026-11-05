export const initialPlayer = {
  codename: 'The Silent Monarch',
  level: 1,
  rank: 'E',
  xpTotal: 0,
  xpSpent: 0,
  streakQuests: 0,
  streakNoFap: 0,
  recordNoFap: 0,
  streakParoleOr: 0,
  weight: 65.0,
  targetWeight: 75.0,
  height: 172,
  currentIncome: 203000,
  targetIncome: 733333,
  lastActiveDate: new Date().toISOString().split('T')[0],
  soundEnabled: true,
  theme: 'dark',
  softRebootMode: false,
};

export const initialStats = {
  STR: { code: 'STR', name: 'Force', emoji: '🏋️', base: 15, xp: 0, description: 'Sport, callisthénie, endurance' },
  INT: { code: 'INT', name: 'Intelligence', emoji: '🧠', base: 35, xp: 0, description: 'Lecture, stratégie, OSINT, culture générale' },
  CHA: { code: 'CHA', name: 'Charisme', emoji: '💬', base: 20, xp: 0, description: 'Parole d’or, écoute active, prestance' },
  VIT: { code: 'VIT', name: 'Vitalité', emoji: '⚡', base: 25, xp: 0, description: 'Sommeil à 23h, nutrition, récupération' },
  DSC: { code: 'DSC', name: 'Discipline', emoji: '🎯', base: 12, xp: 0, description: 'Pureté NoFap, tenue des routines, régularité' },
  WLT: { code: 'WLT', name: 'Richesse', emoji: '💰', base: 8, xp: 0, description: 'Indépendance financière, projets, élevage, KDP' },
  SPI: { code: 'SPI', name: 'Spiritualité', emoji: '🕌', base: 30, xp: 0, description: 'Coran, 5 prières, Dhikr & Istighfar' },
};

export const initialDailyQuests = [
  {
    id: 'q_coran',
    emoji: '🕌',
    title: 'Coran — 5 versets + révision',
    bloc: 'matin',
    timeSlot: '06h00 - 06h15',
    stat: 'SPI',
    xp: 5,
    completed: false,
    subtasks: [
      { id: 'st_c1', title: 'Lire 1 page minimum avec méditation', completed: false },
      { id: 'st_c2', title: 'Mémoriser 5 nouveaux versets', completed: false },
      { id: 'st_c3', title: 'Réviser les versets des jours précédents', completed: false }
    ]
  },
  {
    id: 'q_workout',
    emoji: '🏋️',
    title: 'Entraînement Calisthenics (30 min)',
    bloc: 'matin',
    timeSlot: '06h15 - 06h45',
    stat: 'STR',
    xp: 5,
    completed: false,
    subtasks: [
      { id: 'st_w1', title: 'Échauffement articulations & poignets (5 min)', completed: false },
      { id: 'st_w2', title: 'Séance du jour (Push / Pull / Legs / Skills)', completed: false },
      { id: 'st_w3', title: 'Étirements et retour au calme (5 min)', completed: false }
    ]
  },
  {
    id: 'q_journal_matin',
    emoji: '📓',
    title: 'Journal Matin (3 intentions + gratitude)',
    bloc: 'matin',
    timeSlot: '06h45 - 07h00',
    stat: 'DSC',
    xp: 3,
    completed: false,
    subtasks: [
      { id: 'st_jm1', title: 'Définir la priorité absolue de la journée', completed: false },
      { id: 'st_jm2', title: 'Noter 3 gratitudes sincères', completed: false }
    ]
  },
  {
    id: 'q_trajet',
    emoji: '🎧',
    title: 'Podcast / Audiobook trajet intelligent',
    bloc: 'trajet',
    timeSlot: '07h00 - 07h40',
    stat: 'INT',
    xp: 3,
    completed: false,
    subtasks: [
      { id: 'st_tr1', title: 'Lancer un contenu éducatif (finance, élevage, OSINT)', completed: false },
      { id: 'st_tr2', title: 'Retenir au moins 1 idée actionnable', completed: false }
    ]
  },
  {
    id: 'q_parole_or',
    emoji: '🤐',
    title: 'Protocole Parole d’Or (70% Écoute, 30% Parle)',
    bloc: 'journee',
    timeSlot: 'Toute la journée',
    stat: 'CHA',
    xp: 3,
    completed: false,
    subtasks: [
      { id: 'st_po1', title: 'Filtrer avant de parler : Utile ? Nécessaire ? Bienveillant ?', completed: false },
      { id: 'st_po2', title: 'Rester calme et posé sans dispersion d’énergie', completed: false }
    ]
  },
  {
    id: 'q_purete',
    emoji: '🛡️',
    title: 'Pureté — Jour Clean NoFap (Priorité #1)',
    bloc: 'journee',
    timeSlot: 'Toute la journée',
    stat: 'DSC',
    xp: 10,
    completed: false,
    subtasks: [
      { id: 'st_pur1', title: 'Zéro contenu illicite ou déclencheur', completed: false },
      { id: 'st_pur2', title: 'En cas de tentation : 20 pompes + Istighfar immédiat', completed: false }
    ]
  },
  {
    id: 'q_business',
    emoji: '💰',
    title: 'Projet Business & Indépendance (30 min)',
    bloc: 'soir',
    timeSlot: '21h40 - 22h10',
    stat: 'WLT',
    xp: 5,
    completed: false,
    subtasks: [
      { id: 'st_b1', title: 'Ouvrir le donjon actif (Fables, Élevage, GED, OSINT)', completed: false },
      { id: 'st_b2', title: 'Travailler 30 min chrono sans distraction', completed: false },
      { id: 'st_b3', title: 'Noter la progression réalisée', completed: false }
    ]
  },
  {
    id: 'q_lecture',
    emoji: '📖',
    title: 'Lecture formatrice (30 min)',
    bloc: 'soir',
    timeSlot: '22h10 - 22h40',
    stat: 'INT',
    xp: 5,
    completed: false,
    subtasks: [
      { id: 'st_l1', title: 'Lire 30 min d’un livre de chevet (Atomic Habits, etc.)', completed: false },
      { id: 'st_l2', title: 'Consigner 1 leçon clé dans le carnet', completed: false }
    ]
  },
  {
    id: 'q_journal_soir',
    emoji: '📓',
    title: 'Journal Soir + Revue de journée (Tête/Cœur/Mental)',
    bloc: 'soir',
    timeSlot: '22h40 - 22h55',
    stat: 'DSC',
    xp: 3,
    completed: false,
    subtasks: [
      { id: 'st_js1', title: 'Bilan Tête : Qu’ai-je accompli et appris ?', completed: false },
      { id: 'st_js2', title: 'Bilan Cœur : Gratitudes et ressentis', completed: false },
      { id: 'st_js3', title: 'Vider le mental sur papier pour dormir serein', completed: false }
    ]
  },
  {
    id: 'q_sommeil',
    emoji: '💤',
    title: 'Dormir avant 23h00 (Extinction des feux)',
    bloc: 'soir',
    timeSlot: '23h00',
    stat: 'VIT',
    xp: 3,
    completed: false,
    subtasks: [
      { id: 'st_s1', title: 'Écrans éteints, chambre aérée, repos du guerrier', completed: false }
    ]
  }
];

export const initialWeeklyQuests = [
  { id: 'qw_skill', emoji: '🧠', title: 'Apprendre une compétence nouvelle', stat: 'INT', xp: 50, completed: false },
  { id: 'qw_social', emoji: '💬', title: 'Défi social : sortir de sa zone de confort', stat: 'CHA', xp: 50, completed: false },
  { id: 'qw_revue', emoji: '📊', title: 'Revue hebdomadaire complète du dimanche', stat: 'DSC', xp: 30, completed: false },
  { id: 'qw_workout_long', emoji: '🏋️', title: 'Entraînement long du weekend (1h30+)', stat: 'STR', xp: 30, completed: false },
  { id: 'qw_business_step', emoji: '💰', title: 'Avancement majeur sur un projet business', stat: 'WLT', xp: 50, completed: false }
];

export const initialMonthlyBoss = {
  id: 'boss_m1',
  name: "L'INERTIE",
  description: "Le boss primordial qui empêche l'opérationnalisation de tes rêves. Terrasse-le en accomplissant tes objectifs du mois.",
  rewardXp: 500,
  penaltyXp: 200,
  rewardTitle: "Tueur d'Inertie",
  targets: [
    { id: 't1', label: 'Compléter 25/30 jours de quêtes quotidiennes', current: 0, max: 25, unit: 'jours' },
    { id: 't2', label: 'Atteindre 30 jours consécutifs de Pureté (NoFap)', current: 0, max: 30, unit: 'jours' },
    { id: 't3', label: 'Écrire 5 fables complètes pour le Livre #1', current: 0, max: 5, unit: 'fables' },
    { id: 't4', label: 'Recherche complète élevage poulets (fournisseurs, coûts, lieu)', current: 0, max: 1, unit: 'dossier' },
    { id: 't5', label: 'Créer et optimiser son profil LinkedIn freelance GED', current: 0, max: 1, unit: 'profil' },
    { id: 't6', label: 'Mémoriser 2 pages entières du Coran', current: 0, max: 2, unit: 'pages' },
    { id: 't7', label: 'Tenir le handstand au mur pendant 45 secondes', current: 0, max: 45, unit: 'sec' },
    { id: 't8', label: 'Lire 2 livres complets de la bibliothèque', current: 0, max: 2, unit: 'livres' },
    { id: 't9', label: 'Économiser 40 000 FCFA sur le compte business', current: 0, max: 40000, unit: 'FCFA' },
  ]
};

export const initialBusinessProjects = [
  {
    id: 'biz_kdp',
    name: '📚 Donjon 1 : Écriture & Amazon KDP',
    potential: '30 000 – 150 000 FCFA / mois',
    cost: '0 FCFA (coût quasi nul)',
    status: 'en_cours',
    description: 'Auto-édition de fables africaines et poésie. Actif passif à forte valeur culturelle.',
    steps: [
      { id: 'kdp_1', text: 'Écrire la Fable 1 : Le Lièvre et l’Aigle', completed: true },
      { id: 'kdp_2', text: 'Écrire la Fable 2 : L’Ombre du Baobab', completed: false },
      { id: 'kdp_3', text: 'Écrire la Fable 3 : Le Forgeron et la Rivière', completed: false },
      { id: 'kdp_4', text: 'Écrire la Fable 4 : Le Chasseur Patient', completed: false },
      { id: 'kdp_5', text: 'Écrire la Fable 5 : Le Chant du Griot', completed: false },
      { id: 'kdp_6', text: 'Relecture minutieuse et corrections de style', completed: false },
      { id: 'kdp_7', text: 'Créer la couverture sur Canva (format KDP broché & ebook)', completed: false },
      { id: 'kdp_8', text: 'Créer le compte Amazon KDP & configurer les paiements', completed: false },
      { id: 'kdp_9', text: 'Mise en page du manuscrit & publication officielle', completed: false },
    ]
  },
  {
    id: 'biz_poulets',
    name: '🐔 Donjon 2 : Aviculture & Élevage de Poulets',
    potential: '150 000 – 500 000 FCFA / cycle (6-8 sem.)',
    cost: '150 000 – 300 000 FCFA initial',
    status: 'non_demarre',
    description: 'Élevage de 100 à 200 poulets de chair. Rotation rapide avec forte demande locale.',
    steps: [
      { id: 'p_1', text: 'Rechercher et comparer les couvoirs et fournisseurs de poussins', completed: false },
      { id: 'p_2', text: 'Chiffrer le budget : poussins, provende démarrage/croissance, vaccins', completed: false },
      { id: 'p_3', text: 'Identifier et sécuriser l’espace / poulailler ventilé', completed: false },
      { id: 'p_4', text: 'Acquérir le matériel : mangeoires, abreuvoirs, radiants chauffants', completed: false },
      { id: 'p_5', text: 'Acheter la première vague de 100 poussins vigoureux', completed: false },
      { id: 'p_6', text: 'Appliquer scrupuleusement le protocole sanitaire et prophylaxie', completed: false },
      { id: 'p_7', text: 'Prendre contact avec restaurants, ménages et rôtisseries', completed: false },
      { id: 'p_8', text: 'Vente de la première vague et réinvestissement des bénéfices', completed: false },
    ]
  },
  {
    id: 'biz_ged',
    name: '💼 Donjon 3 : Freelance Gestion Documentaire (GED)',
    potential: '100 000 – 400 000 FCFA / mois',
    cost: '0 FCFA',
    status: 'non_demarre',
    description: 'Consulting en archivage numérique, organisation de fonds d’archives et GED pour PME.',
    steps: [
      { id: 'g_1', text: 'Créer et optimiser un profil LinkedIn percutant axé GED & Archives', completed: false },
      { id: 'g_2', text: 'Rédiger une plaquette d’offre de service claire (audit + numérisation)', completed: false },
      { id: 'g_3', text: 'Contacter 10 PME ou cabinets d’avocats locaux', completed: false },
      { id: 'g_4', text: 'Créer un profil sur Upwork / Malt pour missions à distance', completed: false },
      { id: 'g_5', text: 'Signer la première mission d’organisation documentaire', completed: false },
    ]
  },
  {
    id: 'biz_osint',
    name: '🔍 Donjon 4 : Services OSINT & Enquêtes en Ligne',
    potential: '100 000 – 500 000 FCFA / mois',
    cost: '0 FCFA',
    status: 'non_demarre',
    description: 'Veille stratégique, due diligence et recherche d’informations vérifiées.',
    steps: [
      { id: 'o_1', text: 'Suivre les modules fondamentaux d’OSINT & outils open-source', completed: false },
      { id: 'o_2', text: 'Mener 3 cas d’étude fictifs documentés pour portfolio', completed: false },
      { id: 'o_3', text: 'Structurer l’offre : vérification de partenaires, veille sectorielle', completed: false },
      { id: 'o_4', text: 'Lancer un blog ou newsletter d’analyse OSINT sur Substack/LinkedIn', completed: false },
      { id: 'o_5', text: 'Démarcher ONG, médias ou entreprises nécessitant de la veille', completed: false },
    ]
  },
  {
    id: 'biz_trading',
    name: '📈 Donjon 5 : Copy Trading & Investissement Bourse',
    potential: 'Variable (Objectif long terme)',
    cost: '20 000 – 50 000 FCFA capital de test',
    status: 'non_demarre',
    warning: '⚠️ ATTENTION : Ne jamais investir plus que ce que tu peux te permettre de perdre.',
    description: 'Bourse d’actions & Copy trading Binance sécurisé après solide formation.',
    steps: [
      { id: 't_1', text: 'Suivre 3 mois de formation sérieuse sans engager d’argent réel', completed: false },
      { id: 't_2', text: 'Ouvrir un compte Binance avec vérification KYC sécurisée', completed: false },
      { id: 't_3', text: 'Pratiquer en simulation (Paper trading) pendant 60 jours', completed: false },
      { id: 't_4', text: 'Sélectionner 2 traders avec drawdown bas et historique stable', completed: false },
      { id: 't_5', text: 'Démarrer avec un petit capital test strict (25 000 FCFA)', completed: false },
      { id: 't_6', text: 'Ouvrir un compte BRVM / actions à dividendes long terme', completed: false },
    ]
  }
];

export const initialWorkouts = {
  lundi: {
    name: 'Lundi — Push (Poitrine & Triceps)',
    exercises: [
      { name: 'Pompes diamant', sets: 4, reps: '12', done: [false, false, false, false] },
      { name: 'Dips sur barres ou chaises', sets: 4, reps: '10', done: [false, false, false, false] },
      { name: 'Pompes déclinées (pieds surélevés)', sets: 3, reps: '15', done: [false, false, false] },
      { name: 'Extensions triceps au sol', sets: 3, reps: '12', done: [false, false, false] }
    ]
  },
  mardi: {
    name: 'Mardi — Pull (Dos & Biceps)',
    exercises: [
      { name: 'Tractions pronation ou supination', sets: 4, reps: '8', done: [false, false, false, false] },
      { name: 'Australian rows (tirage horizontal)', sets: 4, reps: '12', done: [false, false, false, false] },
      { name: 'Curl biceps avec sac lesté', sets: 3, reps: '12', done: [false, false, false] }
    ]
  },
  jeudi: {
    name: 'Jeudi — Legs & Core (Jambes & Gainage)',
    exercises: [
      { name: 'Squats pistol (progressions)', sets: 4, reps: '8', done: [false, false, false, false] },
      { name: 'Fentes avant alternées', sets: 4, reps: '12', done: [false, false, false, false] },
      { name: 'Hollow body hold (gainage banane)', sets: 3, reps: '30 sec', done: [false, false, false] },
      { name: 'L-sit progressions (au sol ou barres)', sets: 3, reps: 'Max', done: [false, false, false] }
    ]
  },
  samedi: {
    name: 'Samedi — Skills & Endurance',
    exercises: [
      { name: 'Handstand au mur (gainage inversé)', sets: 5, reps: '30 sec', done: [false, false, false, false, false] },
      { name: 'Muscle-up progressions', sets: 4, reps: 'Max', done: [false, false, false, false] },
      { name: 'Course à pied d’endurance', sets: 1, reps: '20-30 min', done: [false] }
    ]
  }
};

export const initialHandstandLevels = [
  { level: 1, title: 'Niveau 1 : Wall Handstand (Face au mur)', target: '4 semaines', completed: true },
  { level: 2, title: 'Niveau 2 : Wall Handstand (Dos au mur)', target: '4 semaines', completed: false },
  { level: 3, title: 'Niveau 3 : Décollages légers du mur', target: '4 semaines', completed: false },
  { level: 4, title: 'Niveau 4 : Freestanding Handstand (2-5 secondes libre)', target: '8 semaines', completed: false },
  { level: 5, title: 'Niveau 5 : Handstand Hold parfait (30 secondes+)', target: '12 semaines', completed: false }
];

export const initialBooks = [
  { id: 'b1', title: 'L’Alchimiste', author: 'Paulo Coelho', category: 'Développement Personnel', pagesRead: 180, totalPages: 180, notes: 'Le trésor réside dans la persévérance de sa Légende Personnelle.', completed: true },
  { id: 'b2', title: 'Père Riche, Père Pauvre', author: 'Robert Kiyosaki', category: 'Finances & Richesse', pagesRead: 160, totalPages: 240, notes: 'Acheter des actifs, réduire les passifs.', completed: false },
  { id: 'b3', title: 'Atomic Habits', author: 'James Clear', category: 'Discipline & Habitudes', pagesRead: 190, totalPages: 320, notes: '1% meilleur chaque jour donne un effet cumulé colossal.', completed: false },
  { id: 'b4', title: 'L’Art de la Guerre', author: 'Sun Tzu', category: 'Stratégie & Leadership', pagesRead: 120, totalPages: 120, notes: 'Vaincre sans combattre est le sommet de l’habileté.', completed: true },
];

export const initialTitles = [
  { id: 't_eveil', name: "L'Éveillé", emoji: '⚡', condition: 'Compléter la quête initiale de lancement', unlocked: true },
  { id: 't_discipline', name: 'Le Discipliné', emoji: '🛡️', condition: '7 jours consécutifs avec 100% des quêtes', unlocked: false },
  { id: 't_pur', name: 'Le Pur', emoji: '✨', condition: '30 jours consécutifs de NoFap (Pureté)', unlocked: false },
  { id: 't_ecrivain', name: "L'Écrivain", emoji: '✍️', condition: 'Publier le premier livre sur Amazon KDP', unlocked: false },
  { id: 't_fermier', name: 'Le Fermier', emoji: '🐔', condition: 'Lancer officiellement l’élevage de poulets', unlocked: false },
  { id: 't_silencieux', name: 'Le Silencieux', emoji: '🤐', condition: '30 jours de respect du Protocole Parole d’Or', unlocked: false },
  { id: 't_memoriseur', name: 'Le Mémoriseur', emoji: '🕌', condition: '1 Juz’ entier du Coran mémorisé', unlocked: false },
  { id: 't_thor', name: "Corps de Thor", emoji: '⚡', condition: 'Tenir un handstand libre pendant 10 secondes', unlocked: false },
  { id: 't_investisseur', name: "L'Investisseur", emoji: '💎', condition: 'Générer son premier revenu passif', unlocked: false },
  { id: 't_monarch', name: 'Shadow Monarch', emoji: '👑', condition: 'Atteindre le revenu de 733 333 FCFA / mois', unlocked: false }
];

export const initialRewards = [
  { id: 'r1', title: 'Petit Plaisir (Film, snack gourmand, session jeu)', cost: 100, claimed: false },
  { id: 'r2', title: 'Sortie détente ou petit achat personnel', cost: 300, claimed: false },
  { id: 'r3', title: 'Bon restaurant ou vêtement de qualité', cost: 500, claimed: false },
  { id: 'r4', title: 'Grand équipement sportif ou gadget utile', cost: 1000, claimed: false },
  { id: 'r5', title: 'Voyage court ou grande célébration méritée', cost: 2000, claimed: false }
];

// --- MODULE SYSTÈME MK (Clarté & Discipline stricte) ---
export const initialDailyEntry = {
  priority: "Avancer sur le manuscrit KDP (Fable 1 & structure)",
  priorityDone: false,
  energy: 8,
  blocks: {
    morning: "05h30 Fajr & Coran • 06h15 Calisthenics • 07h00 Écriture",
    lunchTransit: "Podcast audio instructif (Finance / OSINT) • Écoute active",
    afternoon: "Tâches professionnelles ciblées • Protocole Parole d'Or (70/30)",
    evening: "30 min Business • Lecture Atomic Habits • Bilan & Dodo 23h"
  },
  morningRitual: [
    { id: 'mr1', text: "Écriture intuitive (5 min)", done: false },
    { id: 'mr2', text: "Relire la priorité du jour", done: false },
    { id: 'mr3', text: "Mouvement physique (20 min)", done: false },
    { id: 'mr4', text: "Pas de téléphone avant la fin", done: false }
  ],
  eveningRitual: [
    { id: 'er1', text: "Journal Tête + Cœur", done: false },
    { id: 'er2', text: "Définir la priorité de demain", done: false },
    { id: 'er3', text: "Vider le mental sur papier", done: false },
    { id: 'er4', text: "Écrans OFF 30 min avant coucher (22h30)", done: false }
  ],
  journal: {
    head: "",
    heart: "",
    mindDump: ""
  }
};

// STRICT MK RULE: MAXIMUM 3 ACTIVE PROJECTS!
export const initialActiveProjects = [
  { id: 'p1', name: '📚 Écriture & Amazon KDP (Fables)', category: 'Business', progress: 30, nextStep: 'Relecture Fable 1 & Canva cover', status: 'ACTIVE' },
  { id: 'p2', name: '⚡ Calisthenics & Handstand (Corps de Thor)', category: 'Santé', progress: 45, nextStep: 'Séance Push (Dips & Pompes diamant)', status: 'ACTIVE' },
  { id: 'p3', name: '🕌 Mémorisation 1 Juz Coran & Cures', category: 'Spirituel', progress: 20, nextStep: 'Mémoriser 5 versets nouveaux après Fajr', status: 'ACTIVE' }
];

export const initialIdeasVault = [
  { id: 'i1', title: 'Service de numérisation GED pour notaires et PME', notes: 'Audit d’archives documentaires physiques.', capturedAt: '2026-11-01', lockedUntil: '2026-12-01', status: 'LOCKED' },
  { id: 'i2', title: 'Mini-guide numérique nutrition calisthenics', notes: 'Idée d’ebook bonus offert aux lecteurs.', capturedAt: '2026-11-02', lockedUntil: '2026-12-01', status: 'LOCKED' }
];

export const initialSaturnContract = {
  signed: true,
  signedAt: '2026-11-01',
  engagements: [
    "1. Demeurer inébranlable dans ma foi, mes 5 prières quotidiennes et ma pureté morale absolue.",
    "2. Bâtir mon indépendance financière (733 333+ FCFA/mois) par la création de valeur licite et l'entrepreneuriat.",
    "3. Forger un corps athlétique, robuste et sain (Corps de Thor, 75 kg sec) par la constance physique.",
    "4. Protéger, chérir et élever mon foyer avec droiture, générosité et bienveillance exemplaire.",
    "5. Pratiquer le silence stratégique (Parole d'Or 70/30) et la maîtrise totale de mes pulsions."
  ]
};

// --- MODULE ÉVOLUTION (Trio de focus & Récurrences espacées) ---
export const initialFocusTrio = [
  { code: '1-1-01', title: 'Passer une journée sans ronger mes ongles', status: 'TODO', xp: 1, domain: 'Santé / Comportement' },
  { code: '1-1-02', title: 'Me laver le matin / rituel propreté', status: 'TODO', xp: 1, domain: 'Santé / Comportement' },
  { code: '3-1-01', title: 'Lire 20 pages d’un livre formateur', status: 'TODO', xp: 2, domain: 'Professionnel' }
];

export const initialSpacedRecurrences = [
  { id: 'rec_coiffure', name: 'Coiffure & Soins soignés', intervalMonths: 2, lastDone: '2026-10-15', nextDue: '2026-12-15', category: 'Personnel' },
  { id: 'rec_sante', name: 'Bilan de santé & analyse préventive', intervalMonths: 6, lastDone: '2026-08-01', nextDue: '2027-02-01', category: 'Santé' },
  { id: 'rec_finances', name: 'Clôture comptable mensuelle & patrimoine', intervalMonths: 1, lastDone: '2026-10-31', nextDue: '2026-11-30', category: 'Finances' },
  { id: 'rec_famille', name: 'Visite aux aînés et bienveillance familiale', intervalMonths: 1, lastDone: '2026-10-20', nextDue: '2026-11-20', category: 'Cœur/Relations' }
];

// --- MODULE FINANCES & FOYER (FinanceOS) ---
export const initialFinances = {
  monthlySalary: 203000,
  targetIncome: 733333,
  emergencyFund: 150000,
  envelopes: [
    { id: 'env_vital', name: 'Obligatoire (Loyer, charges, alimentation)', allocated: 120000, spent: 45000 },
    { id: 'env_projets', name: 'Investissement Business (Élevage, KDP)', allocated: 40000, spent: 10000 },
    { id: 'env_formation', name: 'Développement Personnel & Livres', allocated: 10000, spent: 0 },
    { id: 'env_securite', name: 'Épargne de Sécurité inviolable', allocated: 20000, spent: 0 },
    { id: 'env_plaisir', name: 'Plaisir mérité & Foyer', allocated: 13000, spent: 3000 }
  ],
  transactions: [
    { id: 'tx_1', date: '2026-11-01', label: 'Revenu mensuel déclaré', amount: 203000, type: 'INCOME', isShared: true },
    { id: 'tx_2', date: '2026-11-02', label: 'Loyer & charges essentielles', amount: 45000, type: 'EXPENSE', envelopeId: 'env_vital', isShared: true },
    { id: 'tx_3', date: '2026-11-03', label: 'Recherche & matériel KDP', amount: 10000, type: 'EXPENSE', envelopeId: 'env_projets', isShared: false }
  ]
};

// --- MODULE SPIRITUALITÉ & MISBAHA ---
export const initialSpiritual = {
  cityName: 'Lomé, Togo',
  latitude: 6.1375,
  longitude: 1.2123,
  prayerMethod: 'MWL',
  activeZikrId: 'ya_rachid',
  tasbihCount: 0,
  cureYaAziz: { currentDay: 1, completedDays: [], status: 'IN_PROGRESS', lastDoneDate: null },
  quran: { juz: 1, pages: 12, verses: 75 },
  prayersDone: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false }
};

export const quotes = [
  "Le Système ne récompense que l'action.",
  "Un Monarch n'attend pas. Il agit.",
  "Tu étais le plus faible. C'est de là que naissent les légendes.",
  "Le Système ne juge pas la chute. Il juge le refus de se relever.",
  "Debout, Joueur. Le donjon t'attend.",
  "Les rois lisent. Les esclaves scrollent.",
  "Chaque jour sans progression est un jour de recul.",
  "Ta discipline aujourd'hui est la liberté de ton futur.",
  "Le corps de Thor ne se construit pas dans le lit.",
  "Celui qui contrôle ses désirs contrôle son destin.",
  "Écoute 70 %. Parle 30 %. Un Monarch observe.",
  "La procrastination est le tombeau des rêves.",
  "Tu n'as pas besoin de motivation. Tu as besoin d'un système.",
  "203 000 aujourd'hui. 733 333 demain. Un pas à la fois.",
  "Ceux qui se lèvent à 5h30 écrivent l'histoire.",
  "L'ombre ne demande pas la permission de grandir.",
  "Personne ne viendra te sauver. Deviens ton propre sauveur.",
  "30 minutes par jour = 182 heures par an. Utilise-les.",
  "Le silence d'un homme discipliné vaut mille promesses.",
  "Ton futur toi te regarde. Ne le déçois pas.",
  "L'excuse est le langage des faibles.",
  "Tu ne rates pas 1 jour. Tu rates 1 identité.",
  "Le Coran mémorisé est une lumière que personne ne peut t'enlever.",
  "Un hectare planté vaut mille rêves non plantés.",
  "Écris une page. Puis une autre. C'est ainsi que naissent les livres.",
  "La faiblesse d'hier est le socle de la force de demain.",
  "Les stats ne mentent pas. Ton travail parle pour toi.",
  "Ne cherche pas à impressionner. Cherche à devenir.",
  "Un jour clean de plus. Un homme plus fort.",
  "Le Rang S ne s'achète pas. Il se gagne, jour après jour."
];
