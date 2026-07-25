-- CreateTable
CREATE TABLE `HtcAccuActiveCity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `cityId` VARCHAR(191) NOT NULL,
    `longitude` VARCHAR(191) NULL,
    `latitude` VARCHAR(191) NULL,
    `lastRequestAt` BIGINT NULL,
    `requestCount` INTEGER NOT NULL DEFAULT 1,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `HtcAccuActiveCity_name_key`(`name`),
    UNIQUE INDEX `HtcAccuActiveCity_cityId_key`(`cityId`),
    INDEX `HtcAccuActiveCity_lastRequestAt_idx`(`lastRequestAt`),
    INDEX `HtcAccuActiveCity_requestCount_idx`(`requestCount`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HtcHuaFengActiveCity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `cityId` VARCHAR(191) NOT NULL,
    `longitude` VARCHAR(191) NULL,
    `latitude` VARCHAR(191) NULL,
    `lastRequestAt` BIGINT NULL,
    `requestCount` INTEGER NOT NULL DEFAULT 1,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `HtcHuaFengActiveCity_name_key`(`name`),
    UNIQUE INDEX `HtcHuaFengActiveCity_cityId_key`(`cityId`),
    INDEX `HtcHuaFengActiveCity_lastRequestAt_idx`(`lastRequestAt`),
    INDEX `HtcHuaFengActiveCity_requestCount_idx`(`requestCount`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HtcG13ActiveCity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `cityId` VARCHAR(191) NOT NULL,
    `longitude` VARCHAR(191) NULL,
    `latitude` VARCHAR(191) NULL,
    `lastRequestAt` BIGINT NULL,
    `requestCount` INTEGER NOT NULL DEFAULT 1,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `HtcG13ActiveCity_name_key`(`name`),
    UNIQUE INDEX `HtcG13ActiveCity_cityId_key`(`cityId`),
    INDEX `HtcG13ActiveCity_lastRequestAt_idx`(`lastRequestAt`),
    INDEX `HtcG13ActiveCity_requestCount_idx`(`requestCount`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
