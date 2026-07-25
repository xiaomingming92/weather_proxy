-- CreateTable
CREATE TABLE `ZteActiveCity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `cityId` VARCHAR(191) NOT NULL,
    `longitude` VARCHAR(191) NULL,
    `latitude` VARCHAR(191) NULL,
    `lastRequestAt` BIGINT NULL,
    `requestCount` INTEGER NOT NULL DEFAULT 1,
    `createdAt` BIGINT NOT NULL,
    `updatedAt` BIGINT NOT NULL,

    UNIQUE INDEX `ZteActiveCity_name_key`(`name`),
    UNIQUE INDEX `ZteActiveCity_cityId_key`(`cityId`),
    INDEX `ZteActiveCity_lastRequestAt_idx`(`lastRequestAt`),
    INDEX `ZteActiveCity_requestCount_idx`(`requestCount`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
