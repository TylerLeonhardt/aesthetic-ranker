# 🎨 Find Your Aesthetic

A mobile-first web app that helps you discover your top 3 visual aesthetics through a Swiss-system head-to-head tournament. Data sourced from [CARI Institute](https://cari.institute/) (Consumer Aesthetics Research Institute).

**[Try it live →](https://tylerleonhardt.github.io/aesthetic-ranker/)**

## How It Works

You're presented with pairs of aesthetics — visual styles like *Cottagecore*, *Vaporwave*, or *Dark Academia* — and choose which one resonates more with you. After ~7 rounds of matchups, the app reveals your top 3 aesthetics.

### The Swiss Tournament System

Unlike single-elimination brackets, a [Swiss-system tournament](https://en.wikipedia.org/wiki/Swiss-system_tournament) gives every aesthetic multiple chances:

- **Round 1**: Random pairings
- **Subsequent rounds**: Aesthetics with similar scores are paired together
- **No rematches**: The same pair never faces off twice
- **~7 rounds** for 90 aesthetics (log₂ of the total count)

This means your rankings emerge from consistent preferences, not lucky/unlucky bracket placement.

## Tech Stack

- **React 19** + **TypeScript** — UI framework
- **Vite** — Build tool
- **Tailwind CSS v4** — Styling
- **Zustand** — State management with localStorage persistence
- **Vitest** — Testing

## Run Locally

```bash
git clone https://github.com/TylerLeonhardt/aesthetic-ranker.git
cd aesthetic-ranker
npm install
npm run dev
```

To refresh the aesthetics data from CARI:

```bash
npx tsx scripts/fetch-aesthetics.ts
```

## Run Tests

```bash
npm test
```

## Credits

All aesthetic data and images are from the [CARI Institute](https://cari.institute/) — an organization dedicated to cataloging and studying consumer aesthetics. Visit their site to explore the full catalog of visual aesthetics.

## License

MIT
