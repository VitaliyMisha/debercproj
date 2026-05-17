# PROGRESS.md — Деберц Score App

## Поточний стан (2026-05-17)

Проєкт у робочому стані. UI перероблено на "Card Table Dark - Vintage" тему. Логіка гри відповідає правилам. Тестів: **95** (усі зелені). PWA коректно працює на Android Chrome.

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
- `GameHistory.tsx` — переписано під casino dark theme (Trophy icon, progress bars, gold градієнт для чемпіона)
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
- Тільки 1 ВіС на раунд (валідація у UI: chip disabled + помилка при submit)

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

### Code Review — виправлені баги (2026-05-17)
- **`updateRound` + Б баг** (`App.tsx`): при редагуванні раунду з першим Б, `parseScore` знаходив власний Б у `game.rounds` і повертав штраф замість `'Б'`. Фікс: передаємо `roundsExcludingCurrent` (без поточного раунду).
- **ScoreBoard hasLeader** (`ScoreBoard.tsx`): `players.some(...)` була тавтологічно true → всі гравці мали золоту рамку при 0-0. Фікс: `players.some(p => score !== 0)` — лідер підсвічується щойно хтось отримав ненульовий рахунок.
- **ВіС валідація** (`RoundForm.tsx` + `App.tsx`): не було перевірки що ВіС грає лише один гравець за раунд. Фікс: chip кнопка `disabled` для решти + помилка при submit.
- **`editingRound` після undo** (`RoundHistory.tsx`): якщо користувач відкрив редагування і натиснув undo, `editingRound` вказував на видалений раунд. Фікс: `useEffect` скасовує edit коли раунд зникає.
- **`parseInt` без radix** (`gameHelpers.ts`): `parseInt(trimmed)` → `parseInt(trimmed, 10)`.
- **`String(p.id)` консистентність**: `scores[p.id]` (number-ключ) замінено на `scores[String(p.id)]` у `App.tsx`, `RoundForm.tsx`, `RoundHistory.tsx`.
- **`as number` касти** (`gameHelpers.ts`): небезпечні `(x as number)` після type guard замінено на локальні змінні (`resolveVal`, `prevResVal`, `rawVisVal`).
- **`PlayerStatistics` gameRules** (`PlayerStatistics.tsx`): `gameRules?` (optional) → `gameRules` (required), прибрано `!` assertion.
- **`winnerObj` null safety** (`App.tsx`): `game.players.find(...)!` замінено на `useMemo` з `winnerObj`, JSX рендерить лише коли `winnerObj` не `null`.
- **`CardSuitsRain` suits** (`CardSuitsRain.tsx`): масив з random-значеннями перенесено з тіла компонента в `useMemo([])` щоб не перегенеровувався при кожному рендері.
- **`startEditing` ключ** (`RoundHistory.tsx`): `round.scores[p.id]` → `round.scores[String(p.id)]`.
- **handleBlur synthetic event** (`RoundForm.tsx`): `{ ...e, target: {...e.target, value} }` → `{ target: { value } }`.

---

## Архітектурні нотатки

### ВіС токен — два представлення
- **Зберігається** у `Round.scores` як `'ВІС'` (uppercase І, U+0406) — повертає `parseScore`
- **Відображається** у history через `getVisDisplayValue` як `'ВіС'` (lowercase і, U+0456)
- Всі порівняння у `getVisDisplayValue` та `PlayerStatistics` використовують `.toUpperCase()` для сумісності з обома форматами

### Б-токен — двошарова логіка
- `parseScore` перетворює вхідний рядок: 1-й Б → `'Б'` (рядок), 2-й+ Б → `secondBPenalty` (число)
- `calculateGameTotals` незалежно рахує `bCounts` для ВіС-поразок (лічить тільки `'Б'`-рядки, без числових пенальті)
- При `updateRound` передаємо `roundsExcludingCurrent` до `parseScore`, щоб поточний раунд не рахувався як "попередній Б"

### Тести (95 tests, 3 files)
- `tests/helpers.test.ts` — основний набір: `isValidScore`, `parseScore`, `calculateGameTotals`, `getVisDisplayValue`
- `tests/game.test.ts` — інтеграційні сценарії + 8 undo-сценаріїв + 3 regression-тести для updateRound+Б бугу
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
