# PROGRESS.md — Деберц Score App

## Поточний стан (2026-08-22)

Проєкт у робочому стані. Тестів: **168** (усі зелені). Lint (Biome 2.5) та type-check (tsc) — чисті. Гілка `worktree-game-rules-edge-cases` готова до мерджу в `main` (7 комітів), ще не запушена.

### Едж-кейси правил гри задокументовано та протестовано (2026-08-22)

Через brainstorming → plan → subagent-driven-development пройдено повний цикл по 5 едж-кейсах, знайдених аудитом `docs/GAME_RULES.md` і `tests/helpers.test.ts` (детальний spec і plan — `docs/superpowers/specs/2026-08-22-game-rules-edge-cases-design.md` / `docs/superpowers/plans/2026-08-22-game-rules-edge-cases-plan.md`, обидва гітігноровані, локальні).

**Що з'ясувалось і задокументовано (без зміни коду — поведінка вже була коректною, лише не описаною й не протестованою):**
- **Кілька незалежних підвішених ВіС одночасно** — дозволено; другий ВіС, зіграний поки перший ще не вирішено, "мирно співіснує" з першим ЛИШЕ якщо тим самим раундом опонент теж набрав `0` (нічия для першого ВіС); інакше другий ВіС автоматично програє перший (див. нижче).
- **Нечисловий токен (`Б` або `ВіС`) у раунді, що мав розв'язати підвішений ВіС** — рахується як `0` для порівняння з опонентом: опонент `> 0` → підвішений ВіС програє (а сам токен, якщо це `Б`, рахується ще й як окрема власна Б-подія — штрафи `secondBPenalty` складаються в одному раунді); опонент **рівно `0`** → нічия, переноситься далі; опонент **`< 0`** (від'ємний рахунок) → підвішений ВіС **виграє** (`0` більше за від'ємне число) — цю третю гілку спершу сформулював неправильно ("0 або менше → нічия"), піймано фінальним code review, виправлено.
- **Ротація дилера** — точна формула (`(currentIndex + 1) % playerCount`, wrap-around по колу) і що undo відновлює дилера **зі скасованого раунду** (`Round.dealerId`), а не просто рухає на крок назад.
- **Нічия на фініші** (два гравці одночасно `≥ targetScore` з однаковим рахунком) — гра коректно лишається активною, `WinnerScreen` не показується (вже було вірно в `findWinner`, бракувало App-рівневого RTL-тесту).

**Єдина реальна зміна коду:** `SetupScreen.tsx` тепер блокує старт гри при дублікаті імені гравця (case/whitespace-insensitive, як `winCountKey`) — `playerWinCounts`/`playerNames` індексуються за нормалізованим ім'ям, дублікат раніше мовчки ламав трекінг перемог. Плюс дрібний supporting-фікс з фінального рев'ю: `createGame` в `App.tsx` тепер теж тримить імена при створенні гравців (консистентно з гардом у сетапі).

**Нові тести:** `tests/helpers.test.ts` (+3: подвійний ВіС, подвійний Б-штраф, ВіС-виграш при від'ємному опоненті), `tests/ui/dealerRotation.test.tsx` (новий файл, wrap-around + undo), `tests/ui/appWinner.test.tsx` (+1: нічия на фініші), `tests/ui/setupScreen.test.tsx` (новий файл, 4 тести на дублікати імен). 158 → 168.

**Процес:** виконано через subagent-driven-development у ізольованому `.claude/worktrees/game-rules-edge-cases` — 6 задач плану, кожна з окремим subagent-imlementer і task-review, плюс фінальний whole-branch review (opus), одна хвиля виправлень (1 Important: помилка у формулюванні правила ВіС вище; 3 Minor: тест на win-гілку, `role="alert"` на попередження дублікатів, trim імен), скопований re-review — усе ADDRESSED, нових поломок немає.

### Fixed: глядач втрачав доступ до гри при рефреші (2026-08-10)

**Симптом**: спектатор рефрешить `?watch=<code>` і бачить "Гру не знайдено", хоча хост усе ще грає.

**Root cause** (підтверджено живим репро через `firebase/database` `goOffline()`/`goOnline()` у двох табах): `useSpectator.ts` дебаунсив (1.5с) перехід у `'ended'` тільки для НЕ першого callback від `onValue` (`firstCallRef`). Але рефреш сторінки — це завжди новий hook-інстанс, тобто новий "перший" callback. Якщо в момент рефрешу хост саме перепідключається (Firebase `onDisconnect` коротко стирає `games/${code}` до того як reconnect-хендлер його відновить — `useFirebaseSync.ts`), глядач ловить порожній snapshot як перший callback → миттєво `'not_found'`, без грейс-періоду, який рятує той самий сценарій для вже підключеного глядача.

**Фікс**: `useSpectator.ts` — прибрано `firstCallRef`, дебаунс тепер застосовується до КОЖНОГО порожнього snapshot (перший чи ні). Замість "перший → одразу not_found" стан лишається `'loading'` (skeleton) на час дебаунсу; якщо дані так і не прийшли — статус вирішується новим `sawDataRef` (чи бачили колись живі дані для цього `watchId`): `'not_found'` якщо ні, `'ended'` якщо так.
- **Тест-регресія**: `tests/ui/useSpectator.test.tsx` — новий тест "recovers without a further refresh when a spectator reloads mid-blip", симулює точний сценарій (порожній перший snapshot → live дані приходять у вікні дебаунсу → статус `'live'`, без флеша `'not_found'`).
- Побічний ефект: генуїнно неправильний `?watch=` код тепер показує skeleton на 1.5с довше перед `'not_found'` замість миттєвої помилки — прийнятний компроміс, уникає флешу помилки при тимчасових мережевих гальмуваннях.

### Регресія знайдена і виправлена самоперевіркою (2026-07-19)

Після закриття лінт-беклогу знайдено баг, внесений новим `onKeyDown` на хедері RoundHistory: keydown від вкладеної кнопки Undo спливав до хедера, `preventDefault` ковтав нативний click кнопки — Enter на Undo згортав історію замість підтвердження скасування раунду. Суто клавіатурний баг (мишею/тачем працювало), тести його не бачили.

- **Фікс**: guard `e.target === e.currentTarget` в обробнику хедера (`RoundHistory.tsx`).
- **+2 RTL-тести** у `tests/ui/roundHistory.test.tsx`: клавіатурний toggle хедера (Enter/Space) і регресійний «Enter на вкладеній Undo відкриває confirm, а не згортає історію». Перевірено чесність тесту: без guard він падає. 155 → 157 тестів.
- **Урок**: обробники клавіш на контейнерах із вкладеними інтерактивними елементами завжди мусять фільтрувати `e.target !== e.currentTarget` (keydown bubbles).

### Лінтер полагоджено: biome був фейковим (2026-07-19)

**Критична знахідка**: у `package.json` роками стояв пакет `biome@0.3.3` — це **чужий dotenv-пакет 2016 року**, не лінтер. Його CLI мовчки ігнорував `check` і повертав exit 0 → `bun run lint` був повним no-op, усі попередні «Lint чистий» — фікція. Справжній `@biomejs/biome` не був встановлений взагалі.

**Зроблено:**
1. `package.json`: видалено фейковий `biome` і невикористаний `axios` (ніде в `src/` не імпортувався); додано `@biomejs/biome@2.5.4` у devDependencies. Скрипти `lint`/`lint:fix` без змін — тепер резолвляться у справжній бінарник.
2. Перший реальний прогін: 86 errors / 45 warnings. `biome check --write` (safe fixes) переформатував 48 файлів — код ніколи не проходив крізь справжній форматер.
3. `biome.json`: додано `css.parser.tailwindDirectives: true` — без цього Biome не парсить `@theme` у `index.css` (parse error). CSS відформатовано.
4. Верифікація після фіксів: 155 тестів ✅, tsc ✅, production build ✅.
5. CLAUDE.md: додано секцію Spectator Mode / Firebase (useFirebaseSync, useSpectator, env vars, гоча `?? []`), прибрано неіснуючий `mcp_config.json`.

**Беклог lint закрито тієї ж сесії (2026-07-19) — `bun run lint` повністю чистий.** Ключові рішення:
- **NameInput**: додано повноцінну клавіатурну навігацію за APG combobox-патерном — ArrowUp/Down, Enter (вибір), Escape, `aria-activedescendant` + підсвітка активної опції; фокус лишається на input, опції не табабельні. Розмітка `ul[role=listbox] > li[role=option]` — канонічна, false-positive правила заглушені `biome-ignore` з поясненнями.
- **RoundHistory**: хедер-toggle отримав `tabIndex={0}` + `onKeyDown` (Enter/Space) — тепер доступний з клавіатури; `<label htmlFor>` у редакторі; тип `onUpdateRound` звужено до `=> boolean` (глядацька гілка повертає `true`); deps ефекту анімації → `[rounds]` (guard по length всередині лишився).
- **Odometer**: `role="text"` (нестандартна) → `role="img"` з `aria-label` — обидві aria-діагностики закриті.
- **Свідомі `biome-ignore` (усі з поясненням у коментарі)**: index-keys у Odometer (колонки keyed справа — механіка прокрутки), CardSuitsRain (статичний useMemo-масив), SetupScreen (позиційні слоти гравців); `useExhaustiveDependencies` у RoundTimeline (deps — тригери повторного скролу, ефект читає DOM); `!important` у CSS (reduced-motion kill-switch ×3 + close-finish override).
- Дрібне: `Number.isNaN` замість `isNaN` ×2, `node:fs` протокол, `<title>Деберц</title>` у favicon.svg, dot-notation у тестах, explicit throw замість `call?.[1](...)` у useFirebaseSync.test.
- `biome migrate --write`: конфіг оновлено під схему 2.5.4 (`recommended: true` → `preset: "recommended"`).
- Верифікація: lint ✅, тести ✅, tsc ✅, build ✅.

### Оновлення залежностей (2026-07-19, коміт "redesign app")

Коміт `7743197` попри назву змінив лише `package.json`/`bun.lock`: typescript 6→7, мінорні бампи firebase/i18next/vite/vitest/tailwind/lucide. Верифіковано: тести/tsc/build чисті.

### UI/UX покращення (2026-07-05, вечірня сесія)

1. **Numeric-клавіатура** (`RoundForm.tsx`): `inputMode="numeric"` на полях рахунку — мобільна клавіатура одразу цифрова. iOS numpad не має мінуса → доданий чіп **±** (togglе знаку) поруч із Б/ХВ/ВіС. Редагування в історії лишається text (там токени вводяться вручну).
2. **Автофокус** (`RoundForm.tsx`): Enter або клік по чіпу → фокус на наступне порожнє поле; всі заповнені → фокус на кнопку "Додати раунд".
3. **SVG-іконки (lucide)** замість структурних emoji: 📡→RadioTower, 🔊/🔇→Volume2/VolumeX (GameHeader), ✏️→Pencil, ↩→Undo2, ▶/▼→Chevron (RoundHistory). Лейбл `history.edit` тепер без emoji (оновлені RTL-тести). Контентні emoji (👑 🏆 🔥 🃏) лишились.
4. **Odometer** (`src/components/Odometer.tsx` + CSS): рахунок у ScoreBoard тепер механічне табло — кожна цифра вертикальна стрічка 0-9, колонки keyed справа (одиниці стабільні при 99→102). `useCountUp` видалено (був єдиний споживач). aria-label з числом, цифри aria-hidden. RTL-тести в `tests/ui/odometer.test.tsx`.
5. **Мітки прогрес-бару** (ScoreBoard): засічки на 25/50/75%.
6. **Серія перемог**: `winStreak(rounds, playerId)` у gameHelpers (TDD, 5 тестів) — послідовні останні раунди зі строго найвищим рахунком (токени = 0, нічия рве серію). Бейдж 🔥N на картці від 3+. У снапшот-режимі рахується по зрізаних раундах.
7. **Політ фішки дилера** (ScoreBoard): FLIP-анімація — при зміні дилера бейдж "Д" летить від старої картки до нової (WAAPI clone, дуга з scale 1.25; guards: reduced motion, відсутність `.animate` у jsdom).
8. **Spectator skeleton** (`SpectatorSkeleton.tsx`): shimmer-плейсхолдер замість тексту "Завантаження…" — без стрибка макета.
9. **Теми столу**: green (дефолт) / burgundy / navy — CSS vars `--color-felt` + `--felt-tint` через `[data-table]` на `<html>`; свотчі в SetupScreen; localStorage `tableTheme`. Кнопки/чіпи лишаються спільної палітри.
10. **View Transitions API**: `withViewTransition()` в App — плавний crossfade між екранами (setup → гра, нова гра, recover/discard). Fallback для Safari/jsdom, вимикається при `prefers-reduced-motion` (сам media-query для CSS-анімацій вже був у index.css).

### Технічний борг закрито (2026-07-05)

1. **ErrorBoundary** (`src/components/ErrorBoundary.tsx`, підключений у `main.tsx`): рендер-краш більше не означає білий екран — fallback з поясненням (збережена гра відновлюється після перезавантаження) і кнопкою "Перезавантажити". i18n ключі `error.crashTitle/crashHint/crashReload`. Class component (у error boundaries немає hook-еквівалента), тому `i18next.t` напряму.
2. **Firebase — покинуті ігри** (`useFirebaseSync`): серверне очищення через `onDisconnect(gameRef).remove()`. Слухач `.info/connected` перереєструє onDisconnect після кожного reconnect (сервер забуває його після спрацювання) і перезаписує актуальний стан (тимчасовий обрив міг стерти запис). Latest-стан для reconnect-хендлера — через ref. TTL-сканування не потрібне.
3. **React Testing Library** — доданий (`@testing-library/react` + `user-event` + `jsdom`; env через `// @vitest-environment jsdom` прагму, без зміни глобального конфігу). Нові тести в `tests/ui/`:
   - `appWinner.test.tsx` — **ключовий regression**: повний флоу через UI (setup → раунд → перемога → редагування) перевіряє, що winCount інкрементиться один раз, відкочується коли редагування скасовує перемогу, і НЕ подвоюється при повторній перемозі; + відновлення winCounts за іменем.
   - `useSpectator.test.tsx` — not_found/live/ended, дебаунс 1.5с, перезапуск дебаунсу, відновлення порожніх масивів (мок firebase/database).
   - `useFirebaseSync.test.tsx` — запис стану, реєстрація onDisconnect, перезапис при reconnect, cancel+remove при unmount.
   - `roundHistory.test.tsx` — валідація редагування (2×Б / 2×ВіС disabled Save + підказка), `onUpdateRound === false` тримає редактор, readOnly ховає контроли.
   - `errorBoundary.test.tsx` — fallback + reload.
   - Нюанси jsdom: `Element.prototype.scrollIntoView` застаблений (RoundTimeline), звук безпечний (getCtx має try/catch), firebase мокається через `vi.mock`.

### ScoreBoard: layout для 3 гравців (2026-07-04)
- Проблема: `grid-cols-3` на мобільному давав ~110px на картку — імена обрізались, бейджі (Д/👑) стискались.
- Рішення (обрано користувачем з 3 варіантів): **«Лідер зверху»** — сітка завжди `grid-cols-2`; при 3 гравцях перша картка (найвищий рахунок, `sorted[0]`) отримує `col-span-2` (проп `spanFull` у `PlayerCard`). 2 гравці — як було; 4 — сітка 2×2. Працює і для глядача (спільний ScoreBoard).

### Code review + виправлення (2026-07-04)

Проведено повне ревью проєкту, всі знайдені баги виправлено (TDD для логіки в `src/utils/`):

**Виправлені баги:**
1. **Подвійний інкремент winCount** — `updateWinner` замінено на `syncWinner` (`App.tsx`) з транзиціями: null→id інкремент, id→null відкат, idA→idB обидва. Редагування раунду після перемоги більше не накручує перемоги; якщо редагування опускає всіх нижче target — `winnerPlayer` скидається і інкремент відкочується. Чиста логіка визначення переможця — `findWinner` у `gameHelpers.ts` (з тестами).
2. **Stale `snapshotRound`** — скидається у `createGame` і `resetGame`; нова гра зі снапшот-режиму більше не ховає RoundForm.
3. **Штраф 0** — `parseScore`: `||` → `??` (тести на `hvPenalty: 0`, `secondBPenalty: 0`).
4. **Валідація редагування раунду** — `validateRoundTokens` (нова утиліта, з тестами) у `updateRound` (App) + інлайн-підказка і disabled Save у `RoundHistory`; `onUpdateRound` повертає `false` → редактор лишається відкритим.
5. **Хронологія Б при редагуванні** — `updateRound` передає у `parseScore` лише раунди ДО редагованого (було: всі крім поточного — ранній Б бачив пізніші як "попередні").
6. **winCounts за іменами** — `winCountKey(name)` (trim+lowercase, з тестами): id гравців регенеруються щогри, тому старий ключ по id ніколи не збігався; тепер перемоги реально персистяться між іграми з тими ж іменами.
7. **`SavedGameState.gameRules`** — правила зберігаються разом із грою (optional для старих збережень); `handleRecover` і `RecoverScreen` використовують збережені правила.
8. **`useSpectator`** — попередній 'ended'-таймер очищається перед створенням нового (дебаунс перезапускається коректно).
9. **ScoreBoard countUp** — key картки більше не містить `deltaKey` (карти не ремаунтяться щораунду, анімація рахунку знову працює); дельта отримала власний `key={deltaKey}`.
10. **ShareSheet** — "Скопійовано" тільки при успішному записі в clipboard; cleanup таймера.
11. **PlayerStatistics** — `parseInt(_, 10)`, прибрано optional chaining на required prop, `calculateGameTotals` викликається один раз (був O(гравці × раунди)).

**Дедуплікація:**
- `bestOpponent(scores, pid)` — ВіС-резолюція "мій рахунок vs найкращий опонент" тепер в одному місці (було 3: `calculateGameTotals`, `getVisDisplayValue` ×2, звуковий блок `addRound`).
- `BottomSheet.tsx` — спільний примітив для `ConfirmSheet`/`PenaltySheet`/`ShareSheet` (backdrop, slide-up, swipe-down у всіх трьох).
- `Avatar.tsx` + `initialOf()` — кружечок з ініціалом у 6 компонентах.
- `LangToggleButton.tsx` — кнопка мови (було 3 копії JSX).
- `StatsToggle` — кнопка показу статистики (хост/глядач) у `App.tsx`.
- `DEFAULT_GAME_RULES` у `gameHelpers.ts` (було 2 копії: App + useSpectator); `LANG_STORAGE_KEY` у `src/i18n`.
- **Видалено мертвий код**: `PlayerInput.tsx` (ніде не імпортувався, дублював easter-egg логіку PlayerRow).

**i18n:**
- Захардкоджені рядки → `t()`: `RoundTimeline` (кнопка "Повернутись до гри"), `PenaltySheet` (Закрити + підказка), `PlayerRow` (title дилера). Нові ключі: `timeline.backToGame`, `common.close`, `common.sheetCloseHint`, `setup.setDealer`.
- `GameHistory` — плюралізація через `Intl.PluralRules` (виправлено «22 перемог» → «22 перемоги», «11 перемоги» → «11 перемог»).

**Інфраструктура:**
- `tsconfig.json` — до `include` додано `tests/` (раніше тести не проходили type-check взагалі).
- Нові тести: parseScore zero penalties, `findWinner` (4), `validateRoundTokens` (5), `bestOpponent` (3), `winCountKey` (2), savedGame+gameRules (2). Разом 107 → 125.

**Оновлення 2026-07-05:** обидва пункти з "відомих обмежень" закриті — Firebase-записи чистяться через `onDisconnect`, winner-транзиції покриті RTL-тестом `tests/ui/appWinner.test.tsx`.


### Стан на 2026-05-26 (попередні сесії)

UI перероблено на "Card Table Dark - Vintage" тему. Логіка гри відповідає правилам. PWA коректно працює на Android Chrome.

**Spectator Mode (Firebase)** задеплоєно: хост генерує QR-код, глядачі відкривають посилання `?watch=<code>` і бачать гру в реальному часі (read-only). Backend — Firebase Realtime Database (europe-west1). Глядач бачить ScoreBoard, RoundHistory, PlayerStatistics, WinnerScreen (без анімації та звуку). Виправлено два баги білого екрану у глядача (деталі нижче).

**i18n (UK / EN)** задеплоєно: перемикач мови в GameHeader, всі UI-рядки перекладено, вибір мови зберігається в localStorage. Ігрові терміни (Б/ХВ/ВіС) залишаються українськими в обох мовах.

**Sounds + UX Polish** задеплоєно: 8 нових звуків (Web Audio API), gold glow анімація при наближенні до фінішу, haptic feedback на submit та undo.

**Score Delta Animation** задеплоєно: після кожного раунду над рахунком гравця плаває +/- дельта (зелена/червона), 1.8с CSS анімація.

---

## Завершено

### Spectator bugfixes (2026-05-26)
- **`src/hooks/useSpectator.ts`** — два фікси білого екрану у глядача:
  1. **Дебаунс `'ended'`** (1.5с): Firebase може коротко повертати null під час `set()` при продовженні гри хостом — без дебаунсу глядач бачив blank screen. `endedTimerRef` скасовується якщо до нього прийдуть нові live-дані.
  2. **Відновлення порожніх масивів**: Firebase Realtime Database не зберігає `[]` — при читанні `game.rounds` і `game.players` могли бути `undefined`. `calculateGameTotals` викликав `undefined.forEach()` → React crash → білий екран. Фікс: `rounds: data.game.rounds ?? []`, `players: data.game.players ?? []`.
- **`src/App.tsx`** — fallback loading state для `status === 'live' && !game` (короткий проміжок між станами).

### Spectator Mode (2026-05-21)
- **`src/config/firebase.ts`** — ініціалізація Firebase app + Realtime Database (env vars з `.env.local`)
- **`src/hooks/useFirebaseSync.ts`** — хук хоста: записує стан гри до `games/${shareCode}` при кожній зміні поки `isSharing`; видаляє запис при зупинці шерингу або unmount
- **`src/hooks/useSpectator.ts`** — хук глядача: підписується на `onValue(games/${watchId})`; розрізняє `not_found` (перший callback без даних) vs `ended` (дані зникли після отримання) через `firstCallRef`; типи: `SpectatorStatus = 'loading' | 'live' | 'ended' | 'not_found'`; **дебаунс 1.5с** для переходу в `'ended'` — запобігає flash коли Firebase тимчасово повертає null під час продовження гри хостом
- **`src/components/ShareSheet.tsx`** — bottom sheet з QR-кодом (`qrcode.react` v4, `QRCodeSVG`), кнопкою копіювання посилання (2с toggle "Скопійовано"), кнопкою "Зупинити шеринг"
- **`src/App.tsx`** — `watchId` з `?watch=` URL param; `isSharing`/`shareCode`/`showShareSheet` стани; `handleShareOpen` генерує UUID-код; spectator layout у `watchId` гілці; `resetGame` скидає шеринг першим
- **`src/components/GameHeader.tsx`** — кнопка 📡 коли шеринг активний (gold стиль); `isSharing` + `onShareOpen` пропси
- **`src/components/RoundHistory.tsx`** — `readOnly?: boolean` пропс: ховає undo та edit кнопки
- **`src/components/WinnerScreen.tsx`** — `hideAnimation?: boolean` пропс: пропускає `<CardSuitsRain />` для глядача (уникає flash на Android Chrome)
- **Spectator layout** — баннер з вбудованою кнопкою мови, ScoreBoard, WinnerScreen (опційно), RoundHistory (readOnly), PlayerStatistics з кнопкою Показати/Приховати
- **Firebase Security Rules**: `"!newData.exists() || newData.child('hostUpdatedAt').exists()"` — дозволяє запис і видалення
- **env vars**: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` — в `.env.local` (gitignored) і Vercel Dashboard
- **Loading screen**: `index.html` містить inline зелений splash-screen (`#app-loading`), прибирається при mount React (`main.tsx`)
- **PWA**: `scope: '/'` явно в `vite.config.ts` manifest для Android deep links

### i18n доповнення (2026-05-21)
- `setup.playerName` — переклад placeholder імені гравця (виправлено хардкод у `PlayerRow.tsx`)
- `share.*` — всі рядки для ShareSheet та spectator банера
- `stats.show` / `stats.hide` — кнопки показу/приховання статистики (хост і глядач)

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
- SEO: `<meta name="description">` в `index.html`

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
- Тільки 1 Б на раунд (валідація у UI: chip disabled + тести)

### Нові фічі
- **Undo last round** (`handleUndoLastRound` в `App.tsx`): видаляє останній раунд, відновлює dealerId, скидає winnerPlayer. Кнопка "↩ Undo" у хедері `RoundHistory` — видима тільки поки немає переможця.
- **Fanfare при перемозі** (`src/hooks/useSound.ts` + `WinnerScreen.tsx`): Web Audio API арпеджіо C5→E5→G5→C6 + sustained chord + haptic вібрація. Без зовнішніх файлів, офлайн-сумісний.
- **Sound toggle** (`GameHeader.tsx`): кнопка вмикання/вимикання звуку в хедері.
- **Close-to-finish indicator** (`ScoreBoard.tsx`): індикатор коли гравець близько до цільового рахунку.
- **New-game confirmation** (`GameHeader.tsx` → `ConfirmSheet.tsx`): bottom sheet замість inline підтвердження.
- **`ConfirmSheet.tsx`** — перевикористовуваний bottom sheet для підтверджень (замінив inline confirm у GameHeader та RoundHistory).
- **Session persistence** (`SavedGameState` тип + `saveGameState` / `loadGameState`): автозбереження активної гри до localStorage; при наступному запуску — `RecoverScreen` пропонує відновити або почати нову.
- **`RecoverScreen.tsx`**: показує збережену гру (гравці, рахунок, прогрес), кнопки "Відновити" та "Нова гра". Повна aria-розмітка.
- **Player name history** (`loadPlayerNames` / `savePlayerNames` у `gameHelpers.ts`): зберігає список імен між сесіями; при старті гри — `NameInput` з dropdown-автодоповненням.
- **`NameInput.tsx`**: input з dropdown-автодоповненням, фільтрація по введеному тексту, iOS-фікс для selection, aria-expanded, touch targets ≥44px.
- **Тести для undo** (8 сценаріїв у `tests/game.test.ts`): числа, Б, ВіС-виграш, ВіС-поразка, ВіС-незакритий, ХВ.
- **`tests/savedGame.test.ts`** — 55+ рядків тестів для `SavedGameState` serialization/deserialization та localStorage utilities.
- **`tests/playerNames.test.ts`** — тести для `loadPlayerNames` / `savePlayerNames`.

### PWA / Mobile fixes
- **Horizontal overflow** — `overflow-x: hidden` на `html, body, #root` + `w-full overflow-x-hidden` на root App div
- **Кутові символи** — замінив `overflow-hidden` на `clipPath: 'inset(0)'` + `contain: 'strict'` (надійніше в Android WebView)
- **Dealer button** — перенесено з окремої кнопки справа в кружечок гравця (уникає overflow); 👑 показується замість цифри коли гравець — дилер
- **beforeunload** — listener додається тільки коли `game.rounds.length > 0` (після user gesture), інакше Chrome блокував діалог
- **Form id/name** — всі `<input>` отримали `id`, `name`, `autoComplete` атрибути (PlayerRow, RoundForm, RoundHistory, PenaltySheet)
- **PenaltySheet** — виправлено баг закриття (backdrop click не спрацьовував через неправильний event target); додано: кнопка ✕, клік по backdrop, swipe-down жест (≥80px)
- **`width: 0%` → `width: 0`** у `@keyframes progressFill` (CSS lint warning)
- **`NameInput` iOS** — `onMouseDown` guard щоб не розфокусовувало input під час вибору з dropdown на iOS Safari

### Lighthouse / Performance
- `index.html`: preconnect до Google Fonts, `<meta description>` для SEO
- `App.tsx` / `GameHeader.tsx` / `SetupScreen.tsx`: a11y атрибути, aria-label, role
- `index.css`: дрібні CSS fixes

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

### Session persistence
- `SavedGameState` тип в `src/types.ts`: серіалізований знімок `Game` + `gameRules`
- `saveGameState` / `loadGameState` / `clearSavedGame` у `src/utils/gameHelpers.ts`
- localStorage ключ: `savedGame` (JSON)
- Auto-save відбувається при кожній зміні `game` в `App.tsx` через `useEffect`
- `RecoverScreen` показується при старті якщо є збережена гра з `rounds.length > 0`
- Захист від stale-save: при undo до нуля раундів — `clearSavedGame()`; shape validation при `loadGameState`

### Player name history
- `loadPlayerNames` / `savePlayerNames` у `src/utils/gameHelpers.ts`
- localStorage ключ: `playerNames` (JSON array of strings)
- Дедуплікація при збереженні (case-insensitive); guard проти no-op writes
- `NameInput.tsx` — окремий компонент, `SetupScreen` використовує замість звичайного `<input>`
- iOS-специфічний фікс: `onMouseDown` на dropdown-item викликає `e.preventDefault()` щоб не розфокусовувати input до збереження вибору

### Тести (125 tests, 5 files)
- `tests/helpers.test.ts` — основний набір: `isValidScore`, `parseScore` (вкл. нульові штрафи), `calculateGameTotals`, `getVisDisplayValue`, `findWinner`, `validateRoundTokens`, `bestOpponent`
- `tests/game.test.ts` — інтеграційні сценарії + 8 undo-сценаріїв + 3 regression-тести для updateRound+Б бугу
- `tests/saveWinCounts.test.ts` — localStorage winCounts + `winCountKey`
- `tests/savedGame.test.ts` — `SavedGameState` serialization (вкл. `gameRules`) + localStorage persistence
- `tests/playerNames.test.ts` — `loadPlayerNames` / `savePlayerNames`
- Тести проходять type-check: `tsconfig.json` include містить `tests/`

**Покриття (оновлено 2026-07-05):** `useFirebaseSync`, `useSpectator`, `RoundHistory` (edit), App winner-флоу та `ErrorBoundary` тепер покриті RTL-тестами у `tests/ui/`. Не покрито: решта UI-компонентів (ShareSheet, ScoreBoard-рендер тощо) — низький ризик.

### useSound hook (повністю підключено, 2026-05-19)
- `src/hooks/useSound.ts` — Web Audio API без зовнішніх файлів
- `fanfare()` — використовується у `WinnerScreen.tsx` на маунті
- Sound toggle — глобальний стан `soundEnabled` в `App.tsx`, передається у `GameHeader`
- **Усі звуки підключені:**
  - `chipClick` → будь-який числовий чіп у `RoundForm`
  - `hvSound` → чіп ХВ у `RoundForm`
  - `visPlay` → чіп ВіС у `RoundForm`
  - `roundSubmit` → успішний submit раунду в `App.tsx`
  - `undoPop` → undo в `App.tsx`
  - `bSound` → перший Б гравця після submit
  - `secondBSound` → другий і подальші Б після submit
  - `visWin` / `visLose` → розв'язка ВіС після submit (порівняння bCounts до/після)
  - `newGame` → старт нової гри
  - `closeFinish` → перший раз коли гравець наближається до фінішу (≤100 від targetScore); one-shot per player via `closeFinishFiredRef`

### Gold Glow анімація
- `ScoreBoard.tsx`: `isCloseToFinish` (`score > 0 && targetScore - score <= 100`) → `goldGlow 1.4s ease-in-out infinite`
- `index.css`: `@keyframes goldGlow` — золотий box-shadow pulse; замінив старий `firePulse`

### Haptic feedback
- Submit раунду: `navigator.vibrate(30)` — одиночний пульс (тільки якщо звук вимкнено, бо `roundSubmit()` сам вібрує коли звук увімкнено)
- Undo: `navigator.vibrate([20, 30, 20])` — подвійний дотик

---

### Score Delta Animation (2026-05-19)
- `App.tsx`: `roundDeltas` + `deltaKey` state, `deltaTimerRef` для cleanup; обчислення `newTotals - oldTotals` в `addRound`
- `ScoreBoard.tsx`: `PlayerCard` key змінено на `${player.id}-${deltaKey}` для re-mount при кожному раунді; delta елемент зеленим/червоним кольором
- `index.css`: `@keyframes scoreDeltaFloat` + `.score-delta` (1.8s ease-out, float up + fade)

---

### i18n (UK / EN) — 2026-05-20
- `src/i18n/locales/uk.ts` + `en.ts` — bundled TypeScript локалі, TypeScript перевіряє повноту обох мов через `typeof uk`
- `src/i18n/index.ts` — синхронна ініціалізація i18next, `CustomTypeOptions` augmentation для type-safe `t()`
- `App.tsx`: `lang` стан + `handleLangChange` (useCallback) + `i18n.changeLanguage()`
- `GameHeader.tsx`: кнопка `УК`/`EN` поруч зі звуком
- Всі компоненти оновлено: SetupScreen, RoundForm, RoundHistory, WinnerScreen, RecoverScreen, ScoreBoard, ConfirmSheet, PlayerStatistics, GameHistory
- localStorage ключ `lang` — зберігає вибір між сесіями

---

## Потенційні наступні кроки (не заплановано)

- Повна історія ігор між сесіями (localStorage зберігає тільки winCounts + поточну гру)
- Поділитись результатом (share card для WhatsApp/Telegram)
- Статистика всіх часів (вінрейт, серії) поверх історії ігор
- Правила гри в UI (bottom sheet "?")
- Лічильник глядачів для хоста (Firebase presence)
- iPad layout improvements