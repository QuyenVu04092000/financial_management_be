-- AlterTable
ALTER TABLE `category` ADD COLUMN `formula_hint` VARCHAR(191) NULL,
    ADD COLUMN `is_default` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `note` VARCHAR(191) NULL,
    ADD COLUMN `purpose` VARCHAR(191) NULL;
