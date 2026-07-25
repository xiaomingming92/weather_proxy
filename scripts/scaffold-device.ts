#!/usr/bin/env npx tsx
/**
 * 新设备建表脚手架
 *
 * 用法：npx tsx scripts/scaffold-device.ts --name Samsung
 * 输出：4 段 Prisma model 定义到 stdout，可直接 >> prisma/schema.prisma
 *
 * 默认模板沿用 ZTE 模式（cityId + dataType + xmlData）。
 * 生成后需人工根据设备协议调整：
 *   - cityId 还是 cityCode？
 *   - dataType 还是 endpoint？
 *   - xmlData 还是 jsonData？
 *   - City 表需要哪些额外字段？
 */

const args = process.argv.slice(2);
const nameIdx = args.indexOf('--name');
if (nameIdx === -1 || !args[nameIdx + 1]) {
  console.error('Usage: npx tsx scripts/scaffold-device.ts --name <DeviceName>');
  console.error('Example: npx tsx scripts/scaffold-device.ts --name Samsung');
  process.exit(1);
}

const deviceName = args[nameIdx + 1];
// PascalCase: Samsung → Samsung, HTC-G13 → HtcG13
const pascalName: string = deviceName
  .split(/[-_]/)
  .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
  .join('');
const tablePrefix = pascalName;

const now = Date.now();

const models = `
// ============================================
// ${pascalName} 天气缓存表
// ============================================
model ${tablePrefix}WeatherCache {
  id            Int      @id @default(autoincrement())
  cityId        String
  dataType      String   // 天气数据类型标识
  xmlData       String   @db.Text
  timestamp     BigInt
  expiresAt     BigInt
  cacheDuration Int      @default(30)
  createdAt     BigInt
  updatedAt     BigInt

  @@unique([cityId, dataType])
  @@index([expiresAt])
  @@index([dataType])
}

// ============================================
// ${pascalName} 活跃城市表
// ============================================
model ${tablePrefix}ActiveCity {
  id           Int      @id @default(autoincrement())
  name         String
  cityId       String   @unique
  lastAccessed BigInt
  createdAt    BigInt
  updatedAt    BigInt

  @@index([name])
  @@index([lastAccessed])
}

// ============================================
// ${pascalName} 城市表
// ============================================
model ${tablePrefix}City {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  cityId      String   @unique
  // TODO: 根据设备协议添加额外字段
  // latitude    String?
  // longitude   String?
  // province    String?
  // stationId   String?
  createdAt   BigInt
  updatedAt   BigInt
}

// ============================================
// ${pascalName} 缓存策略配置
// ============================================
model ${tablePrefix}CachePolicy {
  id          Int      @id @default(autoincrement())
  dataType    String   @unique
  duration    Int      // 缓存时长（分钟）
  description String?
  createdAt   BigInt
  updatedAt   BigInt
}
`;

console.log(models.trim());
console.log(`\n-- Generated ${4} models for device "${deviceName}" (${tablePrefix})`);
console.log('-- Next: prisma db push → add DeviceDefinition to src/config/devices.ts');
console.log('-- Tip: adjust cityId↔cityCode, dataType↔endpoint, xmlData↔jsonData per device protocol');
