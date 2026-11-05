// LifeOS SuperApp — Données initiales nettoyées et structurées (Zéro donnée factice préchargée)
// Les données proviennent des saisies réelles de l'utilisateur.

export const initialPlayer = {
  codename: 'Monarque',
  level: 1,
  xpTotal: 0,
  rank: 'E',
  streakNoFap: 0,
  recordNoFap: 0,
  streakQuests: 0,
  weight: 65,
  soundEnabled: true,
  theme: 'dark',
  lastActiveDate: null
};

export const initialStats = {
  STR: { name: 'Force', code: 'STR', xp: 0, icon: 'Dumbbell', desc: 'Condition physique, musculation et force brute.' },
  INT: { name: 'Intelligence', code: 'INT', xp: 0, icon: 'Brain', desc: 'Lecture, stratégie, apprentissage et compétences techniques.' },
  AGI: { name: 'Agilité', code: 'AGI', xp: 0, icon: 'Zap', desc: 'Vitesse d’exécution, flexibilité et équilibre.' },
  VIT: { name: 'Vitalité', code: 'VIT', xp: 0, icon: 'Heart', desc: 'Santé, sommeil réparateur, nutrition et énergie.' },
  SEN: { name: 'Sens', code: 'SEN', xp: 0, icon: 'Eye', desc: 'Intuition, clarté mentale, méditation et focus.' },
  DSC: { name: 'Discipline', code: 'DSC', xp: 0, icon: 'Shield', desc: 'Pureté, régularité des rituels et maîtrise de soi.' },
  SPI: { name: 'Spiritualité', code: 'SPI', xp: 0, icon: 'Moon', desc: 'Prières, zikrs quotidiens, récitation coranique et recueillement.' }
};

export const initialDailyQuests = [
  { id: 'quest_fajr', title: 'Aube de Puissance (Prière Fajr)', xp: 10, stat: 'SPI', completed: false },
  { id: 'quest_trio', title: 'Accomplir le Focus Trio du Jour', xp: 20, stat: 'DSC', completed: false },
  { id: 'quest_workout', title: 'Entraînement Physique (Corps de Thor)', xp: 15, stat: 'STR', completed: false },
  { id: 'quest_deepwork', title: 'Session Deep Work (Projets MK)', xp: 20, stat: 'INT', completed: false },
  { id: 'quest_purete', title: 'Discipline & Pureté Inaltérée', xp: 15, stat: 'DSC', completed: false },
  { id: 'quest_zikr', title: 'Tasbih & Méditation Quotidienne', xp: 10, stat: 'SPI', completed: false }
];

export const initialWeeklyQuests = [
  { id: 'wq_review', title: 'Bilan Hebdomadaire & Clôture', xp: 50, stat: 'INT', completed: false },
  { id: 'wq_handstand', title: 'Entraînement Équilibre / Handstand (3x)', xp: 40, stat: 'AGI', completed: false },
  { id: 'wq_reading', title: 'Lire au moins 1 chapitre de livre', xp: 35, stat: 'INT', completed: false },
  { id: 'wq_finances', title: 'Pointage Comptes & Trésorerie Foyer', xp: 45, stat: 'DSC', completed: false }
];

export const initialMonthlyBoss = {
  name: 'Le Démon de la Dispersion & Procrastination',
  month: 'Novembre 2026',
  hpCurrent: 100,
  hpMax: 100,
  targets: [
    { id: 'bt_1', label: '30 jours sans rupture de streak de quêtes', current: 0, max: 30 },
    { id: 'bt_2', label: 'Avancer d’au moins un jalon sur les 3 projets MK', current: 0, max: 3 },
    { id: 'bt_3', label: 'Fonds d’urgence : respecter le budget prévu', current: 0, max: 1 }
  ]
};

// Paramètres Personnels, Spirituels & Rituels
export const initialUserSettings = {
  birthDate: '', // Date de naissance pour le vrai calcul de Mon Astre
  mondayPrayer: '06:45',
  morningBriefing: '07:00',
  eveningBriefing: '18:00',
  morningMk: '05:45',
  eveningMk: '21:15',
  sacrificeAnchor: '',
  notificationsEnabled: true,
  prayerMethod: 'MWL',
  cityName: 'Lomé, Togo',
  latitude: 6.1375,
  longitude: 1.2123
};

// MODULE FINANCES DU FOYER (FinanceOS) — Entièrement propre, aucune fausse donnée
export const initialFinances = {
  monthlySalary: 0, // Librement modifiable par l'utilisateur
  targetIncome: 0,  // Cible librement modifiable
  settings: {
    currency: 'XOF',
    emergencyFundMonths: 3,
    safetyMargin: 0,
    mode: 'simple', // 'simple' ou 'analyse'
    defaultAccountId: null
  },
  couple: {
    name: 'Notre foyer',
    role: 'ADMIN',
    members: [
      { id: 'm1', name: 'Moi (Administrateur)', email: 'admin@foyer.local', role: 'ADMIN', status: 'ACTIVE', permissions: {} }
    ],
    invitations: []
  },
  incomeSources: [], // Sources déclarées réelles de l'utilisateur
  dependents: [],    // Personnes à charge réelles
  accounts: [],      // Comptes réels (Wave, Banque, Cash, etc.)
  transactions: [],  // Journal réel de transactions
  categories: [
    { id: 'cat_sal', name: 'Salaire', kind: 'INCOME', essential: false, budgetMonthly: 0 },
    { id: 'cat_biz', name: 'Business & Prestations', kind: 'INCOME', essential: false, budgetMonthly: 0 },
    { id: 'cat_fact', name: 'Factures & Charges fixes', kind: 'EXPENSE', essential: true, budgetMonthly: 0 },
    { id: 'cat_alim', name: 'Alimentation & Foyer', kind: 'EXPENSE', essential: true, budgetMonthly: 0 },
    { id: 'cat_log', name: 'Logement & Loyer', kind: 'EXPENSE', essential: true, budgetMonthly: 0 },
    { id: 'cat_sante', name: 'Santé & Soins', kind: 'EXPENSE', essential: true, budgetMonthly: 0 },
    { id: 'cat_depl', name: 'Déplacements & Carburant', kind: 'EXPENSE', essential: true, budgetMonthly: 0 },
    { id: 'cat_don', name: 'Dons & Solidarité', kind: 'DONATION', essential: false, budgetMonthly: 0 },
    { id: 'cat_form', name: 'Formation & Livres', kind: 'EXPENSE', essential: false, budgetMonthly: 0 },
    { id: 'cat_lois', name: 'Loisirs & Sorties', kind: 'EXPENSE', essential: false, budgetMonthly: 0 },
    { id: 'cat_proj', name: 'Projets & Investissement', kind: 'INVESTMENT', essential: false, budgetMonthly: 0 }
  ],
  charges: [],       // Charges récurrentes réelles (loyer, abonnements)
  envelopes: [
    { id: 'env_vital', name: 'Obligatoire (Loyer, charges, alimentation)', group: 'OBLIGATOIRE', allocated: 0, spent: 0 },
    { id: 'env_projets', name: 'Investissement Business & Projets', group: 'PROJETS', allocated: 0, spent: 0 },
    { id: 'env_formation', name: 'Développement Personnel & Livres', group: 'PERSONNEL', allocated: 0, spent: 0 },
    { id: 'env_securite', name: 'Épargne de Sécurité inviolable', group: 'SECURITE', allocated: 0, spent: 0 },
    { id: 'env_plaisir', name: 'Plaisir mérité & Foyer', group: 'PERSONNEL', allocated: 0, spent: 0 }
  ],
  assets: [],        // Actifs réels (terrains, véhicules, matériel)
  liabilities: [],   // Dettes réelles
  positions: [],     // Titres boursiers réels
  copyTrading: [],
  otherInvestments: [],
  goals: [],         // Objectifs de vie et financiers
  snapshots: [],     // Clôtures mensuelles
  clarification3m: {
    question: 'Que représentent les 3 330 000 FCFA de 2028 ?',
    answer: '',
    resolved: false
  },
  auditEvents: []
};

// Journal quotidien & Rituels
export const initialDailyEntry = {
  priority: '',
  priorityDone: false,
  energy: 8,
  intuitions: '',
  block1: { task: '', done: false },
  block2: { task: '', done: false },
  block3: { task: '', done: false },
  block4: { task: '', done: false },
  morningRitual: [
    { id: 'r_fajr', label: 'Prière Fajr à l’heure', done: false },
    { id: 'r_sport', label: 'Workout Corps de Thor ou étirements', done: false },
    { id: 'r_lecture', label: 'Lecture / Étude 20 min', done: false },
    { id: 'r_brief', label: 'Planification des blocs de travail', done: false }
  ],
  eveningRitual: [
    { id: 'r_isha', label: 'Prière Isha & Zikr du soir', done: false },
    { id: 'r_bilan', label: 'Bilan de la journée & Gratitude', done: false },
    { id: 'r_ecrans', label: 'Déconnexion écrans 30 min avant sommeil', done: false }
  ]
};

// Système MK : 3 projets stricts
export const initialActiveProjects = [];

// Quarantaine des idées (30 jours)
export const initialIdeasVault = [];

// Contrat de Saturne
export const initialSaturnContract = {
  p1: 'Ne jamais compromettre ma pureté et ma discipline spirituelle pour une gratification immédiate.',
  p2: 'Travailler chaque jour avec rigueur sur les 3 projets stricts sans dispersion.',
  p3: 'Protéger la transparence financière et la sérénité du foyer.',
  p4: 'Conserver la maîtrise de ma parole : ne jamais médire, écouter deux fois plus que parler.',
  p5: 'Forger sans relâche mon corps et mon esprit pour atteindre le Rang de Monarque.'
};

// Focus Trio quotidien
export const initialFocusTrio = [];

// Récurrences espacées
export const initialSpacedRecurrences = [
  { id: 'rec_finances', name: 'Clôture comptable mensuelle & patrimoine', intervalMonths: 1, lastDone: '', nextDue: '', category: 'Finances' },
  { id: 'rec_famille', name: 'Visite aux aînés et bienveillance familiale', intervalMonths: 1, lastDone: '', nextDue: '', category: 'Cœur/Relations' }
];

// Spiritualité & Misbaha
export const initialSpiritual = {
  cityName: 'Lomé, Togo',
  latitude: 6.1375,
  longitude: 1.2123,
  prayerMethod: 'MWL',
  activeZikrId: 'ya_rachid',
  tasbihCount: 0,
  prayersDone: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
  cureYaAziz: { currentDay: 1, completedDays: [] },
  quran: { currentSurah: 1, currentVerse: 1, dailyPages: 2 },
  customZikrs: []
};

// 5 Donjons Business (Solo Leveling)
export const initialBusinessProjects = [
  {
    id: 'biz_kdp',
    name: 'Donjon 1 : Édition & Livres KDP',
    rank: 'E',
    description: 'Publication de manuscrits, carnets et livres sur Amazon KDP.',
    steps: [
      { id: 's1', text: 'Recherche de 3 niches rentables sans concurrence', completed: false },
      { id: 's2', text: 'Rédaction / Création de la structure du manuscrit', completed: false },
      { id: 's3', text: 'Design de couverture haute conversion (A/B testing)', completed: false },
      { id: 's4', text: 'Upload & Lancement avec mots-clés optimisés', completed: false }
    ]
  },
  {
    id: 'biz_elevage',
    name: 'Donjon 2 : Agro-Pastoral & Élevage',
    rank: 'D',
    description: 'Ferme avicole et production agro-alimentaire locale durable.',
    steps: [
      { id: 's1', text: 'Étude du terrain et approvisionnement en eau', completed: false },
      { id: 's2', text: 'Sélection des sujets et plan vaccinal rigoureux', completed: false },
      { id: 's3', text: 'Mise en place des circuits d’écoulement directs', completed: false }
    ]
  },
  {
    id: 'biz_presta',
    name: 'Donjon 3 : Prestations & Consulting Tech',
    rank: 'C',
    description: 'Services d’automatisation, audit informatique et logiciels.',
    steps: [
      { id: 's1', text: 'Définir l’offre irrésistible à haute valeur', completed: false },
      { id: 's2', text: 'Créer 2 études de cas / démonstrateurs percutants', completed: false },
      { id: 's3', text: 'Prospection ciblée de 10 décideurs par semaine', completed: false }
    ]
  },
  {
    id: 'biz_brvm',
    name: 'Donjon 4 : Portefeuille Dividendes BRVM',
    rank: 'B',
    description: 'Acquisition méthodique d’actions à fort rendement dividende.',
    steps: [
      { id: 's1', text: 'Analyse des rapports financiers des 5 meilleures valeurs', completed: false },
      { id: 's2', text: 'Définir le calendrier des versements programmés', completed: false },
      { id: 's3', text: 'Réinvestissement automatique 100% des dividendes', completed: false }
    ]
  },
  {
    id: 'biz_immo',
    name: 'Donjon 5 : Patrimoine Immobilier & Terrains',
    rank: 'A',
    description: 'Constitution d’une réserve foncière sécurisée et titrée.',
    steps: [
      { id: 's1', text: 'Vérification cadastre et sécurité juridique du titre', completed: false },
      { id: 's2', text: 'Plan de bornage et clôture physique du domaine', completed: false }
    ]
  }
];

// Programme d'entraînement Corps de Thor
export const initialWorkouts = {
  lundi: {
    focus: 'Pectoraux & Triceps (Force Alpha)',
    exercises: [
      { name: 'Pompes lestées / explosives', sets: [false, false, false, false], reps: '15 reps' },
      { name: 'Dips aux barres parallèles', sets: [false, false, false], reps: '12 reps' },
      { name: 'Pompes diamant (finition triceps)', sets: [false, false, false], reps: '15 reps' }
    ]
  },
  mardi: {
    focus: 'Dos & Biceps (Envergure du Monarque)',
    exercises: [
      { name: 'Tractions pronation strictes', sets: [false, false, false, false], reps: '8-10 reps' },
      { name: 'Tractions supination (biceps focus)', sets: [false, false, false], reps: '8 reps' },
      { name: 'Rowing inversé au sol', sets: [false, false, false], reps: '12 reps' }
    ]
  },
  mercredi: {
    focus: 'Mobilité, Gainage & Handstand',
    exercises: [
      { name: 'Pratique Handstand contre mur', sets: [false, false, false], reps: '60 sec' },
      { name: 'Planche abdominale creuse (Hollow body)', sets: [false, false, false], reps: '45 sec' },
      { name: 'L-sit au sol', sets: [false, false, false], reps: '20 sec' }
    ]
  },
  jeudi: {
    focus: 'Jambes & Explosivité (Piliers)',
    exercises: [
      { name: 'Pistol Squats (squat sur 1 jambe)', sets: [false, false, false], reps: '6 reps / jambe' },
      { name: 'Fentes marchées explosives', sets: [false, false, false], reps: '20 pas' },
      { name: 'Calf raises (mollets unilatéraux)', sets: [false, false, false], reps: '25 reps' }
    ]
  },
  vendredi: {
    focus: 'Épaules, Nuque & Handstand Libre',
    exercises: [
      { name: 'Pike pushups (pompes en pique)', sets: [false, false, false, false], reps: '10 reps' },
      { name: 'Tentatives d’équilibre Handstand libre', sets: [false, false, false, false, false], reps: 'Essais max' }
    ]
  },
  samedi: {
    focus: 'Course d’endurance & Récupération active',
    exercises: [
      { name: 'Footing aérobie zone 2 (45 min)', sets: [false], reps: '1 session' }
    ]
  },
  dimanche: {
    focus: 'Repos complet, sauna / étirements',
    exercises: [
      { name: 'Étirements complets & mobilité articulaire', sets: [false], reps: '20 min' }
    ]
  }
};

export const initialHandstandLevels = [
  { level: 1, title: 'La Tortue (Gainage & Appui poignets)', req: '30s planche creuse', completed: false },
  { level: 2, title: 'Le Bâtisseur (Wall Walk pieds au mur)', req: 'Montée au mur contrôlée', completed: false },
  { level: 3, title: 'La Sentinelle (Face au mur)', req: 'Tenir 45s poitrine collée au mur', completed: false },
  { level: 4, title: 'L’Équilibriste (Kick up dos au mur)', req: 'Lancer propre avec décollement 5s', completed: false },
  { level: 5, title: 'Le Monarque Gravitationnel (Handstand libre)', req: 'Tenir 15s au milieu de la pièce', completed: false }
];

export const initialTitles = [
  { id: 't1', title: 'L’Initié Déterminé', desc: 'Atteindre le Rang D', unlocked: false },
  { id: 't2', title: 'Le Résistant Absolu', desc: 'Maintenir 30 jours de pureté NoFap', unlocked: false },
  { id: 't3', title: 'Le Bâtisseur de Systèmes', desc: 'Compléter 100 quêtes quotidiennes', unlocked: false },
  { id: 't4', title: 'Le Maître de l’Astre', desc: 'Alignement parfait pendant un cycle complet', unlocked: false },
  { id: 't5', title: 'Le Monarque de l’Ombre', desc: 'Atteindre le Rang S (Niveau 91+)', unlocked: false }
];

export const initialRewards = [
  { id: 'r1', name: 'Thé d’exception ou café grand cru', costXp: 100, claimed: false },
  { id: 'r2', name: 'Achat d’un nouveau livre de valeur', costXp: 300, claimed: false },
  { id: 'r3', name: 'Repas de fête mérité avec le foyer', costXp: 600, claimed: false },
  { id: 'r4', name: 'Journée d’immersion totale nature / retraite', costXp: 1200, claimed: false }
];

export const initialBooks = [
  { id: 'b1', title: 'Deep Work', author: 'Cal Newport', totalPages: 300, currentPage: 0, status: 'EN_COURS' },
  { id: 'b2', title: 'L’Alchimiste', author: 'Paulo Coelho', totalPages: 180, currentPage: 0, status: 'A_LIRE' },
  { id: 'b3', title: 'L’Éducation d’un investisseur en valeur', author: 'Guy Spier', totalPages: 250, currentPage: 0, status: 'A_LIRE' }
];

export const quotes = [
  { text: "Je ne crains pas l'homme qui a pratiqué 10 000 coups une fois, mais celui qui a pratiqué un coup 10 000 fois.", author: "Bruce Lee" },
  { text: "L'obstacle est le chemin. Ce qui s'oppose à l'action fait avancer l'action.", author: "Marc Aurèle" },
  { text: "Se relever est une décision. Devenir plus fort est une obligation.", author: "Sung Jin-woo" },
  { text: "La vraie richesse d’un homme réside dans la discipline de son esprit et la pureté de son cœur.", author: "Proverbe" },
  { text: "Une vision sans exécution n'est qu'une hallucination.", author: "Thomas Edison" }
];
