# Local LeetCode

Минимальный локальный LeetCode для JavaScript-задач: Markdown-описание, Monaco Editor, TestCase, Run/Submit, история решений и локальный бэкап.

## Запуск

```bash
npm install
npm run dev
```

Открой `http://localhost:5173`.

## Что есть

- левый Drawer `Problem List`;
- строка действий в Drawer:
  - `Manual problem` — добавить ручную задачу;
  - иконка `Upload` — импортировать `neenza` JSON;
  - иконка `Trash` — очистить список и вернуться к seed-задачам;
- отдельные кнопки `Export backup` / `Import backup` для своих задач, решений, черновиков и заметок;
- по умолчанию есть только одна задача — ручная `Group Anagrams`;
- две категории задач:
  - `LeetCode problems` — задачи из импорта;
  - `Manual problems` — задачи, добавленные вручную и стартовая `Group Anagrams`;
- категории можно свернуть/развернуть;
- поиск по номеру, названию и slug;
- фильтр задач: все / нерешённые / решённые;
- Markdown-описание задачи;
- поле `Notes` для идеи, edge cases и complexity;
- вкладки `Description` и `Solutions`;
- история всех `Submit` с датой, временем, статусом, runtime, кейсами и кодом;
- из `Solutions` можно восстановить старое решение в редактор или удалить попытку;
- Monaco Editor для JavaScript;
- `Alt + Shift + F` — форматирование кода;
- `Ctrl + Enter` — запуск текущего testcase;
- TestCase в стиле LeetCode: `Input`, `Expected`, `Output`;
- несколько testcase на задачу;
- `Run Case` — запускает выбранный testcase;
- `Run All` — запускает все testcase без сохранения в Solutions;
- `Submit All` — запускает все testcase и сохраняет попытку в Solutions.

## Что изменено для производительности

- состояние задач переведено на `zustand`;
- задачи хранятся в `IndexedDB`, а не большим JSON в `localStorage`;
- `Problem List` хранит и рендерит только лёгкий индекс: `id`, `number`, `title`, `difficulty`, `source`, `solved`;
- полная задача загружается отдельно при выборе;
- код не записывается в хранилище на каждый символ;
- сохранение кода идёт debounce-ом через `700ms`;
- `Run` всегда берёт актуальный код из редактора, даже если debounce ещё не успел сохранить его в `IndexedDB`;
- Monaco Editor не пересоздаётся при каждом сохранении кода.

## Импорт neenza/leetcode-problems через интерфейс

1. Скачай файл `merged_problems.json` из `neenza/leetcode-problems`.
2. Открой Drawer `Problem List`.
3. Нажми иконку `Upload`.
4. Выбери скачанный JSON-файл.

Задачи сконвертируются в единый формат приложения и сохранятся в `IndexedDB`.

## Импорт/конвертация через CLI

Если хочешь зашить задачи в проект статически, положи `merged_problems.json` рядом с проектом и запусти:

```bash
npm run import:neenza -- ./merged_problems.json
```

Скрипт перезапишет файл:

```txt
src/entities/problem/model/generatedNeenzaProblems.ts
```

После этого перезапусти dev-сервер:

```bash
npm run dev
```

## Бэкап

Drawer содержит:

```txt
Export backup
Import backup
```

Бэкап сохраняет все локальные данные приложения: задачи, код, testcase, заметки и историю решений.

## Что делает конвертер neenza

- поддерживает массив задач, объект с `problems`, `data`, `items`, `questions`, а также объект-словарь;
- читает `title`, `frontend_id`, `problem_id`, `difficulty`, `problem_slug`;
- берёт описание из `description` или `content`;
- берёт JavaScript starter code из `code_snippets`;
- определяет имя функции из starter code;
- вытаскивает TestCase из блоков `Input:` / `Output:`;
- задачи из neenza помечает как `source: "leetcode"`;
- ручные задачи помечает как `source: "manual"`.

## Проверка раннера и конвертера

```bash
npm run smoke
```

## Структура

```txt
src/
  app/
  pages/
  widgets/
  features/
  entities/
  shared/
```

Структура сделана в простом FSD-стиле без лишних абстракций.
