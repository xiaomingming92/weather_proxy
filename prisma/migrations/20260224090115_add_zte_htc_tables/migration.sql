-- CreateTable
CREATE TABLE `ZteCity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `cityId` VARCHAR(191) NOT NULL,
    `stationId` VARCHAR(191) NULL,
    `longitude` VARCHAR(191) NULL,
    `latitude` VARCHAR(191) NULL,
    `postcode` VARCHAR(191) NULL,
    `sunrise` VARCHAR(191) NULL,
    `sunset` VARCHAR(191) NULL,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `ZteCity_name_key`(`name`),
    UNIQUE INDEX `ZteCity_cityId_key`(`cityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HtcCity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `cityId` VARCHAR(191) NOT NULL,
    `latitude` VARCHAR(191) NULL,
    `longitude` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `HtcCity_name_key`(`name`),
    UNIQUE INDEX `HtcCity_cityId_key`(`cityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ZteWeatherCache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cityId` VARCHAR(191) NOT NULL,
    `dataType` VARCHAR(191) NOT NULL,
    `xmlData` TEXT NOT NULL,
    `timestamp` BIGINT NOT NULL,
    `expiresAt` BIGINT NOT NULL,
    `cacheDuration` INTEGER NOT NULL DEFAULT 30,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    INDEX `ZteWeatherCache_expiresAt_idx`(`expiresAt`),
    INDEX `ZteWeatherCache_dataType_idx`(`dataType`),
    UNIQUE INDEX `ZteWeatherCache_cityId_dataType_key`(`cityId`, `dataType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HtcWeatherCache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cityId` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `xmlData` TEXT NOT NULL,
    `timestamp` BIGINT NOT NULL,
    `expiresAt` BIGINT NOT NULL,
    `cacheDuration` INTEGER NOT NULL DEFAULT 30,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    INDEX `HtcWeatherCache_expiresAt_idx`(`expiresAt`),
    INDEX `HtcWeatherCache_endpoint_idx`(`endpoint`),
    UNIQUE INDEX `HtcWeatherCache_cityId_endpoint_key`(`cityId`, `endpoint`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ZteCachePolicy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataType` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `ZteCachePolicy_dataType_key`(`dataType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HtcCachePolicy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `endpoint` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `HtcCachePolicy_endpoint_key`(`endpoint`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
