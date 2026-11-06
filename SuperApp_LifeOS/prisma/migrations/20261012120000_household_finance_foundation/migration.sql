-- Household-level financial settings, expected income, dependents and
-- account-backed fund reservations.
CREATE TABLE "HouseholdSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "emergencyFundMonths" INTEGER NOT NULL DEFAULT 3,
    "safetyMargin" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HouseholdSetting_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "CoupleSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "IncomeSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'SALARY',
    "monthlyAmount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IncomeSource_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "CoupleSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IncomeSource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Dependent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "birthDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dependent_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "CoupleSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "FundAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "projectId" TEXT,
    "goalId" TEXT,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "releasedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FundAllocation_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "CoupleSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FundAllocation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FundAllocation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FundAllocation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FundAllocation_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "HouseholdSetting_coupleId_key" ON "HouseholdSetting"("coupleId");
CREATE INDEX "IncomeSource_coupleId_active_idx" ON "IncomeSource"("coupleId", "active");
CREATE INDEX "Dependent_coupleId_active_idx" ON "Dependent"("coupleId", "active");
CREATE INDEX "FundAllocation_coupleId_status_idx" ON "FundAllocation"("coupleId", "status");
CREATE INDEX "FundAllocation_accountId_status_idx" ON "FundAllocation"("accountId", "status");
CREATE INDEX "FundAllocation_projectId_status_idx" ON "FundAllocation"("projectId", "status");
CREATE INDEX "FundAllocation_goalId_status_idx" ON "FundAllocation"("goalId", "status");
