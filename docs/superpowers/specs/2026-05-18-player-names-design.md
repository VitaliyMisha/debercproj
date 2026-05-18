# Player Name History Design

## Goal

Зберігати всі унікальні імена гравців у localStorage, щоб при введенні нового імені показувати dropdown-підказки з раніше введеними іменами.

## Context

Зараз поля імен у SetupScreen завжди порожні. Користувачі, що грають регулярно з однією компанією, змушені вводити ті самі імена кожного разу. `autoComplete="off"` відключає браузерний автокомплїт.

---

## Behavior

### Збереження

- Імена зберігаються в момент натискання **"Почати гру"** (`createGame()` в App.tsx).
- Зберігаються тільки непорожні імена (після `trim()`).
- **Дедуплікація**: case-insensitive порівняння. Якщо ім'я вже є в списку — стара версія видаляється, нова (з останньої гри) додається в кінець.
  - "vasya" + "Vasya" → залишається "Vasya" (новіша версія).
- Зберігаються **всі унікальні імена** без ліміту.

### localStorage ключ

```
playerNames → JSON масив string[]
```

### Dropdown підказки

- З'являються коли `value.trim().length > 0` і є хоча б один збіг.
- **Фільтрація**: case-insensitive contains — "ва" знайде "Ваня" і "Слава".
- Поточне значення виключається з підказок при **точному** case-insensitive збігу.
- Клік/тап на підказку → заповнює поле + закриває dropdown.
- Закривається на `onBlur` з затримкою 150ms (щоб клік по підказці спрацював до blur).
- **Не з'являється** при порожньому полі (тільки при введенні).

---

## Architecture

### Нові утиліти в `src/utils/gameHelpers.ts`

```typescript
const PLAYER_NAMES_KEY = 'playerNames';

function loadPlayerNames(): string[]
function savePlayerNames(newNames: string[]): void
```

`loadPlayerNames` — повертає `[]` при будь-якій помилці парсингу або відсутньому ключі.

`savePlayerNames(newNames)`:
1. Завантажує існуючий список.
2. Для кожного нового імені (непорожнього, trimmed): видаляє case-insensitive дублікат зі старого списку.
3. Додає нові імена в кінець.
4. Зберігає результат.

### Новий компонент `src/components/NameInput.tsx`

```typescript
interface NameInputProps {
  id?: string;
  name?: string;
  value: string;
  placeholder?: string;
  suggestions: string[];
  onChange: (value: string) => void;
}
```

- Локальний стан: `open: boolean`.
- Обчислює `filtered` (з `suggestions`, не зберігає в стані — завжди з пропсів).
- Відображає `<input>` + абсолютно-позиційований dropdown нижче.
- Wrapper `div` — `relative` для позиціонування dropdown.
- Easter egg логіка **не входить** — залишається у `PlayerRow`.

### Зміни в існуючих компонентах

**`src/components/PlayerRow.tsx`**:
- Новий prop: `suggestions: string[]` (default `[]`).
- `<input>` замінюється на `<NameInput suggestions={suggestions} ... />`.
- Easter egg залишається в `onChange` обгортці.

**`src/components/SetupScreen.tsx`**:
- Новий prop: `playerNames: string[]`.
- Передає `playerNames` у кожен `<PlayerRow suggestions={playerNames} />`.

**`src/App.tsx`**:
- `const [playerNames, setPlayerNames] = useState<string[]>(() => loadPlayerNames())`.
- В `createGame()`: `savePlayerNames(names.map(n => n.trim()).filter(Boolean))` + `setPlayerNames(loadPlayerNames())`.
- `<SetupScreen playerNames={playerNames} ... />`.

---

## Visual Style

Dropdown:
```
rounded-xl bg-card-bg border border-white/10
shadow-lg shadow-black/40
z-50, absolute, top-full mt-1, w-full
```

Кожен пункт:
```
px-4 py-2.5 text-sm text-white/80 font-sans
hover:bg-white/10 cursor-pointer
first:rounded-t-xl last:rounded-b-xl
```

---

## Testing

Нові unit-тести в `tests/playerNames.test.ts`:

- `savePlayerNames` + `loadPlayerNames` round-trip
- `loadPlayerNames` повертає `[]` при відсутньому ключі
- `loadPlayerNames` повертає `[]` при пошкодженому JSON
- Дедупліkація: "vasya" → "Vasya" (новіша перемагає)
- Дедупліkація зберігає інші імена без змін
- Порожні імена не зберігаються

---

## Out of Scope

- Видалення окремого імені з історії.
- Ліміт кількості збережених імен.
- Показ dropdown при порожньому полі (тільки при введенні).
- Keyboard navigation у dropdown (стрілки/Enter) — mobile-first, достатньо тапу.
- Окремий екран управління іменами.
