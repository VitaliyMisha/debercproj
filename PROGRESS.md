# PROGRESS.md — Деберц Score App

Тут лише поточний стан і наступні кроки: файл читається на старті КОЖНОЇ сесії.
Історія рішень (2026-05 … 2026-11-05) лежить у `docs/claude-history/progress.md`.
Дописуй сюди коротко. Коли запис стає історією, переноси його в архів, а не нарощуй цей файл
(стелю стереже `tests/claudeConfig.test.ts`).

## Поточний стан (2026-11-17)

- Усе влито в `main`, відкритих гілок немає. Перевірки: lint ✅, type-check ✅, тести ✅, build ✅.
- **2026-11-17 — motion-пакет** (ідеї з designbookmark.com/motion, без нових залежностей): `HoldButton` (утримання 1,2 с) замість `ConfirmSheet` для «Нова гра» та undo в історії (`ConfirmSheet` видалено);
  `UndoToast` «Раунд N додано | Скасувати 5» після кожного раунду; анімована копія в `ShareSheet`; пігулка «два краї» в `ChipGroup`; каскад розрядів і пружинний доїзд в `Odometer`. 218 тестів, precache 31 / 716 KiB.
- **2026-11-17 — deps**: patch/minor (firebase 13.4, lucide 1.74, vite 8.3.8, biome 2.6.8, tailwind 4.3.5 …) + MAJOR i18next 27 / react-i18next 18. Усе зелене, 202 тести, precache 31 / 709 KiB, audit 4 (без змін).
- **2026-11-14 — налаштування Claude Code приведено до best practices**: `CLAUDE.md` скорочено з ~2,6k до ~1,1k токенів (разом із `PROGRESS.md` на старті сесії тепер іде ~1,7k замість ~18,5k).
  Доменні пастки рознесено по `.claude/rules/*.md` з `paths:`, процедури винесено в skills `/deps-refresh` і `/ship`.
  Історію з `PROGRESS.md` (~16k токенів) перенесено в `docs/claude-history/`. Розкладку стереже `tests/claudeConfig.test.ts`.
- **2026-11-05**: `Round.tokens` (статистика Б/ХВ) + 5 анімацій столу (`roundEvents`). Глядач подій поки не отримує, їх бачить лише хост.

## Відомі блокери

- `bun audit`: 5 транзитивних вразливостей (`@grpc/grpc-js` через `@firebase/firestore`, який ми не бандлимо;
  `glob`/`minimatch`/`deepmerge` у build-time `workbox-build`). Чекаємо фіксу upstream, `overrides` свідомо не додано.

## Можливі наступні кроки (не заплановано)

- Події раунду (`roundEvents`) для глядача.
- Повна історія ігор між сесіями (зараз зберігаються лише winCounts і поточна гра); статистика всіх часів поверх неї.
- Share-картка результату (WhatsApp/Telegram).
- Лічильник глядачів для хоста (Firebase presence).
- Макет для iPad.
