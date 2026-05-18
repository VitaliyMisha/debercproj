# Session Persistence Design

## Goal

Зберігати поточну гру в localStorage після кожної зміни, щоб при закритті/перезавантаженні додатку користувач міг продовжити з того місця де зупинився.

## Context

Зараз в localStorage зберігаються тільки `gameId`, `gameRules`, `playerWinCounts`. Поточна гра (раунди, рахунки, гравці) втрачається при закритті вкладки. Це підтверджений реальний pain point.

---

## Behavior

### Автозбереження

- Зберігається після кожного `addRound`, `updateRound`, `handleUndoLastRound`.
- **Не зберігається** якщо `game.rounds.length === 0` (гра ще не почалась — нічого відновлювати).
- Якщо переможець визначений (`winnerPlayer !== null`) — теж зберігається, щоб відновити WinnerScreen.
- **Очищується** при `resetGame()` і `continueGame()` (користувач явно починає нове).

### localStorage key

```
savedGame → JSON рядок типу SavedGameState
```

### Тип SavedGameState

```typescript
type SavedGameState = {
  game: Game;
  targetScore: number;
  winnerPlayer: number | null;
};
```

`gameRules` не дублюється — вже зберігається окремо під ключем `gameRules`.

---

## Recovery Screen

При запуску додатку (до рендеру SetupScreen) перевіряється localStorage:

- **Є збережена гра** → показується `RecoverScreen` замість `SetupScreen`.
- **Немає** → звичайний `SetupScreen`.

### RecoverScreen

Відображає стан збереженої гри:

- Заголовок: "Незавершена гра #N" (або "Завершена гра #N" якщо є переможець)
- Підзаголовок: "Раунд X · до Y очок"
- Міні-скорборд: аватар + ім'я + рахунок + progress bar для кожного гравця (casino-стиль, без анімацій)
- Кнопка **"Продовжити гру"** (primary) → відновлює стан і відкриває ігровий екран (або WinnerScreen якщо є переможець)
- Кнопка **"Нова гра"** (secondary) → `clearGameState()` + показати `SetupScreen`

RecoverScreen дотримується casino dark theme: `bg-card-bg`, gold gradient заголовок, brass border.

---

## Architecture

### Нові утиліти в `src/utils/gameHelpers.ts`

```typescript
const SAVED_GAME_KEY = 'savedGame';

function saveGameState(state: SavedGameState): void
function loadGameState(): SavedGameState | null
function clearGameState(): void
```

Всі три — прості обгортки над `localStorage.setItem/getItem/removeItem` з JSON серіалізацією. `loadGameState` повертає `null` при будь-якій помилці парсингу.

### Новий компонент `src/components/RecoverScreen.tsx`

Props:
```typescript
interface RecoverScreenProps {
  savedState: SavedGameState;
  gameRules: GameRulesConfig;
  onRecover: () => void;
  onDiscard: () => void;
}
```

Отримує `gameRules` з App (вже завантажені) для розрахунку `calculateGameTotals`.

### Зміни в `App.tsx`

1. **Init**: читаємо `loadGameState()` при ініціалізації → `useState` ініціалізується зі збереженим станом якщо є.

2. **Автозбереження**: `useEffect` на `[game, targetScore, winnerPlayer]` → якщо `game !== null && game.rounds.length > 0`, викликає `saveGameState(...)`.

3. **Recovery flow**: новий стан `recoveredState: SavedGameState | null`. Якщо встановлений → рендерити `RecoverScreen` замість `SetupScreen`.

4. **`onRecover`**: відновлює `game`, `targetScore`, `winnerPlayer` зі збереженого стану. Очищує `recoveredState`.

5. **`onDiscard`**: `clearGameState()` + `setRecoveredState(null)` → показує `SetupScreen`.

6. **`resetGame` і `continueGame`**: додати виклик `clearGameState()`.

---

## Edge Cases

- **Пошкоджений JSON** в localStorage → `loadGameState()` повертає `null`, додаток стартує як завжди.
- **Несумісна версія даних** (майбутні зміни типів) → той самий `null`-fallback при помилці парсингу.
- **Гра з переможцем** → `RecoverScreen` показує "Завершена гра", кнопка "Продовжити" веде до `WinnerScreen`.
- **`game.rounds.length === 0`** → не зберігаємо (немає чого відновлювати, SetupScreen достатньо).

---

## Testing

Нові unit-тести в `tests/saveWinCounts.test.ts` (або окремий `tests/savedGame.test.ts`):

- `saveGameState` + `loadGameState` round-trip
- `loadGameState` повертає `null` при відсутньому ключі
- `loadGameState` повертає `null` при пошкодженому JSON
- `clearGameState` видаляє ключ

---

## Out of Scope

- Збереження кількох ігор одночасно (один слот).
- Синхронізація між пристроями.
- Термін дії збереженої гри (expiry) — зберігається до явного скидання.
- Збереження імен гравців для quick-select (окрема фіча, наступний крок).
