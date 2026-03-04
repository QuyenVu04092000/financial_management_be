/*
  Warnings:

  - You are about to drop the `otp` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `start_day_month` INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE `otp`;
