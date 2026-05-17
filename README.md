# Деберц — Score App

PWA-додаток для ведення рахунку в українській карточній грі **Деберц**. Підтримує 2–4 гравців, повністю офлайн, без бекенду.

**Live:** https://deberc.vercel.app

---

## Функціонал

- Підтримка **2, 3 або 4 гравців**
- Два режими цілі: **510** (швидка) і **1020** (класика)
- Токени рахунку: числові очки, **Б**, **ХВ**, **ВіС**
- Автоматичний підрахунок штрафів і бонусів за правилами гри
- Редагування будь-якого раунду після запису
- **Undo** останнього раунду
- Snapshot-перегляд рахунку на будь-який раунд (RoundTimeline)
- Статистика гравців за сесію
- Зберігання кількості перемог між сесіями (localStorage)
- Налаштування правил: штраф за Б, штраф за ХВ, вмикання/вимикання ВіС
- **Фанфара** при перемозі (Web Audio API + haptic вібрація)
- **PWA**: встановлюється на Android/iOS, працює офлайн
- Easter egg: emoji-префікси для відомих імен

---

## Стек

| | |
|---|---|
| UI | React 19, TypeScript |
| Стилі | Tailwind CSS v4, Google Fonts (Righteous, Poppins, Share Tech Mono) |
| Білд | Vite 7, Bun |
| Якість | Biome (lint + format), `tsc --noEmit` |
| Тести | Vitest (92 тести) |
| PWA | vite-plugin-pwa (Workbox) |
| Деплой | Vercel (auto deploy з `main`) |

---

## Розробка

```bash
bun install        # встановити залежності

bun run dev        # дев-сервер http://localhost:5173
bun run build      # продакшн білд
bun run preview    # preview продакшн білду

bun run test       # запустити всі тести
bun run lint       # перевірка Biome (read-only)
bun run lint:fix   # автовиправлення Biome
bun run type-check # tsc --noEmit
```

Запуск окремого тест-файлу:

```bash
bun x vitest run tests/game.test.ts
```

---

## Деплой

Єдиний спосіб: `git push origin main` — Vercel підхоплює автоматично.

> Не запускати `vercel` CLI — це створює дублікат деплою.

---

## Архітектура

```
src/
├── App.tsx              # весь стан гри, оркестрація компонентів
├── types.ts             # Player, Round, Game, GameRulesConfig
├── utils/
│   └── gameHelpers.ts   # вся чиста логіка гри (calculateGameTotals, parseScore, …)
├── hooks/
│   └── useSound.ts      # Web Audio API: fanfare, chip click, undo pop
├── components/
│   ├── SetupScreen.tsx  # екран налаштування гри
│   ├── GameHeader.tsx   # хедер з номером гри та дилером
│   ├── ScoreBoard.tsx   # поточний рахунок гравців
│   ├── RoundForm.tsx    # форма введення раунду
│   ├── RoundHistory.tsx # таблиця всіх зіграних раундів
│   ├── RoundTimeline.tsx# горизонтальний таймлайн раундів / snapshot
│   ├── WinnerScreen.tsx # екран переможця з анімацією
│   ├── PlayerStatistics.tsx # детальна статистика
│   └── …               # Button, ChipGroup, PenaltySheet, PlayerRow, …
└── styles/
    └── index.css        # Tailwind @theme токени, keyframes
```

Весь стан живе в `App.tsx`, без роутінгу і без сервера. Рахунок ніде не зберігається між сесіями (тільки `winCounts` і `gameRules` у localStorage).

---

## Правила гри

Детальний опис реалізованих правил — у [`docs/GAME_RULES.md`](docs/GAME_RULES.md).

---

## Ліцензія

MIT
