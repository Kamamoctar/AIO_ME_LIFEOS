import { describe, expect, it } from "vitest";
import { createPersonalZikr } from "@/modules/spiritual/custom-zikr";

describe("personal zikr", () => {
  it("creates a private free zikr with a target", () => {
    const zikr = createPersonalZikr({
      name: "  Mon zikr  ",
      arabic: "  الحمد لله  ",
      meaning: "  Gratitude  ",
      target: 100,
    }, 42);

    expect(zikr).toMatchObject({
      id: "personal_zikr_42",
      nom: "Mon zikr",
      arabe: "الحمد لله",
      sens: "Gratitude",
      quantite: 100,
      nature: "libre",
      personnel: true,
    });
  });

  it("falls back to the name when no formula is provided", () => {
    const zikr = createPersonalZikr({ name: "Présence", arabic: "", meaning: "", target: null }, 7);
    expect(zikr.formule).toBe("Présence");
    expect(zikr.instruction).toBe("Récitation libre.");
  });
});
