import { useMemo } from "react";
import type { ProblemListItem } from "@/entities/problem/model/types";
import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
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
  const prefix = [0];

  for (const num of nums) {
    prefix.push(prefix[prefix.length - 1] + num);
  }

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
  let left = 0;
  let right = nums.length - 1;

  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left += 1;
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
  let sum = 0;
  let best = -Infinity;

  for (let right = 0; right < nums.length; right += 1) {
    sum += nums[right];
    if (right >= k) sum -= nums[right - k];
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
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }

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
  let previous = null;
  let current = head;

  while (current) {
    const next = current.next;
    current.next = previous;
    previous = current;
    current = next;
  }

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
  const answer = Array(nums.length).fill(-1);
  const stack = [];

  for (let i = 0; i < nums.length; i += 1) {
    while (stack.length && nums[i] > nums[stack[stack.length - 1]]) {
      answer[stack.pop()] = nums[i];
    }
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
  return nums
    .slice()
    .sort((a, b) => b - a)
    .slice(0, k);
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
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [];

  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (!last || last[1] < interval[0]) merged.push(interval);
    else last[1] = Math.max(last[1], interval[1]);
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
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (condition(mid)) right = mid;
    else left = mid + 1;
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
  if (!root) return output;

  inorder(root.left, output);
  output.push(root.val);
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
  if (seen.has(start)) return [];
  seen.add(start);

  const order = [start];
  for (const next of graph[start] ?? []) {
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
  const queue = [start];
  const seen = new Set([start]);
  const order = [];

  for (let i = 0; i < queue.length; i += 1) {
    const node = queue[i];
    order.push(node);
    for (const next of graph[node] ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
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
    code: `const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function neighbors(row, col, grid) {
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
    complexity: "Часто экспоненциальная; память — глубина рекурсии плюс размер ответа.",
    code: `function subsets(nums) {
  const result = [];
  const path = [];

  function search(index) {
    if (index === nums.length) {
      result.push([...path]);
      return;
    }

    search(index + 1);
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
  let prev = 1;
  let curr = 1;

  for (let step = 2; step <= n; step += 1) {
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
  let answer = 0;

  for (const num of nums) {
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
    <button
      className="inline-flex max-w-full items-center gap-2 rounded-md border border-[var(--lc-border)] bg-[var(--lc-panel)] px-2 py-1 text-left text-xs text-[var(--lc-text-strong)] transition-colors hover:bg-[var(--lc-hover)]"
      title={`Открыть задачу ${problem.title}`}
      type="button"
      onClick={() => onSelectProblem(problem.id)}
    >
      <span className="truncate">{problem.title}</span>
      <DifficultyBadge difficulty={problem.difficulty} />
    </button>
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

          <pre className="mt-4 overflow-auto rounded-lg border border-[var(--lc-border)] bg-[var(--lc-code)] p-3 text-xs leading-5 text-[var(--lc-text-strong)]">
            <code>{pattern.code}</code>
          </pre>

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
