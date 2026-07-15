/*
  Warnings:

  - Added the required column `updatedAt` to the `VendorUPS` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VendorUPS" ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "refreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
