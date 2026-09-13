/*
  Warnings:

  - Added the required column `slug` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "basePriceMin" INTEGER NOT NULL DEFAULT 0,
    "basePriceMax" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'trialing',
    "trialEndsAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("basePriceMax", "basePriceMin", "businessName", "createdAt", "email", "id", "passwordHash", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "trialEndsAt") SELECT "basePriceMax", "basePriceMin", "businessName", "createdAt", "email", "id", "passwordHash", "stripeCustomerId", "stripeSubscriptionId", "subscriptionStatus", "trialEndsAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
