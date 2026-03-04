-- DropForeignKey
ALTER TABLE `sub_bud_category` DROP FOREIGN KEY `sub_bud_category_category_id_fkey`;

-- AlterTable
ALTER TABLE `sub_bud_category` MODIFY `category_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `sub_bud_category` ADD CONSTRAINT `sub_bud_category_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
