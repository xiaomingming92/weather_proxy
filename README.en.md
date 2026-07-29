# Weather Proxy (天气代理服务)

> 🌐 [🀄中文](README.md) | 🔤 English

> Some old buddies still have solid hardware — they were just forgotten by time.

## Who They Are

**ZTE V880 (Blade)**. Back in 2010, it was the legendary "free-with-your-phone-plan" budget king. Qualcomm MSM7227 single-core 600MHz, 256MB RAM, 3.5-inch capacitive screen — today it can barely open a web page, but back then it was the first smartphone for countless people. The international Orange variant shipped with 512MB of RAM while the Chinese version got only 256MB — and that alone spawned a massive flashing scene on the forums. CM7, MIUI, LeWa... modders stayed up all night flashing ROMs. "You can't brick a V880 — unless your hands are clumsy" was the secret handshake of that generation. Its daily sales once trailed only the iPhone 4, selling like crazy in 60+ countries — but 15 years later, its weather service is long dead.

**HTC G13 (Wildfire S)**. In 2011, HTC was still the "King of Android". Pebble-shaped body, 3.2-inch screen, and Sense 2.1 with that iconic flip clock and windshield-wiper rain animation — the pinnacle of smartphone UX design. Not cold functionality, but warmth. The HTC Weather service was officially shut down on December 18, 2025. The moment the servers went dark, the raindrop animation froze on screen forever.

The hardware on these devices is perfectly fine — only their software services were abandoned by the times. **They don't deserve to be thrown into a drawer.**

## What This Project Does

- 🌤️ **Bring the weather back** — a proxy service that lets the V880 and G13 receive live weather data again
- 🕐 **Sync the clock** — pairs with the [timeSync](https://github.com/xiaomingming92/timeSync) NTP-over-HTTP service, so the classic "old device can't keep time" problem is solved too
- 🔧 **Centralized Adjudication Layer (Caijuehub)** — device configuration upgraded from hard-coded TypeScript to declarative TOML rules; adding a new device model takes just ~10 lines of config

### Legal & Compliance

This is a personal technical-research and digital-preservation effort on **hardware the author owns**. It is **strictly non-commercial** and provides no paid or hosted service. The reverse-engineering involved serves device interoperability research only; weather data comes from each user's **own QWeather API key** — nothing is scraped from or resold on behalf of upstream services. The modified APKs in this repo are for **debugging and interoperability research only** — do not use them for commercial distribution or anything that infringes third-party rights. Users are responsible for their own conduct and for compliance with the laws of their jurisdiction.

---

## 📹 Live Demo

** htc_weather
https://github.com/user-attachments/assets/cab7f18e-c93e-4398-abfc-662df776b788

---

** htc_timeSync
https://github.com/user-attachments/assets/e649d5bc-6608-4992-9855-541dc99ef1a1

---

zte_weather
<img width="800" height="1876" alt="zte_v880_weather" src="https://github.com/user-attachments/assets/93693aac-c229-4d12-933f-2fe8bee2724f" />

---

## Technical Details

> Architecture design, the Centralized Adjudication Layer, the 14-endpoint list, the porting guide, and the ADD-paradigm human-AI collaboration evidence chain → [docs/weather-proxy/knowledge/02-规范/DEVELOPMENT.md](docs/weather-proxy/knowledge/02-规范/DEVELOPMENT.md) (Chinese)

### 🔬 Reverse-Engineering Notes

If you tinker with old phones, you know the process matters more than the result. The full RE trail lives under `docs/` (in Chinese — but hex dumps, endpoint tables and weather-code mappings are language-agnostic):

**HTC G13 (Wildfire S)**

- [ROM binary analysis](docs/weather-proxy/knowledge/00-需求/设备适配/HTC_G13/04_HTC_ROM二进制分析方法.md) — locating and decoding the original AccuWeather endpoints from the ROM
- [AccuWeather API analysis](docs/weather-proxy/knowledge/00-需求/设备适配/HTC_G13/01_AccuWeather_API分析与适配背景.md) + [weather-code mapping table](docs/weather-proxy/knowledge/00-需求/设备适配/HTC_G13/03_AccuWeather天气代码对照表.md) — reverse-engineered code mappings
- [Full 14-endpoint hijacking plan](docs/weather-proxy/knowledge/00-需求/设备适配/HTC_G13/06_第二阶段-全量接口劫持方案.md) — with request/response protocol dissection
- [Stock HTC weather protocol analysis](docs/weather-proxy/knowledge/00-需求/设备适配/HTC_G13/07-HTC天气原版接口适配分析.md) — field-by-field teardown

**ZTE V880 (Blade)**

- [WeatherTV XML parser analysis](docs/weather-proxy/knowledge/00-需求/设备适配/ZTE_V880/03_WeatherTV_XML解析组件分析.md) + [WeatherWidget data-flow analysis](docs/weather-proxy/knowledge/00-需求/设备适配/ZTE_V880/04_WeatherWidget数据流转分析.md) — component-level RE
- [WeatherWidget side effect: silently changes the system clock](docs/weather-proxy/knowledge/00-需求/设备适配/ZTE_V880/old/weatherWidget副作用-修改系统时间.md) — the stock widget quietly rewrites the system time; this is exactly why the companion timeSync project exists

**General**

- ADB debugging guides ([WeatherWidget walkthrough](docs/weather-proxy/knowledge/02-规范/调试/adb/ADB调试指南-WeatherWidget为例.md) / [installing self-built APKs](docs/weather-proxy/knowledge/02-规范/调试/adb/ADB安装自开发APK完整指南.md))
- [2011 weather-API vendor archaeology](docs/weather-proxy/knowledge/00-需求/API调研/2011和风和AccuWeather.md) — reconstructing how QWeather / AccuWeather looked back then

> 🗄️ **Older traces**: `.trae/` is the project's historical archive from its Trae IDE era — it keeps the original spec triplets (`specs/`: event-driven architecture, the ZTE city-list API, VPS DB backup/restore, and more), process docs filed by device and topic (`documents/`), and the development rules of that time (`rules/`). These aren't the current spec — they're the evidence trail of how this solution grew from zero, kept around for anyone who wants to dig into the backstory.

---

## Tech Stack

- **TypeScript** + **Express.js** — service core
- **Prisma ORM** — MariaDB (weather data) + PostgreSQL (devlog audit)
- **QWeather API** — upstream data source
- **node-cron** — scheduled refresh
- **Smol TOML** — rule parsing for the adjudication layer
- **Vitest** — unit tests (45 cases, full coverage)
- **Podman** — containerized databases

## Quick Start

```bash
# Requirements: Node.js ^24.11 + MariaDB + PostgreSQL (podman)

# Install
npm install

# Start databases
npm run podman-add-coder-up

# Create tables (auto backup → prisma db push)
bash scripts/db-ensure.sh postgresql podman --migrate

# Run
npm run dev
```

**Configure `.env.development`**:

```env
WEATHER_DATABASE_URL="mysql://<user>:<password>@localhost:3306/weather-proxy"
DATABASE_URL="postgresql://<user>:<password>@localhost:5433/weather-proxy"
QWEATHER_API_KEY=your_qweather_api_key
APIHost=https://api.qweather.com
```

## Project Structure

```
weather_proxy/
├── src/
│   ├── caijuehub/            ← Centralized Adjudication Layer (3-tier)
│   │   ├── caijue.toml        ←   Index: adjudication entry registry
│   │   ├── transcribe.ts      ←   Engine: TOML → strategy files
│   │   ├── devices-rules.toml ←   Rules: device registration declarations
│   │   ├── scaffold-rules.toml←   Rules: Prisma template declarations
│   │   └── strategies/        ←   Strategies: GENERATED data
│   ├── config/                ← Config (devices.ts consumes strategy data)
│   ├── routes/                ← 4 device routes (14 endpoints)
│   ├── services/              ← Business layer
│   │   ├── device-registry.ts ←   DeviceRegistry singleton
│   │   ├── cache/             ←   Cache strategy pattern
│   │   └── cron-service.ts    ←   Unified scheduler (232 lines)
│   └── server.ts              ← Express entry
├── scripts/
│   ├── scaffold-device.ts     ← Prisma model scaffolding
│   └── db-ensure.sh           ← DB init + backup
├── prisma/
│   ├── schema.prisma          ← Weather data (MariaDB)
│   └── add/schema.prisma      ← Audit data (PostgreSQL)
├── APK/                       ← Modified APKs (debugging only)
├── .qoder/                    ← ADD workflow artifacts
│   ├── plans/                 ←   Plan documents
│   ├── reviews/               ←   Review documents
│   └── specs/                 ←   Spec documents
└── tests/                     ← Vitest tests
```

## Community

The project is live on the XDA forums — join the discussion, report back, or share your revival story:

- 🟢 **ZTE V880 (Blade)** → [Weather is BACK on the ZTE Blade in 2026](https://xdaforums.com/t/app-mod-weather-is-back-on-the-zte-blade-in-2026-open-source-proxy-modded-stock-widgets-guide-reviving-the-zte-blades-weather-widget-15-year.4796456/)
- 🔵 **HTC G13 (Wildfire S)** → [Bring back live Weather on the Wildfire S](https://xdaforums.com/t/guide-open-source-bring-back-live-weather-on-the-wildfire-s-htc-servers-died-dec-2025-so-i-built-my-own-mod-weather-proxy-reviving-htc-sense.4796455/)

## Contact

- Maintainer: [xiaomingming92](https://github.com/xiaomingming92)
- Email: wujixmm@gmail.com
