# Spectator Mode — Режим перегляду гри

**Дата:** 2026-05-20  
**Статус:** Затверджено  

---

## Мета

Дозволити хосту поділитися активною грою через QR-код. Глядач сканує QR → відкриває URL у браузері → бачить повний ігровий UI (ScoreBoard + RoundHistory) в режимі реального часу, без можливості редагувати.

---

## Архітектура

### Sync-шар: Firebase Realtime Database

При вмиканні шерингу хост пушить `SavedGameState + gameRules` у Firebase за ключем `games/{game.id}`. При кожній зміні `game` — оновлює запис. Spectator підписується через `onValue()` і отримує live-оновлення.

**Нові залежності:**
- `firebase` (SDK v10, tree-shakeable — імпортуємо тільки `database` модуль)
- `qrcode.react` (QR-код компонент)

### Spectator entry point

URL: `https://deberc.app?watch={gameId}`

`App.tsx` при старті перевіряє `new URLSearchParams(location.search).get('watch')`. Якщо є — входить у spectator-режим через `useSpectator(watchId)` замість звичайного стану.

---

## Data Model

Firebase Realtime DB структура:

```
games/
  {gameId}/
    game:          Game object (players, rounds, dealerId, ...)
    targetScore:   number
    winnerPlayer:  number | null
    gameRules:     GameRulesConfig
    hostUpdatedAt: number (timestamp)
```

Це рівно `SavedGameState + gameRules`. Жодних нових типів.

**Lifecycle:**
- **Створюється/оновлюється** при кожній зміні `game`, якщо `isSharing === true`
- **Видаляється** коли хост натискає "Зупинити шеринг" або "Нова гра"
- **TTL:** не реалізується в MVP — записи живуть до явного cleanup

**Firebase Security Rules:**
```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": "newData.child('hostUpdatedAt').exists()"
      }
    }
  }
}
```
Read public, write тільки якщо `hostUpdatedAt` виставлено.

---

## Нові файли

### `src/hooks/useFirebaseSync.ts`

Hook для хоста. Отримує `game`, `targetScore`, `winnerPlayer`, `gameRules`, `isSharing`. При `isSharing === true` і будь-якій зміні — пушить у Firebase. При `isSharing → false` або unmount — видаляє запис.

```ts
useFirebaseSync({ game, targetScore, winnerPlayer, gameRules, isSharing })
```

### `src/hooks/useSpectator.ts`

Hook для глядача. Підписується на `games/{watchId}` через `onValue()`. Повертає:

```ts
{ game, targetScore, winnerPlayer, gameRules, status: 'loading' | 'live' | 'ended' | 'not_found' }
```

`status === 'ended'` коли запис зникає з Firebase (хост зупинив шеринг або завершив гру).

### `src/components/ShareSheet.tsx`

Bottom sheet (аналогічно `ConfirmSheet.tsx`):
- QR-код (`<QRCodeSVG>` з `qrcode.react`) з URL `?watch={gameId}`
- Кнопка «Копіювати посилання» (`navigator.clipboard.writeText`)
- Кнопка «Зупинити шеринг» → `onStopSharing()` + закрити sheet

### `src/config/firebase.ts`

Ініціалізація Firebase app + database instance. Конфіг береться з `import.meta.env.VITE_FIREBASE_*` змінних.

---

## UI зміни

### `GameHeader.tsx`

Новий проп: `isSharing`, `onShareToggle`.

Нова кнопка 📡 між мовою і звуком:
- Якщо `!isSharing` → натискання вмикає шеринг + відкриває ShareSheet
- Якщо `isSharing` → натискання відкриває ShareSheet (QR вже активний)
- Кнопка підсвічується/пульсує коли `isSharing === true`

### `App.tsx`

**З боку хоста:**
- Додати `isSharing: boolean` стан
- `handleShareToggle` — вмикає/вимикає шеринг
- При "Нова гра" → `isSharing = false` (cleanup через `useFirebaseSync`)
- Підключити `useFirebaseSync`

**Spectator entry:**
```ts
const watchId = new URLSearchParams(location.search).get('watch');
```
Якщо `watchId` є → `useSpectator(watchId)` → рендер spectator layout.

### Spectator Layout (в `App.tsx`)

```
┌─────────────────────────────┐
│ 👁 Режим перегляду · Гра #5 │  ← банер
├─────────────────────────────┤
│       ScoreBoard             │
├─────────────────────────────┤
│       RoundHistory           │  (без кнопок edit/undo)
└─────────────────────────────┘
```

- `RoundForm` — не рендериться
- `RoundHistory` — prop `readOnly={true}` ховає кнопки edit і undo
- `WinnerScreen` — рендериться якщо `winnerPlayer !== null` (без кнопки "Нова гра")
- `status === 'ended'` → показуємо «Гру завершено або шеринг зупинено»
- `status === 'loading'` → спінер/скелетон
- `status === 'not_found'` → «Гру не знайдено»

---

## Environment Variables

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

Додаються в `.env.local` (локально) і в Vercel Environment Variables (для деплою).

---

## Що НЕ входить в MVP

- Авторизація хоста (будь-хто з посиланням може читати — це прийнятно для домашньої гри)
- TTL / автоочищення старих записів у Firebase
- Кілька одночасних глядачів — Firebase підтримує це автоматично, нічого додаткового не треба
- Push-нотифікації для глядачів
