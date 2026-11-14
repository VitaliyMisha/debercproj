---
paths:
  - "docs/GAME_RULES.md"
  - "src/i18n/**"
  - "src/components/RulesSheet.tsx"
  - "tests/ui/rulesSheet.test.tsx"
---

# Текст правил гри

- Джерело правди — `docs/GAME_RULES.md`. Гравецька копія тих самих правил живе в `rules.*` (`src/i18n/locales/{uk,en}.ts`) і показується через `RulesSheet.tsx`.
  **Змінюєш правило — онови обидва місця й обидві мови.** `en.ts` типізований через `typeof uk`, тому пропущений ключ ловить tsc.
- **Чисел у текст не вписуй.** Їх інтерполюють з активних `gameRules`/`targetScore`: `{{secondB}}`, `{{hv}}`, `{{target}}`. Інакше довідка бреше, щойно хтось змінить штраф.
- `allowVis: false` ховає ВіС повністю. Тому едж-кейси розділені на `edge.body` і `edge.visBody`, а перелік токенів має два варіанти: `input.tokens` / `input.tokensNoVis`.
  Не фільтруй текст пошуком слова «ВіС».
- Порядок розділів `RulesSheet` повторює `GAME_RULES.md` і закріплений у `tests/ui/rulesSheet.test.tsx`.
