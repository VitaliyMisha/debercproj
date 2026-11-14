---
name: deps-refresh
description: Планове оновлення npm-залежностей Деберца — ncu, мажорні окремо, Biome migrate, повна верифікація, запис у PROGRESS.md. Запускає власник через /deps-refresh.
disable-model-invocation: true
---

# Оновлення залежностей

Працюй у worktree (не на `main`). Деплою цей skill не робить: для мержу є `/ship`.

## 1. Що застаріло

```bash
bun x ncu            # перелік; npm-check-updates є в devDeps
bun audit            # базова лінія вразливостей — запиши число
```
Покажи власникові таблицю: пакет → поточна → нова → patch/minor/MAJOR. **Мажорні не чіпай без підтвердження**, кожен мажорний пакет оновлюй окремим кроком.

## 2. Оновлення

- Patch/minor: `bun x ncu -u --target minor && bun install`.
- Мажорні після підтвердження: `bun add <pkg>@latest` (або `-d`) по одному. Перед цим прочитай changelog пакета на предмет breaking changes, що стосуються нас.
- Якщо оновився `@biomejs/biome` і `lint` скаржиться на `$schema`, запусти `./node_modules/.bin/biome migrate --write`.
  Новий форматер може переформатувати `*.md`: перевір diff, що змінились лише пробіли.

## 3. Верифікація (усе має бути зеленим)

```bash
bun run lint && bun run type-check && bun run test && bun run build
```

- Перевір, що `lint` справді щось перевіряє, а не «миттєво чистий»: має стояти `@biomejs/biome`, а не фейковий пакет `biome`.
- З білду запиши розмір PWA precache (entries / KiB) і порівняй з попереднім записом у `PROGRESS.md`.
- Мажорне оновлення `firebase` або `vite-plugin-pwa` вимагає smoke-тесту продакшн-білду в браузері: `bun run preview`, SW `activated`, 0 помилок у консолі,
  `?watch=<неіснуючий код>` показує «Гру не знайдено». Для цього в worktree потрібен `.env.local`.
- `bun audit` повтори й порівняй з базовою лінією. `overrides` без погодження не додавай.

## 4. Коміт і запис

- Коміт: `chore: update <pkg> X→Y, …`.
- У `PROGRESS.md` додай ОДИН рядок у «Поточний стан»: дата, що оновлено, результат верифікації. Детальну історію не пиши: старі записи про залежності вже лежать в архіві.
