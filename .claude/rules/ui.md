---
paths:
  - "src/components/**"
  - "src/hooks/useSound.ts"
  - "src/styles/**"
  - "src/App.tsx"
  - "src/main.tsx"
---

# UI: компоненти, анімації, доступність

Для складних дизайн-рішень викликай skill `ui-ux-pro-max`.

- **Іконки**: структурні беруться ТІЛЬКИ з `lucide-react` (SVG), не emoji. Контентні emoji (👑 🏆 🔥 🃏) дозволені.
- **Motion**: JS-анімації (WAAPI, View Transitions) мусять перевіряти `prefers-reduced-motion` і мати `typeof`-guard для jsdom (`el.animate`, `document.startViewTransition`).
  CSS-анімації глушить media-query в `src/styles/index.css`.
- **Спільні примітиви, не дублюй їх**: `BottomSheet` (основа `PenaltySheet`, `ShareSheet`, `RulesSheet`), `HoldButton` (підтвердження утриманням замість confirm-шторки: «Нова гра», undo раунду), `Avatar` (`initialOf`), `LangToggleButton`.
  Шторку тримай локальним станом компонента, що її відкриває, а не в `App.tsx`.
- **Keydown на контейнері з вкладеними кнопками** фільтруй через `e.target === e.currentTarget`, бо keydown спливає (так було з хедером `RoundHistory`).
- `RoundForm`: поля `inputMode="numeric"`. iOS numpad не має мінуса, тому є чіп **±**. Enter або натискання чіпа переводить фокус на наступне порожнє поле.
- `Odometer`: колонки ключуються справа, щоб цифри прокручувались, а не перемонтовувались. Індексні ключі тут свідомі (`biome-ignore` з поясненням).
- `ScoreBoard`: ключ картки НЕ містить `deltaKey`, інакше картки перемонтовуються щораунду. Дельта має власний `key`. Реакції на раунд (ВіС-жетон, трусіння, червоний обідок) приходять з `roundEvents`.
- `useSound`: 12 звуків на Web Audio API без файлів. Тумблер `soundEnabled` живе в `App.tsx`. Вібрація при submit спрацьовує лише з вимкненим звуком, бо `roundSubmit()` вібрує сам.
- `ErrorBoundary` — класовий компонент, тому бере `i18next.t` напряму, не хук.
- Тема столу задається атрибутом `data-table` на `<html>` і CSS vars `--color-felt`/`--felt-tint` в `index.css`.
