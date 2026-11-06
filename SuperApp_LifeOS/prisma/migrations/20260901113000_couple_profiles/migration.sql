-- Couple profiles, authentication identity and fine-grained access control.
ALTER TABLE "User" ADD COLUMN "authUserId" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

CREATE UNIQUE INDEX "User_authUserId_key" ON "User"("authUserId");

CREATE TABLE "CoupleSpace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Notre foyer',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "CoupleMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoupleMember_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "CoupleSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoupleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "FeaturePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "access" TEXT NOT NULL DEFAULT 'VIEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeaturePermission_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CoupleMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CoupleInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "acceptedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoupleInvitation_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "CoupleSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoupleInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ItemPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "access" TEXT NOT NULL DEFAULT 'VIEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItemPermission_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CoupleMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CoupleMember_userId_key" ON "CoupleMember"("userId");
CREATE UNIQUE INDEX "CoupleMember_coupleId_userId_key" ON "CoupleMember"("coupleId", "userId");
CREATE UNIQUE INDEX "FeaturePermission_memberId_feature_key" ON "FeaturePermission"("memberId", "feature");
CREATE UNIQUE INDEX "CoupleInvitation_token_key" ON "CoupleInvitation"("token");
CREATE UNIQUE INDEX "CoupleInvitation_coupleId_email_key" ON "CoupleInvitation"("coupleId", "email");
CREATE UNIQUE INDEX "ItemPermission_memberId_resourceType_resourceId_key" ON "ItemPermission"("memberId", "resourceType", "resourceId");

-- All pre-existing and newly-created data is shared unless explicitly marked
-- personal by its owner.
ALTER TABLE "Account" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "Transaction" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "Category" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "RecurringCharge" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "Envelope" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "LifeArea" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "YearPlan" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "Goal" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "Project" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "Asset" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "Liability" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "InvestmentPosition" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "CopyTradingAccount" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "OtherInvestment" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "Business" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "HealthMetric" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "Skill" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "ActionItem" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "MonthlySnapshot" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
ALTER TABLE "Note" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'SHARED';
