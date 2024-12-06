/*
  Warnings:

  - You are about to drop the column `email_verify_token` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email_verify_token_expire_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password_reset_token` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `reset_token_expire_at` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "email_verify_token",
DROP COLUMN "email_verify_token_expire_at",
DROP COLUMN "password_reset_token",
DROP COLUMN "reset_token_expire_at",
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otp_expire_at" TIMESTAMP(3),
ADD COLUMN     "password_reset_otp" TEXT,
ADD COLUMN     "reset_otp_expire_at" TIMESTAMP(3);
