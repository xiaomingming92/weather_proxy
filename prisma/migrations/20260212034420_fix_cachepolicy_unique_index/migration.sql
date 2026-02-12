/*
  Warnings:

  - A unique constraint covering the columns `[dataType,appType]` on the table `CachePolicy` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `CachePolicy_dataType_key` ON `CachePolicy`;

-- CreateIndex
CREATE UNIQUE INDEX `CachePolicy_dataType_appType_key` ON `CachePolicy`(`dataType`, `appType`);
