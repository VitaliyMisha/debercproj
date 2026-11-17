---
name: ship
description: Завершення робочої гілки Деберца — верифікація, PROGRESS.md, мерж у локальний main, git push origin main (деплой на Vercel), прибирання worktree і гілки. Запускає лише власник через /ship.
disable-model-invocation: true
---

# Мерж і деплой

`git push origin main` — це і є продакшн-деплой (Vercel). **Жодних команд `vercel`.** Гілку чи worktree ніколи не пуш прямо в remote main
(`git push origin HEAD:main` заборонено).

## 1. Перевірка у гілці

```bash
bun run lint && bun run type-check && bun run test && bun run build
```
Хоч одна червона — зупинись. Дерево має бути чисте: усе закомічено.

## 2. PROGRESS.md

Онови `PROGRESS.md` у гілці: сьогоднішня дата, що зроблено, що далі. Пиши коротко, бо файл має бюджет (`tests/claudeConfig.test.ts`).
Старі записи, які вже стали історією, переноси в `docs/claude-history/progress.md`. Закоміть.

## 3. Мерж у локальний main

Якщо сесія у worktree, спершу виконай `ExitWorktree` (keep), а далі працюй в основному checkout:

```bash
git checkout main && git pull --ff-only && git merge <гілка>
bun run test            # після мержу, на main
```
Конфлікт або червоні тести: зупинись і покажи власникові.

## 4. Деплой

**Спитай підтвердження**, потім виконай `git push origin main`. Мерж у локальний main (крок 3) роблять без питань.

## 5. Прибирання

```bash
git worktree remove .claude/worktrees/<назва>   # якщо був worktree
git branch -d <гілка>
git push origin --delete <гілка>                # якщо гілку пушили
```
