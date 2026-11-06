// Life OS — Constantes (navigation, libellés, options)
import type {
  AccountType,
  EnvelopeGroup,
  Frequency,
  GoalStatus,
  Priority,
  TransactionType,
} from "./types";

export const CURRENCY = "FCFA";

export const VIEW_IDS = [
  "today",
  "evolution",
  "mk",
  "destiny",
  "monarch",
  "spiritual",
  "cockpit",
  "vision",
  "goals",
  "projects",
  "finances",
  "accounts",
  "investments",
  "patrimoine",
  "decisions",
  "simulations",
  "health",
  "skills",
  "calendar",
  "settings",
] as const;

export type ViewId = (typeof VIEW_IDS)[number];

export const PRIMARY_VIEWS: ViewId[] = [
  "today",
  "evolution",
  "mk",
  "monarch",
  "spiritual",
];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  BANK: "Banque",
  SAVINGS: "Épargne",
  BRVM: "BRVM",
  COPY_TRADING: "Copy Trading",
  BUSINESS: "Business",
  OTHER: "Autre",
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: "Revenu",
  EXPENSE: "Dépense",
  DONATION: "Don",
  INVESTMENT: "Investissement",
  TRANSFER: "Transfert",
  ASSET_BUY: "Achat d'actif",
  ASSET_SELL: "Vente d'actif",
  DIVIDEND: "Dividende",
  WITHDRAWAL: "Retrait",
  DEPOSIT: "Dépôt",
  PROJECT: "Transaction projet",
  ADJUSTMENT: "Ajustement",
};

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  ANNUAL: "Annuel",
  CUSTOM: "Personnalisé",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  CRITIQUE: "Critique",
  HAUTE: "Haute",
  MOYENNE: "Moyenne",
  FAIBLE: "Faible",
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  A_DEFINIR: "À définir",
  A_PLANIFIER: "À planifier",
  PLANIFIE: "Planifié",
  EN_COURS: "En cours",
  EN_RETARD: "En retard",
  BLOQUE: "Bloqué",
  TERMINE: "Terminé",
  REPORTE: "Reporté",
  ANNULE: "Annulé",
};

export const ENVELOPE_GROUP_LABELS: Record<EnvelopeGroup, string> = {
  OBLIGATOIRE: "Obligatoire",
  SECURITE: "Sécurité",
  PROJETS: "Projets",
  INVESTISSEMENT: "Investissement",
  PERSONNEL: "Personnel",
};

export const LIFE_AREAS = [
  { name: "Carrière / Business", icon: "briefcase" },
  { name: "Finances", icon: "wallet" },
  { name: "Santé & Forme", icon: "heart-pulse" },
  { name: "Relations / Famille", icon: "users" },
  { name: "Compétences", icon: "graduation-cap" },
  { name: "Immobilier / Lieu de vie", icon: "home" },
] as const;

export const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export const MONTHS_FR_SHORT = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

// Types qui sortent de l'argent d'un compte (mais ne sont pas des dépenses de consommation)
export const OUTFLOW_TYPES: TransactionType[] = [
  "TRANSFER",
  "INVESTMENT",
  "WITHDRAWAL",
];

// Types qui comptent comme dépense réelle (consommation)
export const EXPENSE_TYPES: TransactionType[] = ["EXPENSE", "DONATION"];

// Types qui comptent comme revenu réel
export const INCOME_TYPES: TransactionType[] = ["INCOME", "DIVIDEND"];

export const DISCLAIMER_SIMULATION =
  "Les simulations reposent sur des hypothèses et ne garantissent aucun résultat futur.";
