-- AlterTable: add category_id (parent of sub_category)
ALTER TABLE `sub_bud_category` ADD COLUMN `category_id` CHAR(36) NULL;

-- Backfill from sub_category
UPDATE `sub_bud_category` sbc
INNER JOIN `sub_category` sc ON sbc.sub_category_id = sc.id
SET sbc.category_id = sc.category_id;

-- Make required and add FK
ALTER TABLE `sub_bud_category` MODIFY COLUMN `category_id` CHAR(36) NOT NULL;

ALTER TABLE `sub_bud_category` ADD CONSTRAINT `sub_bud_category_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
