import type { Zikr } from "@/modules/spiritual/types";

export interface PersonalZikrInput {
  name: string;
  arabic: string;
  meaning: string;
  target: number | null;
}

export function createPersonalZikr(input: PersonalZikrInput, createdAt = Date.now()): Zikr {
  const name = input.name.trim();
  const arabic = input.arabic.trim();
  const meaning = input.meaning.trim();
  const target = input.target && input.target > 0 ? Math.round(input.target) : null;

  return {
    id: `personal_zikr_${createdAt}`,
    nom: name,
    arabe: arabic,
    formule: arabic || name,
    sens: meaning,
    quantite: target,
    nature: "libre",
    fenetre: { type: "libre" },
    fractionnable: true,
    instruction: target ? `Réciter ${target.toLocaleString("fr-FR")} fois.` : "Récitation libre.",
    notes: "Zikr personnel créé sur cet appareil.",
    actif: true,
    personnel: true,
  };
}
