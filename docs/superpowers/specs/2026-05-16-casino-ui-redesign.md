# Деберц — Casino UI Redesign

**Дата:** 2026-05-16  
**Фаза:** 1 з 2 (Design First; Logic/Tests — окремий spec)  
**Пріоритет:** Мобайл-first (375px base), потім desktop

---

## 1. Design System

### Палітра

| Роль | Значення | Використання |
|---|---|---|
| `--felt` | `#0C1A0E` | Головний фон всіх екранів |
| `--card-bg` | `#192134` | Картки, панелі, секції |
| `--gold-from` | `#D97706` | Початок gold gradient |
| `--gold-to` | `#FCD34D` | Кінець gold gradient |
| `--primary` | `#15803D` | Кнопки, активні чіпи |
| `--primary-dark` | `#166534` | Hover/press стан primary |
| `--score-pos` | `#4ADE80` | Позитивні очки |
| `--score-neg` | `#F87171` | Штрафи (ХВ, 2-га Б) |
| `--token-vis` | `#C4B5FD` | Токен ВІС |
| `--token-b` | `#FCD34D` | Токен Б |
| `--muted` | `#6B7280` | Вторинний текст |
| `--border` | `rgba(255,255,255,0.08)` | Межі карток |

### Felt-текстура фону

```css
background-color: #0C1A0E;
background-image:
  radial-gradient(ellipse at 20% 30%, rgba(21,128,61,0.18) 0%, transparent 60%),
  radial-gradient(ellipse at 80% 70%, rgba(21,128,61,0.12) 0%, transparent 50%),
  repeating-linear-gradient(45deg, transparent, transparent 2px,
    rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px);
```

### Типографіка

- **Righteous** (Google Fonts) — назва гри, великі цифри рахунку, номери раундів
- **Poppins** (Google Fonts) — імена гравців, підписи, правила, кнопки

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Righteous&display=swap');
```

Tailwind config:
```ts
fontFamily: {
  display: ['Righteous', 'sans-serif'],
  sans: ['Poppins', 'sans-serif'],
}
```

### Анімації

| Назва | Деталі | Тригер |
|---|---|---|
| `countUp` | Число "накручується" від старого до нового, 300ms ease-out | Додавання раунду |
| `buttonPress` | `scale(0.97)` → spring back, 200ms | Tap/click будь-якої кнопки |
| `goldPulse` | Glow box-shadow пульсує 3s infinite | Картка лідера |
| `cardSuitsRain` | 20 символів ♠♥♦♣ падають зі spin+fade, 4s | Переможець |
| `slideInStagger` | Slide-in зверху + fade, stagger 50ms | Новий раунд в history |
| `progressFill` | Width 0→N%, 600ms ease | Оновлення прогрес-бару |
| `leaderTransfer` | Gold border переходить між картками, 400ms | Зміна лідера |

Всі анімації вимикаються при `prefers-reduced-motion: reduce`.

---

## 2. Екран налаштувань (Setup Screen)

### Компонент: `SetupScreen`

Замінює поточні `GameSettings` + `GameRules` + розділ імен у `App.tsx`.  
Один прокрутний екран, **без акордеонів**.

### Макет (mobile, зверху вниз)

```
Header:  "Деберц ♠" (Righteous, gold gradient) + suits watermark (♥♦♣ opacity 0.12)

Section: ГРАВЦІВ
  ChipGroup (single-select): [2 гравці] [3 гравці] [4 гравці]

Section: ДО ПЕРЕМОГИ
  ChipGroup (single-select): [510 — швидка] [1020 — класика] + custom chips якщо є

Divider (gold gradient)

Section: ГРАВЦІ  (subtitle: 👑 = дилер)
  PlayerRow × N:
    Avatar (ініціал, green gradient circle)
    TextInput (ім'я)
    CrownButton (👑, тільки одна активна = дилер)

Divider

Section: ПРАВИЛА
  RuleChips:
    [ВІС ✓ / ВІС ✗]  — toggle
    [2-га Б: −100]   — тап відкриває PenaltySheet
    [ХВ: −100]       — тап відкриває PenaltySheet

StartButton: "🎴 Почати гру" (disabled поки хоч одне ім'я порожнє)
```

### Поведінка

- **Зміна кількості гравців** не скидає імена: існуючі зберігаються, додається/прибирається порожній рядок знизу.
- **CrownButton**: тільки один активний. При виборі нового — попередній гасне без анімації.
- **PenaltySheet**: bottom sheet зі слайдером (−200 до 0, крок 10). Значення оновлюється одразу при переміщенні слайдера (live preview на чіпі). Закривається свайпом вниз або тапом на overlay — зміни зберігаються.
- **StartButton**: активується тільки коли всі N полів імен заповнені (trim не порожній).

### Компоненти що видаляються

`GameSettings.tsx`, `GameRules.tsx` (або повністю переписуються як `SetupScreen`).

---

## 3. Екран активної гри (Game Screen)

### Компоненти

**`GameHeader`** — назва "Деберц", номер гри, ціль, дилер badge.

**`RoundTimeline`** — горизонтальний скрол з pills:
- `past` (зелені) — вже зіграні раунди
- `current` (gold) — поточний
- `future` (dimmed, `·`) — ще не зіграні, показуються як сірі крапки щоб видно що гра триває; тап на них нічого не робить
- Тап на past-pill → "snapshot mode": scores і history показують стан на той момент

**`ScoreBoard`** — 2/3/4 картки гравців:
- Картка лідера: gold border + `goldPulse` glow
- Цифра рахунку: Righteous font, велика, `countUp` при зміні
- Прогрес-бар до цілі (gold для лідера, green для решти)
- При переході до snapshot mode: показує рахунок на момент вибраного раунду (без анімації)

**`RoundForm`** (прихована в snapshot mode):
- Token hint chips: `[Б]` `[ХВ]` `[ВІС]` (readonly, підсвічуються при введенні)
- PlayerInput × N: при введенні `б`/`хв`/`віс` (будь-який регістр + пробіли) → trim + toUpperCase автоматично
- Валідація при blur, не при кожному keystroke
- `maxLength` видаляємо, замість цього regex `/^(\d+|Б|ХВ|ВІС)$/i`
- "Додати раунд" disabled якщо хоч одне поле невалідне

**`RoundHistory`** — список раундів знизу:
- Новий раунд з'являється з `slideInStagger` зверху
- При snapshot mode: вибраний раунд підсвічується gold border
- Редагування раунду залишається (олівець при розгортанні)

### Snapshot Mode

```
Timeline: [1][2][►3][4][5][6]  ← тап на [3]

ScoreBoard: показує totals після раунду 3
RoundForm: прихована
Banner: "← Повернутись до гри" (gold, sticky top)
History: рядок #3 має gold outline
```

Вихід зі snapshot: тап на banner або на поточний round pill.

---

## 4. Екран переможця (Winner Screen)

### Компонент: `WinnerScreen`

Замінює поточний `WinnerMessage` + блок переможця у `App.tsx`.

### Макет

```
Background: felt (той самий)
Overlay: cardSuitsRain (20 символів, 4 сек, потім зупиняється)

Center:
  🏆 (bounce, 80px)
  "ПЕРЕМОЖЕЦЬ" (Righteous, gold gradient, 36px)

  WinnerCard (gold border, glow):
    Ім'я переможця (Righteous, 28px)
    "850 очок · 6 раундів"

  GameSummaryTable:
    Для кожного гравця: ім'я · рахунок · прогрес-бар

Actions:
  [🎮 Нова гра]       (primary green)
  [▶ Продовжити]      (secondary, зберігає гравців і дилера, скидає рахунки до 0, зберігає winCount)
```

### `cardSuitsRain` анімація

20 `<span>` з ♠♥♦♣, позиції random 0–100% по X, затримки random 0–2s, падають за 1.5–3s зі spin (`rotate 0→360deg`) і fade на останніх 30%. Після 4s — `display:none`.

---

## 5. Компоненти що перестають існувати

| Старий компонент | Замінюється |
|---|---|
| `GameSettings.tsx` | `SetupScreen.tsx` |
| `GameRules.tsx` (і `GameRulesConfig` export) | `SetupScreen.tsx` + `types.ts` |
| `WinnerMessage.tsx` | `WinnerScreen.tsx` |
| `ParticleEffect` (в App.tsx) | `CardSuitsRain.tsx` |
| `GameButton` (в App.tsx) | `Button.tsx` (окремий компонент) |

`GameRulesConfig` переїжджає з `GameRules.tsx` до `src/types.ts`.

---

## 6. Що НЕ входить у цей spec

- Фікс логіки `calculateGameTotals` (Б/ХВ/ВІС баги) — Phase 2
- Нові тести — Phase 2
- Рефакторинг `PlayerStatistics` дублювання — Phase 2
- Game history між сесіями (localStorage persist) — Phase 3
