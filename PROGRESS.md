# PROGRESS.md — Деберц Score App

## Поточний стан (2026-05-17)

Проєкт у робочому стані. UI перероблено на "Card Table Dark - Vintage" тему. Логіка гри відповідає правилам. Тестів: **92** (усі зелені). PWA коректно працює на Android Chrome.

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

### Нові фічі
- **Undo last round** (`handleUndoLastRound` в `App.tsx`): видаляє останній раунд, відновлює dealerId, скидає winnerPlayer. Кнопка "↩ Undo" у хедері `RoundHistory` — видима тільки поки немає переможця.
- **Fanfare при перемозі** (`src/hooks/useSound.ts` + `WinnerScreen.tsx`): Web Audio API арпеджіо C5→E5→G5→C6 + sustained chord + haptic вібрація. Без зовнішніх файлів, офлайн-сумісний.
- **Тести для undo** (8 нових у `tests/game.test.ts`): покривають усі комбінації останнього раунду — числа, Б, ВіС-виграш, ВіС-поразка, ВіС-незакритий, ХВ.

### PWA / Mobile fixes
- **Horizontal overflow** — `overflow-x: hidden` на `html, body, #root` + `w-full overflow-x-hidden` на root App div
- **Кутові символи** — замінив `overflow-hidden` на `clipPath: 'inset(0)'` + `contain: 'strict'` (надійніше в Android WebView)
- **Dealer button** — перенесено з окремої кнопки справа в кружечок гравця (уникає overflow); 👑 показується замість цифри коли гравець — дилер
- **beforeunload** — listener додається тільки коли `game.rounds.length > 0` (після user gesture), інакше Chrome блокував діалог
- **Form id/name** — всі `<input>` отримали `id`, `name`, `autoComplete` атрибути (PlayerRow, RoundForm, RoundHistory, PenaltySheet)
- **PenaltySheet** — виправлено баг закриття (backdrop click не спрацьовував через неправильний event target); додано: кнопка ✕, клік по backdrop, swipe-down жест (≥80px)
- **`width: 0%` → `width: 0`** у `@keyframes progressFill` (CSS lint warning)

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

### useSound hook
- `src/hooks/useSound.ts` — Web Audio API без зовнішніх файлів
- `fanfare()` — єдина функція що використовується (WinnerScreen.tsx, на маунті)
- `chipClick`, `roundSubmit`, `undoPop` — реалізовані але не підключені до UI

---

## Потенційні наступні кроки (не заплановано)

- Історія між сесіями (localStorage зберігає тільки winCounts, не раунди)
- Анімація при досягненні targetScore
- Підключити chip click / round submit звуки до RoundForm
