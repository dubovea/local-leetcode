import Editor from "@monaco-editor/react";
import { useMemo } from "react";
import type * as Monaco from "monaco-editor";
import type { ProblemListItem } from "@/entities/problem/model/types";
import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

type PatternVisualType =
  | "prefix"
  | "pointers"
  | "window"
  | "fast-slow"
  | "reverse"
  | "stack"
  | "top-k"
  | "intervals"
  | "binary-search"
  | "tree"
  | "dfs"
  | "bfs"
  | "matrix"
  | "backtracking"
  | "dp"
  | "bits";

type Pattern = {
  title: string;
  visual: PatternVisualType;
  signal: string;
  approach: string;
  complexity: string;
  code: string;
  problems: string[];
};

type ProblemLookup = {
  exact: Map<string, ProblemListItem>;
  compact: Map<string, ProblemListItem>;
};

const patterns: Pattern[] = [
  {
    title: "Префиксные суммы",
    visual: "prefix",
    signal: "Есть много запросов суммы на отрезке или нужны накопительные значения по массиву.",
    approach:
      "Один раз построй массив префиксов, а затем отвечай на каждый запрос вычитанием двух значений.",
    complexity: "Построение O(n), запрос O(1), память O(n).",
    code: `function rangeSum(nums, left, right) {
  // Пример: nums = [2, 1, 5, 3], left = 1, right = 3.
  // Хотим быстро получить сумму nums[1] + nums[2] + nums[3] = 9.
  // prefix[i] хранит сумму первых i элементов, поэтому prefix[0] = 0.
  const prefix = [0];

  for (const num of nums) {
    // На каждом шаге добавляем текущий элемент к уже известной сумме.
    prefix.push(prefix[prefix.length - 1] + num);
  }

  // Сумма от left до right равна сумме первых right + 1 элементов
  // без суммы элементов, стоящих до left.
  return prefix[right + 1] - prefix[left];
}`,
    problems: ["Range Sum Query - Immutable", "Subarray Sum Equals K", "Continuous Subarray Sum"],
  },
  {
    title: "Два указателя",
    visual: "pointers",
    signal: "Отсортированные массивы, пары значений, палиндромы или фильтрация с двух концов.",
    approach:
      "Двигай тот указатель, который приближает состояние к цели, и остановись, когда указатели пересекутся.",
    complexity: "Обычно O(n) по времени и O(1) по памяти.",
    code: `function twoSumSorted(nums, target) {
  // Пример: nums = [1, 2, 4, 6, 8], target = 10.
  // Массив отсортирован, значит можно смотреть на самую маленькую
  // и самую большую кандидатуры одновременно.
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];

    // Если сумма совпала, оба указателя стоят на ответе.
    if (sum === target) return [left, right];

    // Сумма мала: увеличиваем её, двигая левый указатель вправо.
    if (sum < target) left += 1;
    // Сумма велика: уменьшаем её, двигая правый указатель влево.
    else right -= 1;
  }

  return [-1, -1];
}`,
    problems: [
      "Two Sum II - Input Array Is Sorted",
      "3Sum",
      "Container With Most Water",
      "Valid Palindrome",
    ],
  },
  {
    title: "Скользящее окно",
    visual: "window",
    signal:
      "Нужен непрерывный подмассив или подстрока с максимумом, минимумом, счётчиком или условием валидности.",
    approach:
      "Расширяй правую границу, сжимай левую, когда окно нарушает правило, и обновляй ответ.",
    complexity: "O(n), потому что каждая граница движется вперёд не больше n раз.",
    code: `function maxSumOfSizeK(nums, k) {
  // Пример: nums = [2, 1, 5, 1, 3, 2], k = 3.
  // Окно всегда содержит ровно k элементов, а sum хранит их сумму.
  let sum = 0;
  let best = -Infinity;

  for (let right = 0; right < nums.length; right += 1) {
    // Добавляем новый правый элемент в окно.
    sum += nums[right];

    // Если окно стало больше k, убираем элемент, который вышел слева.
    if (right >= k) sum -= nums[right - k];

    // Когда окно достигло размера k, обновляем лучший ответ.
    if (right >= k - 1) best = Math.max(best, sum);
  }

  return best;
}`,
    problems: [
      "Maximum Average Subarray I",
      "Longest Substring Without Repeating Characters",
      "Longest Repeating Character Replacement",
      "Minimum Window Substring",
    ],
  },
  {
    title: "Быстрый и медленный указатели",
    visual: "fast-slow",
    signal: "Нужно найти цикл, середину списка или поведение последовательности с O(1) памяти.",
    approach: "Один указатель двигается на шаг, второй на два; встреча обычно доказывает цикл.",
    complexity: "O(n) по времени и O(1) по памяти.",
    code: `function hasCycle(head) {
  // Пример: 3 -> 2 -> 0 -> -4, где -4 снова указывает на 2.
  // slow делает один шаг, fast делает два шага.
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    // Если цикл есть, быстрый указатель догонит медленный внутри цикла.
    if (slow === fast) return true;
  }

  // Если fast дошёл до конца, цикла нет.
  return false;
}`,
    problems: [
      "Linked List Cycle",
      "Linked List Cycle II",
      "Happy Number",
      "Find the Duplicate Number",
    ],
  },
  {
    title: "Разворот связного списка на месте",
    visual: "reverse",
    signal:
      "Нужно развернуть список, подсписок, пары или группы без дополнительной структуры данных.",
    approach: "Храни previous, current и next; на каждом шаге перенаправляй current.next назад.",
    complexity: "O(n) по времени и O(1) по памяти.",
    code: `function reverseList(head) {
  // Пример: 1 -> 2 -> 3 станет 3 -> 2 -> 1.
  // previous хранит уже развёрнутую часть списка.
  let previous = null;
  let current = head;

  while (current) {
    // Сохраняем следующий узел, иначе потеряем хвост списка.
    const next = current.next;

    // Разворачиваем связь текущего узла назад.
    current.next = previous;

    // Сдвигаем окно из двух указателей на один узел вперёд.
    previous = current;
    current = next;
  }

  // previous теперь указывает на новую голову.
  return previous;
}`,
    problems: [
      "Reverse Linked List",
      "Reverse Linked List II",
      "Swap Nodes in Pairs",
      "Reverse Nodes in k-Group",
    ],
  },
  {
    title: "Монотонный стек",
    visual: "stack",
    signal: "Следующий больший/меньший элемент, границы гистограммы, span или ближайший блокер.",
    approach:
      "Поддерживай значения в стеке упорядоченными; доставай элементы, когда текущий элемент даёт для них ответ.",
    complexity: "O(n) по времени и O(n) по памяти.",
    code: `function nextGreater(nums) {
  // Пример: nums = [2, 1, 2, 4, 3].
  // Для каждого индекса ищем ближайшее число справа, которое больше него.
  const answer = Array(nums.length).fill(-1);
  const stack = []; // храним индексы, для которых ответ ещё не найден

  for (let i = 0; i < nums.length; i += 1) {
    // Текущее число закрывает все меньшие элементы на вершине стека.
    while (stack.length && nums[i] > nums[stack[stack.length - 1]]) {
      const index = stack.pop();
      answer[index] = nums[i];
    }

    // Текущий индекс ждёт свой будущий больший элемент.
    stack.push(i);
  }

  return answer;
}`,
    problems: [
      "Next Greater Element I",
      "Next Greater Element II",
      "Daily Temperatures",
      "Largest Rectangle in Histogram",
    ],
  },
  {
    title: "Top K элементов",
    visual: "top-k",
    signal: "Нужно найти K крупнейших, K наименьших, K частых элементов или рейтинг в потоке.",
    approach:
      "Держи только K кандидатов в куче или сортируй, если вход маленький и важнее простота.",
    complexity: "Куча O(n log k), память O(k). Сортировка O(n log n).",
    code: `function topKBySorting(nums, k) {
  // Пример: nums = [3, 2, 1, 5, 6, 4], k = 2.
  // Для небольших входов сортировка проще и хорошо читается.
  return nums
    .slice() // копируем, чтобы не менять исходный массив
    .sort((a, b) => b - a) // большие элементы идут первыми
    .slice(0, k); // берём ровно k лучших кандидатов
}`,
    problems: [
      "Kth Largest Element in an Array",
      "Top K Frequent Elements",
      "Merge k Sorted Lists",
      "Find K Pairs with Smallest Sums",
    ],
  },
  {
    title: "Пересекающиеся интервалы",
    visual: "intervals",
    signal: "Нужно объединить, вставить, посчитать ресурсы или убрать конфликты между диапазонами.",
    approach: "Отсортируй по началу, затем сравнивай текущий интервал с последним добавленным.",
    complexity: "O(n log n) из-за сортировки, O(n) памяти на результат.",
    code: `function mergeIntervals(intervals) {
  // Пример: [[1,3], [2,6], [8,10]] -> [[1,6], [8,10]].
  // Сортировка гарантирует, что потенциальное пересечение может быть
  // только с последним интервалом в результате.
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [];

  for (const interval of intervals) {
    const last = merged[merged.length - 1];

    // Если результата ещё нет или пересечения нет, начинаем новый интервал.
    if (!last || last[1] < interval[0]) {
      merged.push(interval);
    } else {
      // Иначе расширяем правую границу последнего интервала.
      last[1] = Math.max(last[1], interval[1]);
    }
  }

  return merged;
}`,
    problems: [
      "Merge Intervals",
      "Insert Interval",
      "Non-overlapping Intervals",
      "Single-Threaded CPU",
    ],
  },
  {
    title: "Модифицированный бинарный поиск",
    visual: "binary-search",
    signal:
      "Отсортированные данные, повёрнутый массив, поиск границы или поиск по пространству ответа.",
    approach: "Сведи задачу к условию true/false и сужай диапазон вокруг этой границы.",
    complexity: "O(log n) по времени и O(1) по памяти.",
    code: `function firstTrue(left, right, condition) {
  // Пример: ищем первый индекс, где nums[i] >= target.
  // condition(mid) отвечает: "mid уже достаточно правый?"
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (condition(mid)) {
      // mid подходит, значит ответ может быть mid или левее.
      right = mid;
    } else {
      // mid не подходит, значит ответ строго правее.
      left = mid + 1;
    }
  }

  return left;
}`,
    problems: [
      "Search in Rotated Sorted Array",
      "Find Minimum in Rotated Sorted Array",
      "Find First and Last Position of Element in Sorted Array",
      "Search a 2D Matrix II",
    ],
  },
  {
    title: "Обход бинарного дерева",
    visual: "tree",
    signal: "Нужно посетить все узлы в preorder, inorder, postorder или по уровням.",
    approach: "Выбирай DFS для структурной рекурсии или BFS, когда важны уровни.",
    complexity: "O(n) по времени; память зависит от глубины рекурсии или ширины очереди.",
    code: `function inorder(root, output = []) {
  // Пример BST: [2, 1, 3] при inorder даст [1, 2, 3].
  // Inorder сначала обходит левое поддерево, потом корень, потом правое.
  if (!root) return output;

  inorder(root.left, output);
  output.push(root.val); // здесь "посещаем" текущий узел
  inorder(root.right, output);

  return output;
}`,
    problems: [
      "Binary Tree Level Order Traversal",
      "Maximum Depth of Binary Tree",
      "Construct Binary Tree from Preorder and Inorder Traversal",
      "Binary Tree Maximum Path Sum",
    ],
  },
  {
    title: "Поиск в глубину",
    visual: "dfs",
    signal: "Нужно исследовать пути, компоненты, зависимости или все достижимые состояния.",
    approach:
      "Иди глубоко через рекурсию или стек и отмечай посещённые узлы, чтобы не зациклиться.",
    complexity: "O(V + E) для графов; O(n) для деревьев.",
    code: `function dfs(graph, start, seen = new Set()) {
  // Пример: graph = { A: ["B", "C"], B: ["D"], C: [], D: [] }.
  // DFS сначала уходит как можно глубже по одной ветке.
  if (seen.has(start)) return [];

  seen.add(start); // защищаемся от циклов
  const order = [start]; // фиксируем порядок посещения

  for (const next of graph[start] ?? []) {
    // Рекурсивно добавляем все достижимые вершины из соседа.
    order.push(...dfs(graph, next, seen));
  }

  return order;
}`,
    problems: ["Clone Graph", "Path Sum II", "Course Schedule II", "Number of Islands"],
  },
  {
    title: "Поиск в ширину",
    visual: "bfs",
    signal: "Кратчайший путь в невзвешенном графе или обработка структуры по уровням.",
    approach: "Используй очередь: обработай текущий фронт и добавь следующий.",
    complexity: "O(V + E) для графов; O(n) для деревьев.",
    code: `function bfs(graph, start) {
  // Пример: ищем порядок обхода от вершины A.
  // Queue хранит вершины текущего и следующих уровней.
  const queue = [start];
  const seen = new Set([start]);
  const order = [];

  for (let i = 0; i < queue.length; i += 1) {
    const node = queue[i];
    order.push(node);

    for (const next of graph[node] ?? []) {
      if (!seen.has(next)) {
        seen.add(next); // добавляем один раз, чтобы не ходить по кругу
        queue.push(next); // попадёт в обработку после текущего уровня
      }
    }
  }

  return order;
}`,
    problems: ["Word Ladder", "Rotting Oranges", "Binary Tree Level Order Traversal"],
  },
  {
    title: "Обход матрицы",
    visual: "matrix",
    signal: "2D-сетки, острова, заливка, кратчайший путь или маркировка областей.",
    approach: "Считай клетки узлами графа и ходи по валидным соседям через DFS или BFS.",
    complexity: "O(rows * cols) по времени и памяти в худшем случае.",
    code: `const directions = [
  [1, 0],  // вниз
  [-1, 0], // вверх
  [0, 1],  // вправо
  [0, -1], // влево
];

function neighbors(row, col, grid) {
  // Пример: из клетки (1, 1) проверяем четыре соседние клетки.
  // grid[r]?.[c] защищает от выхода за границы матрицы.
  return directions
    .map(([dr, dc]) => [row + dr, col + dc])
    .filter(([r, c]) => grid[r]?.[c] !== undefined);
}`,
    problems: ["Flood Fill", "Number of Islands", "Surrounded Regions"],
  },
  {
    title: "Бэктрекинг",
    visual: "backtracking",
    signal:
      "Нужно перебрать все валидные выборы, перестановки, комбинации или раскладки с ограничениями.",
    approach: "Сделай выбор, уйди в рекурсию, затем откати выбор перед следующей веткой.",
    complexity: "Часто экспоненциальная; память - глубина рекурсии плюс размер ответа.",
    code: `function subsets(nums) {
  // Пример: nums = [1, 2] -> [], [2], [1], [1, 2].
  // path хранит текущий частичный выбор.
  const result = [];
  const path = [];

  function search(index) {
    if (index === nums.length) {
      result.push([...path]); // копируем, потому что path будет меняться
      return;
    }

    // Ветка 1: не берём nums[index].
    search(index + 1);

    // Ветка 2: берём nums[index], затем откатываем выбор.
    path.push(nums[index]);
    search(index + 1);
    path.pop();
  }

  search(0);
  return result;
}`,
    problems: ["Permutations", "Subsets", "N-Queens"],
  },
  {
    title: "Динамическое программирование",
    visual: "dp",
    signal:
      "Есть пересекающиеся подзадачи: максимум/минимум, количество способов или состояние возможно/невозможно.",
    approach: "Сначала зафиксируй состояние, переход, базовые случаи и порядок обхода.",
    complexity: "Обычно O(количество состояний * стоимость перехода).",
    code: `function climbStairs(n) {
  // Пример: n = 5. На последнюю ступень можно прийти с n-1 или n-2.
  // curr хранит способов для текущей ступени, prev - для предыдущей.
  let prev = 1; // способов добраться до ступени 0
  let curr = 1; // способов добраться до ступени 1

  for (let step = 2; step <= n; step += 1) {
    // Переход: dp[step] = dp[step - 1] + dp[step - 2].
    const next = prev + curr;
    prev = curr;
    curr = next;
  }

  return curr;
}`,
    problems: [
      "Climbing Stairs",
      "House Robber",
      "Coin Change",
      "Longest Common Subsequence",
      "Longest Increasing Subsequence",
      "Partition Equal Subset Sum",
    ],
  },
  {
    title: "Битовые операции",
    visual: "bits",
    signal: "Флаги, чётность, подмножества как маски, XOR-пары или низкоуровневый подсчёт.",
    approach:
      "Используй сдвиги, маски и свойства XOR, чтобы компактно хранить состояние или убирать дубликаты.",
    complexity: "Часто O(n) по времени и O(1) по памяти.",
    code: `function singleNumber(nums) {
  // Пример: [4, 1, 2, 1, 2] -> 4.
  // XOR одинаковых чисел даёт 0, а x ^ 0 снова даёт x.
  let answer = 0;

  for (const num of nums) {
    // Парные значения взаимно уничтожаются.
    answer ^= num;
  }

  return answer;
}`,
    problems: ["Single Number", "Number of 1 Bits", "Counting Bits", "Missing Number"],
  },
];

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compactTitle(value: string) {
  return normalizeTitle(value).replace(/\s+/g, "");
}

function buildProblemLookup(problems: ProblemListItem[]): ProblemLookup {
  const exact = new Map<string, ProblemListItem>();
  const compact = new Map<string, ProblemListItem>();

  for (const problem of problems) {
    for (const key of [problem.title, problem.slug]) {
      exact.set(normalizeTitle(key), problem);
      compact.set(compactTitle(key), problem);
    }
  }

  return { exact, compact };
}

function resolveProblem(title: string, lookup: ProblemLookup) {
  return lookup.exact.get(normalizeTitle(title)) ?? lookup.compact.get(compactTitle(title));
}

function definePatternThemes(monaco: typeof Monaco) {
  monaco.editor.defineTheme("medikcode-pattern-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#171717",
      "editorLineNumber.foreground": "#777777",
      "editorCursor.foreground": "#ffffff",
      "editor.selectionBackground": "#3a3d41",
    },
  });
  monaco.editor.defineTheme("medikcode-pattern-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#f7f7f8",
      "editorLineNumber.foreground": "#8a8a8a",
      "editorCursor.foreground": "#111827",
      "editor.selectionBackground": "#dbeafe",
    },
  });
}

function codeHeight(code: string) {
  const lineCount = code.split("\n").length;
  return Math.min(460, Math.max(190, lineCount * 20 + 22));
}

function PatternCodeBlock({ code, title }: { code: string; title: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[var(--lc-border)] bg-[var(--lc-code)]">
      <Editor
        beforeMount={definePatternThemes}
        defaultLanguage="javascript"
        height={codeHeight(code)}
        options={{
          automaticLayout: true,
          contextmenu: false,
          domReadOnly: true,
          folding: false,
          fontFamily: "JetBrains Mono, Consolas, monospace",
          fontSize: 12,
          lineDecorationsWidth: 8,
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          minimap: { enabled: false },
          overviewRulerLanes: 0,
          readOnly: true,
          renderLineHighlight: "none",
          scrollBeyondLastLine: false,
          scrollbar: {
            horizontal: "auto",
            vertical: "auto",
            verticalScrollbarSize: 8,
          },
          wordWrap: "on",
        }}
        path={`pattern-${title}.js`}
        theme={
          document.documentElement.dataset.theme === "light"
            ? "medikcode-pattern-light"
            : "medikcode-pattern-dark"
        }
        value={code}
      />
    </div>
  );
}

function PatternVisual({ type, title }: { type: PatternVisualType; title: string }) {
  const cells = [0, 1, 2, 3, 4, 5];

  if (type === "tree") {
    return (
      <svg className="h-28 w-full rounded-lg bg-[var(--lc-code)]" role="img" viewBox="0 0 240 112">
        <title>{title}</title>
        <path
          d="M120 28L72 62M120 28l48 34M72 62l-28 28M72 62l28 28M168 62l-28 28M168 62l28 28"
          stroke="var(--lc-border-strong)"
          strokeWidth="3"
        />
        {[120, 72, 168, 44, 100, 140, 196].map((x, index) => (
          <circle
            key={x}
            cx={x}
            cy={index === 0 ? 28 : index < 3 ? 62 : 90}
            fill={index === 0 ? "var(--lc-success)" : "var(--lc-active)"}
            r="13"
            stroke="var(--lc-border-strong)"
          />
        ))}
      </svg>
    );
  }

  if (type === "matrix") {
    return (
      <svg className="h-28 w-full rounded-lg bg-[var(--lc-code)]" role="img" viewBox="0 0 240 112">
        <title>{title}</title>
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 6 }).map((__, col) => (
            <rect
              key={`${row}-${col}`}
              fill={row === 1 && col > 1 && col < 5 ? "var(--lc-success-soft)" : "var(--lc-active)"}
              height="18"
              rx="4"
              stroke="var(--lc-border-strong)"
              width="24"
              x={42 + col * 26}
              y={18 + row * 20}
            />
          )),
        )}
        <path d="M95 47h52M121 25v45" stroke="var(--lc-success)" strokeWidth="3" />
      </svg>
    );
  }

  if (type === "dfs" || type === "bfs" || type === "backtracking") {
    const stroke = type === "bfs" ? "var(--lc-warning)" : "var(--lc-success)";

    return (
      <svg className="h-28 w-full rounded-lg bg-[var(--lc-code)]" role="img" viewBox="0 0 240 112">
        <title>{title}</title>
        <path
          d="M54 56h50l38-28h44M104 56l38 28h44"
          stroke="var(--lc-border-strong)"
          strokeWidth="3"
        />
        <path
          d={type === "bfs" ? "M54 56h50M142 28h44M142 84h44" : "M54 56h50l38-28h44"}
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeWidth="5"
        />
        {[54, 104, 142, 186, 142, 186].map((x, index) => (
          <circle
            key={`${x}-${index}`}
            cx={x}
            cy={index < 2 ? 56 : index < 4 ? 28 : 84}
            fill="var(--lc-active)"
            r="12"
            stroke="var(--lc-border-strong)"
          />
        ))}
        {type === "backtracking" ? (
          <path d="M186 28l-20 20M166 28l20 20" stroke="var(--lc-danger-strong)" strokeWidth="3" />
        ) : null}
      </svg>
    );
  }

  if (type === "dp") {
    return (
      <svg className="h-28 w-full rounded-lg bg-[var(--lc-code)]" role="img" viewBox="0 0 240 112">
        <title>{title}</title>
        {cells.map((cell) => (
          <rect
            key={cell}
            fill={cell < 4 ? "var(--lc-success-soft)" : "var(--lc-active)"}
            height="30"
            rx="5"
            stroke="var(--lc-border-strong)"
            width="28"
            x={35 + cell * 31}
            y="42"
          />
        ))}
        <path
          d="M50 36c24-20 52-20 76 0M84 78c24 20 52 20 76 0"
          fill="none"
          stroke="var(--lc-success)"
          strokeWidth="3"
        />
      </svg>
    );
  }

  if (type === "bits") {
    return (
      <svg className="h-28 w-full rounded-lg bg-[var(--lc-code)]" role="img" viewBox="0 0 240 112">
        <title>{title}</title>
        {["1", "0", "1", "1", "0", "0", "1"].map((bit, index) => (
          <text
            key={`${bit}-${index}`}
            fill={index % 2 === 0 ? "var(--lc-success)" : "var(--lc-muted)"}
            fontFamily="monospace"
            fontSize="24"
            x={42 + index * 23}
            y="60"
          >
            {bit}
          </text>
        ))}
        <path d="M62 76h110" stroke="var(--lc-border-strong)" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg className="h-28 w-full rounded-lg bg-[var(--lc-code)]" role="img" viewBox="0 0 240 112">
      <title>{title}</title>
      {cells.map((cell) => (
        <rect
          key={cell}
          fill={
            (type === "window" && cell >= 1 && cell <= 3) ||
            (type === "prefix" && cell <= 3) ||
            (type === "binary-search" && cell >= 2 && cell <= 4)
              ? "var(--lc-success-soft)"
              : "var(--lc-active)"
          }
          height="28"
          rx="5"
          stroke="var(--lc-border-strong)"
          width="28"
          x={31 + cell * 31}
          y="42"
        />
      ))}
      {type === "pointers" ? (
        <>
          <path d="M45 34v-14M45 20h147M192 20v14" stroke="var(--lc-success)" strokeWidth="3" />
          <text fill="var(--lc-muted)" fontSize="11" x="37" y="91">
            L
          </text>
          <text fill="var(--lc-muted)" fontSize="11" x="185" y="91">
            R
          </text>
        </>
      ) : null}
      {type === "window" ? (
        <rect
          fill="none"
          height="40"
          rx="7"
          stroke="var(--lc-success)"
          strokeWidth="3"
          width="95"
          x="58"
          y="36"
        />
      ) : null}
      {type === "fast-slow" ? (
        <>
          <path d="M45 78h52" stroke="var(--lc-success)" strokeWidth="3" />
          <path d="M45 30h114" stroke="var(--lc-warning)" strokeWidth="3" />
          <text fill="var(--lc-muted)" fontSize="11" x="64" y="94">
            slow
          </text>
          <text fill="var(--lc-muted)" fontSize="11" x="92" y="24">
            fast
          </text>
        </>
      ) : null}
      {type === "reverse" ? (
        <>
          <path d="M178 32L70 32" stroke="var(--lc-success)" strokeWidth="3" />
          <path d="M70 32l11-7M70 32l11 7" stroke="var(--lc-success)" strokeWidth="3" />
        </>
      ) : null}
      {type === "stack" ? (
        <>
          {[0, 1, 2, 3].map((level) => (
            <rect
              key={level}
              fill={level < 3 ? "var(--lc-success-soft)" : "var(--lc-active)"}
              height="15"
              rx="3"
              stroke="var(--lc-border-strong)"
              width="58"
              x="91"
              y={72 - level * 16}
            />
          ))}
        </>
      ) : null}
      {type === "top-k" ? (
        <path
          d="M64 78l56-58 56 58z"
          fill="var(--lc-success-soft)"
          stroke="var(--lc-success)"
          strokeWidth="3"
        />
      ) : null}
      {type === "intervals" ? (
        <>
          <rect fill="var(--lc-success-soft)" height="10" rx="5" width="76" x="48" y="32" />
          <rect fill="var(--lc-success-soft)" height="10" rx="5" width="86" x="96" y="52" />
          <rect fill="var(--lc-active)" height="10" rx="5" width="48" x="154" y="72" />
        </>
      ) : null}
      {type === "binary-search" ? (
        <>
          <path d="M76 28h82" stroke="var(--lc-success)" strokeWidth="3" />
          <path d="M117 27v54" stroke="var(--lc-warning)" strokeWidth="3" />
        </>
      ) : null}
      {type === "prefix" ? (
        <path d="M45 80h115" stroke="var(--lc-success)" strokeWidth="4" />
      ) : null}
    </svg>
  );
}

function ProblemLink({
  title,
  problem,
  onSelectProblem,
}: {
  title: string;
  problem?: ProblemListItem;
  onSelectProblem: (problemId: string) => void;
}) {
  if (!problem) {
    return (
      <span className="rounded-md border border-dashed border-[var(--lc-border)] px-2 py-1 text-xs text-[var(--lc-subtle)]">
        {title}
      </span>
    );
  }

  return (
    <Button
      className="max-w-full justify-start border-[var(--lc-border)] bg-[var(--lc-panel)] px-2 py-1 text-left text-xs text-[var(--lc-text-strong)]"
      size="xs"
      title={`Открыть задачу ${problem.title}`}
      variant="outline"
      onClick={() => onSelectProblem(problem.id)}
    >
      <span className="truncate">{problem.title}</span>
      <DifficultyBadge difficulty={problem.difficulty} />
    </Button>
  );
}

export function PatternGuide({
  problems,
  onSelectProblem,
}: {
  problems: ProblemListItem[];
  onSelectProblem: (problemId: string) => void;
}) {
  const lookup = useMemo(() => buildProblemLookup(problems), [problems]);

  return (
    <div className="space-y-4">
      <header className="rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel-raised)] p-4">
        <div className="mb-2 text-lg font-semibold text-[var(--lc-text-strong)]">
          Гайд MedikCode по паттернам
        </div>
        <p className="mb-3 text-sm leading-6 text-[var(--lc-muted)]">
          Короткая локальная шпаргалка для выбора подхода перед кодом. Чипы задач открывают
          подходящие задачи из встроенного набора, собранного из merged_problems.json.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border border-[var(--lc-border)] px-2 py-1 text-[var(--lc-muted)]">
            16 паттернов
          </span>
          <span className="rounded-md border border-[var(--lc-border)] px-2 py-1 text-[var(--lc-muted)]">
            60 задач для практики
          </span>
        </div>
      </header>

      {patterns.map((pattern) => (
        <article
          key={pattern.title}
          className="rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel-raised)] p-4"
        >
          <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)]">
            <PatternVisual title={pattern.title} type={pattern.visual} />

            <div className="min-w-0">
              <h2 className="mb-2 text-base font-semibold text-[var(--lc-text-strong)]">
                {pattern.title}
              </h2>
              <dl className="grid gap-2 text-sm leading-6">
                <div>
                  <dt className="font-semibold text-[var(--lc-text-strong)]">Когда применять</dt>
                  <dd className="text-[var(--lc-muted)]">{pattern.signal}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--lc-text-strong)]">Подход</dt>
                  <dd className="text-[var(--lc-muted)]">{pattern.approach}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--lc-text-strong)]">Сложность</dt>
                  <dd className="text-[var(--lc-muted)]">{pattern.complexity}</dd>
                </div>
              </dl>
            </div>
          </div>

          <PatternCodeBlock code={pattern.code} title={pattern.title} />

          <div className="mt-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--lc-muted)]">
              Практика
            </div>
            <div className={cn("flex flex-wrap gap-2", pattern.problems.length === 0 && "hidden")}>
              {pattern.problems.map((title) => (
                <ProblemLink
                  key={title}
                  problem={resolveProblem(title, lookup)}
                  title={title}
                  onSelectProblem={onSelectProblem}
                />
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
