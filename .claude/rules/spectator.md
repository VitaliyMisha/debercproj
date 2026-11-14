---
paths:
  - "src/config/firebase.ts"
  - "src/hooks/{useFirebaseSync,useSpectator}.ts"
  - "src/components/{ShareSheet,RoundTimeline,SpectatorSkeleton}.tsx"
  - "tests/ui/{useFirebaseSync,useSpectator}.test.tsx"
---

# Режим глядача (Firebase Realtime Database)

- Конфіг береться з `VITE_FIREBASE_*` у `.env.local` (gitignored) і з Vercel Dashboard. **Worktree без `.env.local` не монтує застосунок** (Firebase FATAL),
  тому для локальної перевірки скопіюй файл з основного checkout.
- **Хост, `useFirebaseSync`**: поки `isSharing`, пише стан у `games/${shareCode}`. Прибирання серверне, через `onDisconnect(gameRef).remove()`.
  Слухач `.info/connected` після КОЖНОГО reconnect заново реєструє onDisconnect (після спрацювання сервер його забуває) і перезаписує стан.
- **Глядач, `useSpectator`**: заходить через `?watch=<code>`, статуси `loading | live | ended | not_found`. Перехід у `ended`/`not_found` йде з дебаунсом 1,5 с
  на **кожен** порожній snapshot, включно з першим: Firebase коротко повертає null під час `set()` хоста, а рефреш глядача якраз потрапляє на такий перший callback.
  Попередній таймер очищуй перед новим.
- **Firebase не зберігає порожні масиви**, тож `rounds`/`players` відновлюються через `?? []`.
- Події раунду (`roundEvents`) зараз отримує лише хост.
- Використовується тільки базове API (`ref`/`set`/`onValue`/`onDisconnect`/`remove`). Firestore не імпортуй, бо він тягне в бандл `@grpc/grpc-js`.
