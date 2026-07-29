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

This project is for technical discussion only. No legal discussion, no commercial use.

---

## 📹 Live Demo

> 🚧 Real-device demo video coming soon — stay tuned.

<!--
  Edit on GitHub web: drag & drop the mp4 into the editor,
  then paste the generated user-attachments URL on its own line below
  to render an embedded player.
-->
<!-- DEMO_VIDEO_PLACEHOLDER -->

---

## Technical Details

> Architecture design, the Centralized Adjudication Layer, the 14-endpoint list, the porting guide, and the ADD-paradigm human-AI collaboration evidence chain → [docs/weather-proxy/knowledge/02-规范/DEVELOPMENT.md](docs/weather-proxy/knowledge/02-规范/DEVELOPMENT.md) (Chinese)

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

## Contact

- Maintainer: [xiaomingming92](https://github.com/xiaomingming92)
- Email: wujixmm@gmail.com
