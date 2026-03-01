-- CreateTable HtcG13WeatherCache
CREATE TABLE `HtcG13WeatherCache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cityId` VARCHAR(191) NOT NULL,
    `jsonData` TEXT NOT NULL,
    `timestamp` BIGINT NOT NULL,
    `expiresAt` BIGINT NOT NULL,
    `cacheDuration` INTEGER NOT NULL DEFAULT 30,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `HtcG13WeatherCache_cityId_key`(`cityId`),
    INDEX `HtcG13WeatherCache_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable HtcG13City
CREATE TABLE `HtcG13City` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `cityId` VARCHAR(191) NOT NULL,
    `latitude` VARCHAR(191) NULL,
    `longitude` VARCHAR(191) NULL,
    `adm1` VARCHAR(191) NULL,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `HtcG13City_name_key`(`name`),
    UNIQUE INDEX `HtcG13City_cityId_key`(`cityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
