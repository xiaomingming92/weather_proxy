/*
  Warnings:

  - A unique constraint covering the columns `[cityId,dataType,appType]` on the table `WeatherData` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `WeatherData` DROP FOREIGN KEY `WeatherData_cityId_fkey`;

-- DropIndex
DROP INDEX `WeatherData_cityId_dataType_key` ON `WeatherData`;

-- AlterTable
ALTER TABLE `City` ADD COLUMN `latitude` VARCHAR(191) NULL,
    ADD COLUMN `longitude` VARCHAR(191) NULL,
    ADD COLUMN `postcode` VARCHAR(191) NULL,
    ADD COLUMN `stationId` VARCHAR(191) NULL,
    ADD COLUMN `sunrise` VARCHAR(191) NULL,
    ADD COLUMN `sunset` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `WeatherData` ADD COLUMN `appType` VARCHAR(191) NOT NULL DEFAULT 'unknown',
    ADD COLUMN `cacheDuration` INTEGER NOT NULL DEFAULT 30;

-- CreateTable
CREATE TABLE `CachePolicy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataType` VARCHAR(191) NOT NULL,
    `appType` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `CachePolicy_dataType_key`(`dataType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `WeatherData_expiresAt_idx` ON `WeatherData`(`expiresAt`);

-- CreateIndex
CREATE INDEX `WeatherData_appType_dataType_idx` ON `WeatherData`(`appType`, `dataType`);

-- CreateIndex
CREATE UNIQUE INDEX `WeatherData_cityId_dataType_appType_key` ON `WeatherData`(`cityId`, `dataType`, `appType`);

-- AddForeignKey
ALTER TABLE `WeatherData` ADD CONSTRAINT `WeatherData_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City`(`cityId`) ON DELETE RESTRICT ON UPDATE CASCADE;
