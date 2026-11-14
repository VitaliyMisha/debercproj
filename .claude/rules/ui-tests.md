---
paths:
  - "tests/ui/**"
---

# RTL-тести (`tests/ui/*.test.tsx`)

- Глобальне середовище — node. jsdom вмикається прагмою `// @vitest-environment jsdom` першим рядком файлу.
- Firebase мокається через `vi.mock('firebase/database')` + `vi.mock('../../src/config/firebase')`.
- Для `RoundTimeline` треба застабити `Element.prototype.scrollIntoView`.
- `@testing-library/jest-dom` хоч і є в devDeps, але не використовується. Перевіряй через `toBeTruthy()` / `toBeNull()`, як решта тестів.
- WAAPI і View Transitions у jsdom відсутні, тому компоненти мають `typeof`-guard (див. `.claude/rules/ui.md`).
- Регресійний тест має падати без фіксу. Перевір це один раз, тимчасово відкотивши фікс.
