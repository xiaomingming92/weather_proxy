// ⚠️ 由 caijuehub/transcribe-devices.ts 自动生成，不要手动编辑！
// 改 caijuehub/*-rules.toml 后重新运行: npm run generate:devices

// >>> CAIJUE GENERATED START >>>
export const DEVICE_REGISTRY = [
  {
    name: "zte",
    basePath: "/zte/getweatheru.asmx",
    router: "@/routes/zte-weather.js",
    dataTransform: "@/services/zte/data-transform.js",
    cache: "@/services/cache/zte-cache.js",
    activeCityService: "@/services/zte/active-city-service.js",
    cron: {
      forecastUpdate: "ZTE_FORECAST_UPDATE",
      cacheCleanup: "ZTE_CACHE_CLEANUP",
      activeCityCleanup: "ZTE_ACTIVE_CITY_CLEANUP",
      citySync: "ZTE_CITY_SYNC",
    },
  },
  {
    name: "htc-accu",
    basePath: "/widget",
    router: "@/routes/htc-accu-weather.js",
    dataTransform: "@/services/htc/htc-accu-data-transform.js",
    cache: "@/services/cache/htc-accu-cache.js",
    activeCityService: "@/services/htc/active-city-service.js",
    cron: {
      forecastUpdate: "HTC_ACCU_FORECAST_UPDATE",
      cacheCleanup: "HTC_ACCU_CACHE_CLEANUP",
      activeCityCleanup: "HTC_ACCU_ACTIVE_CITY_CLEANUP",
      citySync: "HTC_ACCU_CITY_SYNC",
    },
  },
  {
    name: "htc-huafeng",
    basePath: "/getweatheru.asmx",
    router: "@/routes/htc-huafeng-weather.js",
    dataTransform: "@/services/htc/htc-huafeng-data-transform.js",
    cache: "@/services/cache/htc-huafeng-cache.js",
    activeCityService: "@/services/htc/huafeng-active-city-service.js",
    cron: {
      forecastUpdate: "HTC_HUAFENG_FORECAST_UPDATE",
      cacheCleanup: "HTC_ACCU_CACHE_CLEANUP",
      activeCityCleanup: "HTC_HUAFENG_ACTIVE_CITY_CLEANUP",
      citySync: "HTC_HUAFENG_CITY_SYNC",
    },
  },
  {
    name: "htc-g13",
    basePath: "/api/v1/htc-g13",
    router: "@/routes/htc-g13-weather.js",
    dataTransform: "passThrough",
    cache: "@/services/cache/htc-g13-cache.js",
    activeCityService: "@/services/htc/g13-active-city-service.js",
    cron: {
      forecastUpdate: "HTC_G13_FORECAST_UPDATE",
      cacheCleanup: "HTC_ACCU_CACHE_CLEANUP",
      activeCityCleanup: "HTC_G13_ACTIVE_CITY_CLEANUP",
      citySync: "HTC_G13_CITY_SYNC",
    },
  },
];
// <<< CAIJUE GENERATED END <<<