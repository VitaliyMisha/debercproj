# PROGRESS.md — Деберц Score App

## Поточний стан (2026-05-17)

Проєкт у робочому стані. UI перероблено на "Card Table Dark - Vintage" тему. Логіка гри відповідає правилам. Тестів: **92** (усі зелені).

---

## Завершено

### UI (Casino Redesign)
- Design tokens: felt-green фон, gold gradient, card-bg, Share Tech Mono для цифр
- Шрифти: Righteous + Poppins + Share Tech Mono (Google Fonts)
- `SetupScreen.tsx` — замінив GameSettings + GameRules + блок імен
- `ScoreBoard.tsx` — brass-border для лідера, countUp анімація, progress bars
- `RoundForm.tsx` — per-player клікабельні casino chip кнопки (Б/ХВ/ВіС)
- `RoundHistory.tsx` — stagger анімація, getVisDisplayValue для відображення
- `GameHeader.tsx` — рефактор
- `WinnerScreen.tsx` + CardSuitsRain анімація
- `PlayerStatistics.tsx` — детальна статистика
- Кутові символи масті (♠♥♣♦) в App.tsx
- Easter eggs: emoji-префікси для відомих імен (Заєць, Бая, Кіш, Сірко, Горох, Ося)

### Логіка і тести
- `GameRulesConfig` перенесено з `GameRules.tsx` → `src/types.ts`
- `GameRules.tsx`, `GameSettings.tsx`, `WinnerMessage.tsx` — видалено
- Підтримка від'ємних чисел (-20, -100) у полях вводу (`isValidScore`)
- `getVisDisplayValue` — нова утиліта для відображення ВіС у history
- Виправлено баг: `'ВіС'` (U+0456) vs `'ВІС'` (U+0406) — тепер нормалізація через `.toUpperCase()`

### Правила гри (виправлено за підтвердженням користувача)
- Кожен Б після 1-го отримує штраф `secondBPenalty` (не тільки 2-й)
- ВіС нічия (рівні очки) = перенос, не поразка
- Незакритий ВіС в кінці гри — ігнорується
- Тільки 1 ВіС на раунд

### Нові фічі (2026-05-17)
- **Undo last round** (`handleUndoLastRound` в `App.tsx`): видаляє останній раунд, відновлює dealerId, скидає winnerPlayer. Кнопка "↩ Undo" у хедері `RoundHistory` — видима тільки поки немає переможця.
- **Fanfare при перемозі** (`src/hooks/useSound.ts` + `WinnerScreen.tsx`): Web Audio API арпеджіо C5→E5→G5→C6 + sustained chord + haptic вібрація. Без зовнішніх файлів, офлайн-сумісний.
- **Тести для undo** (8 нових у `tests/game.test.ts`): покривають усі комбінації останнього раунду — числа, Б, ВіС-виграш, ВіС-поразка, ВіС-незакритий, ХВ.

---

## Архітектурні нотатки

### ВіС токен — два представлення
- **Зберігається** у `Round.scores` як `'ВІС'` (uppercase І, U+0406) — повертає `parseScore`
- **Відображається** у history через `getVisDisplayValue` як `'ВіС'` (lowercase і, U+0456)
- Всі порівняння у `getVisDisplayValue` та `PlayerStatistics` використовують `.toUpperCase()` для сумісності з обома форматами

### Тести (92 tests, 3 files)
- `tests/helpers.test.ts` — основний набір: `isValidScore`, `parseScore`, `calculateGameTotals`, `getVisDisplayValue`
- `tests/game.test.ts` — інтеграційні сценарії + 8 undo-сценаріїв
- `tests/saveWinCounts.test.ts` — localStorage

---

## Потенційні наступні кроки (не заплановано)

- Історія між сесіями (localStorage зберігає тільки winCounts, не раунди)
- PWA offline-режим
- Анімація при досягненні targetScore
