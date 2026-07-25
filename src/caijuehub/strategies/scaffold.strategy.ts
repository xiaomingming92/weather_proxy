// ⚠️ 由 caijuehub/transcribe-devices.ts 自动生成，不要手动编辑！
// 改 caijuehub/*-rules.toml 后重新运行: npm run generate:devices

// >>> CAIJUE GENERATED START >>>
export const SCAFFOLD_TEMPLATES = {
  "default": {
    description: "默认：cityId + dataType + xmlData（ZTE / Accu 模式）",
    tables: ["WeatherCache", "ActiveCity", "City", "CachePolicy"],
    fields: {
      id: "Int      @id @default(autoincrement())",
      timestamp: "BigInt",
      expiresAt: "BigInt",
      cacheDuration: "Int      @default(30)",
      createdAt: "BigInt",
      updatedAt: "BigInt",
    },
    WeatherCache: {
      extra: "cityId        String\ndataType      String   // 天气数据类型标识\nxmlData       String   @db.Text",
      unique: [["[cityId"],"dataType\""],
      indexes: ["expiresAt","dataType"],
    },
    ActiveCity: {
      extra: "name          String\ncityId        String   @unique\nlastAccessed  BigInt",
      indexes: ["name","lastAccessed"],
    },
    City: {
      extra: "name          String   @unique\ncityId        String   @unique",
    },
    CachePolicy: {
      extra: "dataType      String   @unique\nduration      Int      // 缓存时长（分钟）\ndescription   String?",
    },
  },
  "htc-g13": {
    description: "G13：jsonData 替代 xmlData，cityId @unique，无 CachePolicy",
    tables: ["WeatherCache", "ActiveCity", "City"],
    inherits: "default",
    WeatherCache: {
      extra: "cityId        String   @unique\njsonData      String   @db.Text  // JSON 格式天气数据",
      unique: [["[cityId]"]],
      indexes: ["expiresAt"],
    },
  },
  "htc-huafeng": {
    description: "华风：cityCode 替代 cityId，无 dataType 维度",
    tables: ["WeatherCache", "ActiveCity", "City", "CachePolicy"],
    inherits: "default",
    WeatherCache: {
      extra: "cityCode      String   // 华风城市代码（如：01011712）\nxmlData       String   @db.Text",
      unique: [["[cityCode]"]],
      indexes: ["expiresAt"],
    },
    City: {
      extra: "cityCode      String   @unique  // 华风城市代码\nname          String   // 城市名称\nqweatherId    String?  // 对应和风天气城市ID\nprovince      String?  // 省份\ncountry       String?  @default(\"中国\")",
    },
  },
};
// <<< CAIJUE GENERATED END <<<