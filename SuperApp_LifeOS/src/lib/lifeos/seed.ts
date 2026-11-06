// Initialisation locale minimale.
// Les donnees financieres du foyer doivent provenir de saisies reelles :
// aucun compte, revenu, projet ou montant de demonstration n'est precharge.

import { db } from "@/lib/db";

const LOCAL_OWNER_EMAIL = "owner@financeos.local";

export async function getOrCreateUser() {
  const existing = await db.user.findUnique({
    where: { email: LOCAL_OWNER_EMAIL },
  });
  if (existing) return existing;

  return db.user.create({
    data: {
      email: LOCAL_OWNER_EMAIL,
      name: "Administrateur du foyer",
    },
  });
}

export async function ensureSeed() {
  const user = await getOrCreateUser();

  await db.setting.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currency: "XOF",
      salaryMonthly: 0,
      emergencyFundMonths: 3,
      safetyMargin: 0,
      mode: "simple",
    },
  });

  return user;
}
