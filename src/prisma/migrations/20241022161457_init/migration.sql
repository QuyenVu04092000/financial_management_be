/*
  Warnings:

  - You are about to drop the `user_feedbacks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `user_feedbacks` DROP FOREIGN KEY `user_feedbacks_user_id_fkey`;

-- DropTable
DROP TABLE `user_feedbacks`;
