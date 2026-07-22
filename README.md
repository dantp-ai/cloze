# Cloze

<p align="center">
  <img src="assets/logo.svg" alt="Cloze" width="256">
</p>

A spaced-repetition app for learning a language from sentences you write yourself.

You type a sentence, click the words you want blanked out, and practice filling them back in.
Each blanked word is tracked and scheduled on its own, so the words you keep forgetting come back sooner than the ones you know.

Runs locally, and stores everything in a Postgres database.

![intro app](assets/intro.gif)

## Requirements

- Node 20+
- Docker

## Setup

```bash
npm install
cp .env.example .env          # set SESSION_SECRET to any random 32+ char string
docker compose up -d          # starts Postgres on :5432
npx prisma migrate deploy     # creates the tables
npm run dev
```

Open http://localhost:3000.
The first account you create becomes the only account - signup closes afterwards.

Then create a workspace (the language you are learning, plus the languages you translate into), add a sentence, and start practicing.

## How it works

**Workspaces.** A workspace is one language pair, for example Italian with English translations.
Sentences, topics, cards, settings and stats all live inside a workspace, so you can keep Italian and Spanish completely separate and switch between them.

**Cards.** When you mark a word as blanked, that word becomes a card. A sentence with three blanks is three cards, each with its own schedule.

**Practice.** You get sentences whose words are due, with those words shown as blanks.
Type the word and press Enter. If you are stuck, the hint gives you multiple choice, but using it counts against the grade.
Scheduling is SM-2, and the ease, multipliers and daily new-card limit are all editable in Settings.

**Translations.** Type your own when you add a sentence, or set a DeepL or Google key in Settings and have them fetched on demand and cached.
Hold Cmd and hover a sentence to see its translation. The Read view puts the sentence and translation side by side.

**Stats.** Streak, activity heatmap, accuracy overall and per topic, how many words are new/learning/mature, and the words you get wrong most.

**Zen mode** hides the sidebar and top bar so only the sentence is left. Escape brings them back.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm test` | Test suite (needs the test database, see below) |
| `npm run test:watch` | Tests in watch mode |
| `npm run db:migrate` | Create a new migration after editing the schema |
| `npm run db:generate` | Regenerate the Prisma client |

## Tests

The tests run against a real database rather than mocks, so it needs to exist first.
The Docker container creates `cloze_test` for you on its first start.

Create `.env.test`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cloze_test?schema=public"
SESSION_SECRET="any-string-at-least-32-characters-long"
```

Then apply the migrations to it and run the suite:

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/cloze_test?schema=public' npx prisma migrate deploy
npm test
```

## Worth knowing

- Your translation API key is stored in the database and is never sent to the browser. The settings field is write-only: leave it blank to keep the key you already saved.
- Editing a sentence rebuilds its cards, which resets the review history for that sentence's words.
- The streak and heatmap group reviews by day using the server's timezone. Running it locally that is your timezone, so it does the right thing.

## Built with

Next.js 15 (App Router), TypeScript, Prisma and Postgres, Tailwind, Vitest.
