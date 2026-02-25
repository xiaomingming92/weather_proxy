/*
  Warnings:

  - You are about to drop the `HtcCachePolicy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HtcCity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HtcWeatherCache` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `HtcCachePolicy`;

-- DropTable
DROP TABLE `HtcCity`;

-- DropTable
DROP TABLE `HtcWeatherCache`;

-- CreateTable
CREATE TABLE `HtcAccuCity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `cityId` VARCHAR(191) NOT NULL,
    `latitude` VARCHAR(191) NULL,
    `longitude` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `HtcAccuCity_name_key`(`name`),
    UNIQUE INDEX `HtcAccuCity_cityId_key`(`cityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HtcAccuWeatherCache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cityId` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `xmlData` TEXT NOT NULL,
    `timestamp` BIGINT NOT NULL,
    `expiresAt` BIGINT NOT NULL,
    `cacheDuration` INTEGER NOT NULL DEFAULT 30,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    INDEX `HtcAccuWeatherCache_expiresAt_idx`(`expiresAt`),
    INDEX `HtcAccuWeatherCache_endpoint_idx`(`endpoint`),
    UNIQUE INDEX `HtcAccuWeatherCache_cityId_endpoint_key`(`cityId`, `endpoint`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HtcAccuCachePolicy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `endpoint` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `HtcAccuCachePolicy_endpoint_key`(`endpoint`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HTCHuaFengWeatherCache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cityCode` VARCHAR(191) NOT NULL,
    `xmlData` TEXT NOT NULL,
    `timestamp` BIGINT NOT NULL,
    `expiresAt` BIGINT NOT NULL,
    `cacheDuration` INTEGER NOT NULL DEFAULT 30,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    INDEX `HTCHuaFengWeatherCache_expiresAt_idx`(`expiresAt`),
    UNIQUE INDEX `HTCHuaFengWeatherCache_cityCode_key`(`cityCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HTCHuaFengCity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cityCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `qweatherId` VARCHAR(191) NULL,
    `latitude` VARCHAR(191) NULL,
    `longitude` VARCHAR(191) NULL,
    `province` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL DEFAULT '中国',
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `HTCHuaFengCity_cityCode_key`(`cityCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HtcHuaFengCachePolicy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataType` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `HtcHuaFengCachePolicy_dataType_key`(`dataType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
