-- AlterTable
ALTER TABLE `CacheConfig` MODIFY `createdAt` BIGINT NOT NULL,
    MODIFY `updatedAt` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `City` MODIFY `createdAt` BIGINT NOT NULL,
    MODIFY `updatedAt` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `WeatherData` MODIFY `createdAt` BIGINT NOT NULL,
    MODIFY `updatedAt` BIGINT NOT NULL;
