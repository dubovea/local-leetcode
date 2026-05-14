import Editor from "@monaco-editor/react";
import { useMemo } from "react";
import type * as Monaco from "monaco-editor";
import type { ProblemListItem } from "@/entities/problem/model/types";
import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

type PatternVisualType =
  | "window"
  | "pointers"
  | "fast-slow"
  | "intervals"
  | "cyclic"
  | "reverse"
  | "tree-bfs"
  | "tree-dfs"
  | "two-heaps"
  | "subsets"
  | "binary-search"
  | "top-k"
  | "k-way"
  | "topological";

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

const articlePatternDetails: Record<
  string,
  {
    original: string;
    details: string[];
  }
> = {
  "Скользящее окно": {
    original: "Sliding Window",
    details: [
      "Главная идея: не пересчитывать подмассив или подстроку заново, а поддерживать состояние текущего окна.",
      "Размер окна может быть фиксированным или динамическим: в динамическом варианте окно расширяется и сжимается по условию.",
      "На интервью сначала проговори, что именно хранит окно: сумму, частоты, количество ошибок, уникальные символы или текущую длину.",
    ],
  },
  "Два указателя": {
    original: "Two Pointers or Iterators",
    details: [
      "Паттерн заменяет вложенный перебор пар одним проходом, когда порядок данных помогает выбрать движение указателей.",
      "Чаще всего указатели сходятся с двух концов, но иногда один указатель читает данные, а второй пишет результат.",
      "Перед кодом полезно явно сказать, почему движение одного указателя не пропускает оптимальный ответ.",
    ],
  },
  "Быстрый и медленный указатели": {
    original: "Fast and Slow Pointers or Iterators",
    details: [
      "Это тот самый hare and tortoise: два бегуна по одной структуре, но с разной скоростью.",
      "Если есть цикл, быстрый указатель неизбежно догонит медленный; если цикла нет, он дойдет до конца.",
      "При поиске середины списка slow обычно указывает на середину ровно тогда, когда fast дошел до хвоста.",
    ],
  },
  "Слияние интервалов": {
    original: "Merge Intervals",
    details: [
      "Паттерн появляется в задачах про расписания, встречи, бронирования, занятость ресурсов и пересекающиеся диапазоны.",
      "Сортировка по началу превращает хаос интервалов в один линейный проход.",
      "Самая частая ошибка: неверно обработать касание границ, когда [1, 3] и [3, 5] считаются пересекающимися или нет по условию.",
    ],
  },
  "Циклическая сортировка": {
    original: "Cyclic Sort",
    details: [
      "Работает, когда значения сами подсказывают, на каком индексе должны стоять.",
      "Вместо полноценной сортировки мы отправляем каждое число на его место, пока это возможно и безопасно.",
      "Обязательно проверяй границы и дубликаты, иначе swap может уйти в бесконечный цикл.",
    ],
  },
  "Разворот связного списка на месте": {
    original: "In-place Reversal of a Linked List",
    details: [
      "Задачи этого типа проверяют, умеешь ли ты безопасно менять ссылки без потери хвоста списка.",
      "Минимальный набор переменных: previous, current и next; порядок присваиваний здесь важнее всего.",
      "Для разворота подсписка или групп по k сначала отдели границы, затем применяй тот же маленький разворот.",
    ],
  },
  "Обход дерева в ширину": {
    original: "Tree BFS",
    details: [
      "BFS естественно группирует узлы по расстоянию от корня, поэтому подходит для задач по уровням.",
      "Очередь хранит фронт обхода, а фиксированный levelSize не дает смешать соседние уровни.",
      "Если задача спрашивает ближайший узел или минимальную глубину, BFS часто завершает поиск раньше DFS.",
    ],
  },
  "Обход дерева в глубину": {
    original: "Tree DFS",
    details: [
      "DFS удобен, когда ответ живет в пути, поддереве или вычисляется снизу вверх.",
      "Выбор preorder, inorder или postorder зависит от момента, когда нужны данные текущего узла.",
      "Если передаешь mutable path, не забывай откатывать изменения после рекурсивного вызова.",
    ],
  },
  "Две кучи": {
    original: "Two Heaps",
    details: [
      "Паттерн делит поток данных на две половины: меньшую и большую.",
      "Max-heap хранит левую половину, min-heap правую; вершины дают быстрый доступ к середине.",
      "После каждой вставки нужно балансировать размеры, иначе медиана начнет считаться из неверной половины.",
    ],
  },
  "Подмножества": {
    original: "Subsets",
    details: [
      "Это паттерн полного перебора пространства решений: включить или не включить, выбрать следующий символ, поменять порядок.",
      "Код обычно строится вокруг path и result, где path изменяется на месте и откатывается назад.",
      "Дубликаты требуют отдельного правила: сортировка плюс пропуск одинаковых кандидатов на одном уровне дерева решений.",
    ],
  },
  "Модифицированный бинарный поиск": {
    original: "Modified Binary Search",
    details: [
      "Смысл не только в отсортированном массиве, а в монотонном признаке: левее false, правее true или наоборот.",
      "Повернутый массив, поиск границы, минимум, пик и ответ по диапазону сводятся к одному шаблону с разными условиями.",
      "Самая важная часть решения - четко определить, какая половина точно больше не нужна.",
    ],
  },
  "Top K элементов": {
    original: "Top K Elements",
    details: [
      "Если нужен только небольшой набор лучших элементов, полная сортировка часто избыточна.",
      "Min-heap размера k хранит текущих победителей и быстро выбрасывает слабейшего кандидата.",
      "Если k близко к n или вход маленький, сортировка может быть проще и достаточно хороша.",
    ],
  },
  "K-way merge": {
    original: "K-way Merge",
    details: [
      "Паттерн объединяет несколько уже отсортированных источников без полной пересортировки всех элементов.",
      "В куче лежит только текущий кандидат из каждого списка, поэтому память зависит от количества списков.",
      "Каждый извлеченный элемент сам подсказывает, из какого источника нужно взять следующий.",
    ],
  },
  "Топологическая сортировка": {
    original: "Topological Sort",
    details: [
      "Используется для направленных графов зависимостей: сначала должны идти элементы без незакрытых prerequisites.",
      "Kahn's algorithm через indegree удобен, когда нужно получить порядок или обнаружить цикл.",
      "Если после обработки очереди посещены не все вершины, значит в зависимостях есть цикл.",
    ],
  },
};

const patterns: Pattern[] = [
  {
    title: "Скользящее окно",
    visual: "window",
    signal:
      "В условии есть непрерывный подмассив или подстрока, а ответ зависит от суммы, частот, длины или валидности текущего отрезка.",
    approach:
      "Двигай правую границу окна, добавляй новый элемент в состояние, а левую границу сдвигай только тогда, когда окно стало слишком большим или нарушило правило.",
    complexity: "Обычно O(n) по времени и O(1) или O(k) по памяти, потому что обе границы идут только вперед.",
    code: `function longestUniqueSubstring(text) {
  // Ищем самую длинную подстроку без повторяющихся символов.
  // left - начало текущего окна, seen хранит последнюю позицию каждого символа.
  const seen = new Map();
  let left = 0;
  let best = 0;

  for (let right = 0; right < text.length; right += 1) {
    const char = text[right];

    // Если символ уже внутри окна, двигаем левую границу за прошлое вхождение.
    if (seen.has(char) && seen.get(char) >= left) {
      left = seen.get(char) + 1;
    }

    seen.set(char, right);
    best = Math.max(best, right - left + 1);
  }

  return best;
}`,
    problems: [
      "Maximum Average Subarray I",
      "Longest Substring Without Repeating Characters",
      "Permutation in String",
      "Minimum Window Substring",
    ],
  },
  {
    title: "Два указателя",
    visual: "pointers",
    signal:
      "Данные отсортированы, нужно найти пару, удалить дубликаты, проверить палиндром или сравнивать элементы с двух сторон.",
    approach:
      "Поставь указатели на разные концы или на две позиции одного массива. На каждом шаге двигай тот указатель, который приближает состояние к цели.",
    complexity: "Чаще всего O(n) по времени и O(1) по памяти.",
    code: `function twoSumSorted(numbers, target) {
  // Массив уже отсортирован, поэтому сумма управляет движением указателей.
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];

    if (sum === target) return [left, right];

    // Сумма мала - нужен элемент больше, двигаем left.
    if (sum < target) left += 1;
    // Сумма велика - нужен элемент меньше, двигаем right.
    else right -= 1;
  }

  return [-1, -1];
}`,
    problems: [
      "Two Sum II - Input Array Is Sorted",
      "3Sum",
      "Container With Most Water",
      "Squares of a Sorted Array",
      "Valid Palindrome",
    ],
  },
  {
    title: "Быстрый и медленный указатели",
    visual: "fast-slow",
    signal:
      "Нужно найти цикл, середину списка, точку входа в цикл или повторяющееся значение при ограниченной памяти.",
    approach:
      "Один указатель идет на один шаг, второй на два. Если структура циклическая, они встретятся; если нет, быстрый дойдет до конца.",
    complexity: "O(n) по времени и O(1) по памяти.",
    code: `function hasCycle(head) {
  // Floyd cycle detection: slow идет по одному узлу, fast - по два.
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
      "Happy Number",
      "Middle of the Linked List",
      "Find the Duplicate Number",
    ],
  },
  {
    title: "Слияние интервалов",
    visual: "intervals",
    signal:
      "В задаче есть промежутки времени, диапазоны, бронирования, пересечения или необходимость объединить конфликтующие отрезки.",
    approach:
      "Отсортируй интервалы по началу. Затем храни последний добавленный интервал и либо расширяй его, либо начинай новый.",
    complexity: "O(n log n) из-за сортировки и O(n) памяти на результат.",
    code: `function mergeIntervals(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [];

  for (const interval of intervals) {
    const last = merged[merged.length - 1];

    if (!last || last[1] < interval[0]) {
      merged.push([...interval]);
    } else {
      last[1] = Math.max(last[1], interval[1]);
    }
  }

  return merged;
}`,
    problems: [
      "Merge Intervals",
      "Insert Interval",
      "Interval List Intersections",
      "Non-overlapping Intervals",
    ],
  },
  {
    title: "Циклическая сортировка",
    visual: "cyclic",
    signal:
      "Массив содержит числа из небольшого диапазона, часто от 1 до n, и нужно найти пропуск, дубликат или первое отсутствующее положительное число.",
    approach:
      "Пока значение можно поставить на его естественный индекс, меняй элементы местами. После этого один проход покажет, где число не на своей позиции.",
    complexity: "O(n) по времени и O(1) по памяти, потому что каждый swap ставит хотя бы одно число на место.",
    code: `function findMissingNumber(nums) {
  // nums содержит числа от 0 до n, одно число пропущено.
  let i = 0;

  while (i < nums.length) {
    const correctIndex = nums[i];

    if (nums[i] < nums.length && nums[i] !== nums[correctIndex]) {
      [nums[i], nums[correctIndex]] = [nums[correctIndex], nums[i]];
    } else {
      i += 1;
    }
  }

  for (let index = 0; index < nums.length; index += 1) {
    if (nums[index] !== index) return index;
  }

  return nums.length;
}`,
    problems: [
      "Missing Number",
      "Find All Numbers Disappeared in an Array",
      "Find the Duplicate Number",
      "First Missing Positive",
    ],
  },
  {
    title: "Разворот связного списка на месте",
    visual: "reverse",
    signal:
      "Нужно развернуть весь список, часть списка, пары, группы по k или переставить ссылки без дополнительной структуры.",
    approach:
      "Храни previous, current и next. На каждом шаге перенаправляй current.next назад, затем сдвигай все три ссылки вперед.",
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
    title: "Обход дерева в ширину",
    visual: "tree-bfs",
    signal:
      "Нужно обработать дерево по уровням: level order, среднее на уровне, минимальная глубина или ближайший подходящий узел.",
    approach:
      "Используй очередь. На каждой итерации фиксируй текущий размер очереди, чтобы отделить один уровень от следующего.",
    complexity: "O(n) по времени и O(w) по памяти, где w - максимальная ширина дерева.",
    code: `function levelOrder(root) {
  if (!root) return [];

  const result = [];
  const queue = [root];
  let head = 0;

  while (head < queue.length) {
    const levelSize = queue.length - head;
    const level = [];

    for (let i = 0; i < levelSize; i += 1) {
      const node = queue[head];
      head += 1;
      level.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(level);
  }

  return result;
}`,
    problems: [
      "Binary Tree Level Order Traversal",
      "Binary Tree Zigzag Level Order Traversal",
      "Minimum Depth of Binary Tree",
      "Average of Levels in Binary Tree",
    ],
  },
  {
    title: "Обход дерева в глубину",
    visual: "tree-dfs",
    signal:
      "Нужно пройти путь от корня к листу, собрать суммы путей, проверить свойство поддерева или вычислить ответ снизу вверх.",
    approach:
      "Выбери preorder, inorder или postorder под задачу. В рекурсию передавай текущее состояние пути, а при выходе откатывай изменения.",
    complexity: "O(n) по времени и O(h) по стеку рекурсии, где h - высота дерева.",
    code: `function hasPathSum(root, targetSum) {
  if (!root) return false;

  const rest = targetSum - root.val;

  if (!root.left && !root.right) {
    return rest === 0;
  }

  return hasPathSum(root.left, rest) || hasPathSum(root.right, rest);
}`,
    problems: ["Path Sum", "Path Sum II", "Diameter of Binary Tree", "Binary Tree Maximum Path Sum"],
  },
  {
    title: "Две кучи",
    visual: "two-heaps",
    signal:
      "Нужно быстро получать медиану, балансировать две половины данных или поддерживать поток чисел в отсортированном виде.",
    approach:
      "Держи меньшую половину в max-heap, большую в min-heap. После каждой вставки балансируй размеры, чтобы медиана была на вершине.",
    complexity: "Вставка O(log n), чтение медианы O(1), память O(n).",
    code: `class Heap {
  constructor(compare) {
    this.data = [];
    this.compare = compare;
  }

  peek() {
    return this.data[0];
  }

  push(value) {
    this.data.push(value);
    this.bubbleUp(this.data.length - 1);
  }

  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (!this.compare(this.data[index], this.data[parent])) break;
      [this.data[index], this.data[parent]] = [this.data[parent], this.data[index]];
      index = parent;
    }
  }

  bubbleDown(index) {
    while (true) {
      let best = index;
      const left = index * 2 + 1;
      const right = index * 2 + 2;

      if (left < this.data.length && this.compare(this.data[left], this.data[best])) best = left;
      if (right < this.data.length && this.compare(this.data[right], this.data[best])) best = right;
      if (best === index) break;

      [this.data[index], this.data[best]] = [this.data[best], this.data[index]];
      index = best;
    }
  }
}

class MedianFinder {
  constructor() {
    this.small = new Heap((a, b) => a > b); // max-heap
    this.large = new Heap((a, b) => a < b); // min-heap
  }

  addNum(num) {
    if (this.small.peek() === undefined || num <= this.small.peek()) this.small.push(num);
    else this.large.push(num);

    if (this.small.data.length > this.large.data.length + 1) this.large.push(this.small.pop());
    if (this.large.data.length > this.small.data.length) this.small.push(this.large.pop());
  }

  findMedian() {
    if (this.small.data.length === this.large.data.length) {
      return (this.small.peek() + this.large.peek()) / 2;
    }

    return this.small.peek();
  }
}`,
    problems: ["Find Median from Data Stream", "Sliding Window Median", "IPO"],
  },
  {
    title: "Подмножества",
    visual: "subsets",
    signal:
      "Нужно сгенерировать все комбинации, перестановки, варианты регистра, скобочные последовательности или все возможные решения.",
    approach:
      "Строй дерево решений. На каждом шаге добавляй один выбор в path, рекурсивно продолжай, затем откатывай выбор.",
    complexity:
      "Обычно O(2^n) или O(n!) по времени, потому что нужно явно построить все варианты; память зависит от размера ответа.",
    code: `function subsets(nums) {
  const result = [];
  const path = [];

  function backtrack(index) {
    if (index === nums.length) {
      result.push([...path]);
      return;
    }

    backtrack(index + 1);

    path.push(nums[index]);
    backtrack(index + 1);
    path.pop();
  }

  backtrack(0);
  return result;
}`,
    problems: ["Subsets", "Subsets II", "Permutations", "Letter Case Permutation", "Generate Parentheses"],
  },
  {
    title: "Модифицированный бинарный поиск",
    visual: "binary-search",
    signal:
      "Данные отсортированы, почти отсортированы, повернуты, бесконечны или ответ можно искать как границу между false и true.",
    approach:
      "Сформулируй условие, которое монотонно меняется. Затем сужай диапазон, сохраняя сторону, где может лежать ответ.",
    complexity: "O(log n) по времени и O(1) по памяти.",
    code: `function firstGreaterOrEqual(nums, target) {
  let left = 0;
  let right = nums.length;

  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] >= target) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }

  return left;
}`,
    problems: [
      "Binary Search",
      "Search in Rotated Sorted Array",
      "Find Minimum in Rotated Sorted Array",
      "Search a 2D Matrix",
    ],
  },
  {
    title: "Top K элементов",
    visual: "top-k",
    signal:
      "Нужно найти k самых больших, маленьких, частых или близких элементов, а весь отсортированный список не нужен.",
    approach:
      "Держи в куче только k лучших кандидатов. Если новый элемент лучше худшего в куче, замени его.",
    complexity: "O(n log k) по времени и O(k) по памяти.",
    code: `function topKFrequent(nums, k) {
  const frequency = new Map();

  for (const num of nums) {
    frequency.set(num, (frequency.get(num) ?? 0) + 1);
  }

  // Для простоты примера сортируем пары. В больших входах вместо этого держат min-heap размера k.
  return [...frequency.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, k)
    .map(([num]) => num);
}`,
    problems: [
      "Kth Largest Element in an Array",
      "Top K Frequent Elements",
      "K Closest Points to Origin",
      "Reorganize String",
    ],
  },
  {
    title: "K-way merge",
    visual: "k-way",
    signal:
      "Есть несколько отсортированных массивов, списков или потоков, и нужно слить их, найти k-й элемент или минимальный диапазон.",
    approach:
      "Положи первый элемент каждого источника в min-heap. Каждый раз доставай минимум и добавляй следующий элемент из того же источника.",
    complexity: "O(n log k) по времени и O(k) по памяти, где k - число источников.",
    code: `function mergeSortedArrays(arrays) {
  const heap = [];
  const result = [];

  const higher = (a, b) => a.value < b.value;

  function push(item) {
    heap.push(item);
    let index = heap.length - 1;

    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (!higher(heap[index], heap[parent])) break;
      [heap[index], heap[parent]] = [heap[parent], heap[index]];
      index = parent;
    }
  }

  function pop() {
    const top = heap[0];
    const last = heap.pop();

    if (heap.length > 0) {
      heap[0] = last;
      let index = 0;

      while (true) {
        let best = index;
        const left = index * 2 + 1;
        const right = index * 2 + 2;

        if (left < heap.length && higher(heap[left], heap[best])) best = left;
        if (right < heap.length && higher(heap[right], heap[best])) best = right;
        if (best === index) break;

        [heap[index], heap[best]] = [heap[best], heap[index]];
        index = best;
      }
    }

    return top;
  }

  for (let list = 0; list < arrays.length; list += 1) {
    if (arrays[list].length > 0) {
      push({ value: arrays[list][0], list, index: 0 });
    }
  }

  while (heap.length > 0) {
    const item = pop();
    result.push(item.value);

    const nextIndex = item.index + 1;
    if (nextIndex < arrays[item.list].length) {
      push({
        value: arrays[item.list][nextIndex],
        list: item.list,
        index: nextIndex,
      });
    }
  }

  return result;
}`,
    problems: [
      "Merge k Sorted Lists",
      "Find K Pairs with Smallest Sums",
      "Kth Smallest Element in a Sorted Matrix",
      "Smallest Range Covering Elements from K Lists",
    ],
  },
  {
    title: "Топологическая сортировка",
    visual: "topological",
    signal:
      "Есть зависимости: курсы, задачи, сборка модулей, порядок букв или проверка, можно ли выполнить все элементы без циклов.",
    approach:
      "Построй граф зависимостей и indegree. В очередь положи вершины без входящих ребер, затем постепенно снимай зависимости.",
    complexity: "O(V + E) по времени и O(V + E) по памяти.",
    code: `function canFinishCourses(courseCount, prerequisites) {
  const graph = Array.from({ length: courseCount }, () => []);
  const indegree = Array(courseCount).fill(0);

  for (const [course, dependency] of prerequisites) {
    graph[dependency].push(course);
    indegree[course] += 1;
  }

  const queue = [];
  for (let course = 0; course < courseCount; course += 1) {
    if (indegree[course] === 0) queue.push(course);
  }

  let visited = 0;
  for (let head = 0; head < queue.length; head += 1) {
    const course = queue[head];
    visited += 1;

    for (const next of graph[course]) {
      indegree[next] -= 1;
      if (indegree[next] === 0) queue.push(next);
    }
  }

  return visited === courseCount;
}`,
    problems: ["Course Schedule", "Course Schedule II", "Minimum Height Trees"],
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
  const animatedCell = (
    <circle fill="var(--lc-success)" r="5">
      <animate attributeName="opacity" dur="1.6s" repeatCount="indefinite" values="0.25;1;0.25" />
    </circle>
  );

  if (type === "tree-bfs" || type === "tree-dfs") {
    const path = type === "tree-bfs" ? "M64 56h112M86 84h68" : "M120 24L80 56L56 84";

    return (
      <svg className="h-28 w-full rounded-lg bg-[var(--lc-code)]" role="img" viewBox="0 0 240 112">
        <title>{title}</title>
        <path
          d="M120 24L80 56M120 24l40 32M80 56L56 84M80 56l28 28M160 56l-28 28M160 56l28 28"
          stroke="var(--lc-border-strong)"
          strokeWidth="3"
        />
        <path d={path} fill="none" stroke="var(--lc-success)" strokeLinecap="round" strokeWidth="5" />
        {[120, 80, 160, 56, 108, 132, 188].map((x, index) => (
          <circle
            key={`${x}-${index}`}
            cx={x}
            cy={index === 0 ? 24 : index < 3 ? 56 : 84}
            fill={index === 0 ? "var(--lc-success-soft)" : "var(--lc-active)"}
            r="12"
            stroke="var(--lc-border-strong)"
          />
        ))}
      </svg>
    );
  }

  if (type === "two-heaps") {
    return (
      <svg className="h-28 w-full rounded-lg bg-[var(--lc-code)]" role="img" viewBox="0 0 240 112">
        <title>{title}</title>
        <path
          d="M76 32L48 64M76 32l28 32M164 32l-28 32M164 32l28 32"
          stroke="var(--lc-border-strong)"
          strokeWidth="3"
        />
        {[76, 48, 104, 164, 136, 192].map((x, index) => (
          <circle
            key={`${x}-${index}`}
            cx={x}
            cy={index === 0 || index === 3 ? 32 : 64}
            fill={index < 3 ? "var(--lc-success-soft)" : "var(--lc-active)"}
            r="13"
            stroke="var(--lc-border-strong)"
          />
        ))}
        <path d="M114 48h12" stroke="var(--lc-warning)" strokeLinecap="round" strokeWidth="4" />
      </svg>
    );
  }

  if (type === "subsets") {
    return (
      <svg className="h-28 w-full rounded-lg bg-[var(--lc-code)]" role="img" viewBox="0 0 240 112">
        <title>{title}</title>
        <path
          d="M120 20L78 50M120 20l42 30M78 50L52 82M78 50l26 32M162 50l-26 32M162 50l26 32"
          stroke="var(--lc-border-strong)"
          strokeWidth="3"
        />
        {[120, 78, 162, 52, 104, 136, 188].map((x, index) => (
          <rect
            key={`${x}-${index}`}
            fill={index % 2 === 0 ? "var(--lc-success-soft)" : "var(--lc-active)"}
            height="20"
            rx="5"
            stroke="var(--lc-border-strong)"
            width="28"
            x={x - 14}
            y={index === 0 ? 10 : index < 3 ? 40 : 72}
          />
        ))}
      </svg>
    );
  }

  if (type === "k-way" || type === "topological") {
    return (
      <svg className="h-28 w-full rounded-lg bg-[var(--lc-code)]" role="img" viewBox="0 0 240 112">
        <title>{title}</title>
        {type === "k-way" ? (
          <>
            {[24, 52, 80].map((y, row) =>
              [0, 1, 2].map((col) => (
                <rect
                  key={`${row}-${col}`}
                  fill={col === 0 ? "var(--lc-success-soft)" : "var(--lc-active)"}
                  height="16"
                  rx="4"
                  stroke="var(--lc-border-strong)"
                  width="24"
                  x={42 + col * 28}
                  y={y}
                />
              )),
            )}
            <path d="M132 32h54M132 60h54M132 88h54" stroke="var(--lc-success)" strokeWidth="3" />
          </>
        ) : (
          <>
            <path
              d="M46 56h52M98 56l42-30M98 56l42 30M140 26h54M140 86h54"
              fill="none"
              stroke="var(--lc-border-strong)"
              strokeWidth="3"
            />
            {[46, 98, 140, 194, 140, 194].map((x, index) => (
              <circle
                key={`${x}-${index}`}
                cx={x}
                cy={index < 2 ? 56 : index < 4 ? 26 : 86}
                fill={index < 3 ? "var(--lc-success-soft)" : "var(--lc-active)"}
                r="12"
                stroke="var(--lc-border-strong)"
              />
            ))}
          </>
        )}
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
            (type === "binary-search" && cell >= 2 && cell <= 4) ||
            (type === "cyclic" && cell === 2)
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

      {type === "window" ? (
        <rect fill="none" height="40" rx="7" stroke="var(--lc-success)" strokeWidth="3" width="95" x="58" y="36" />
      ) : null}
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
      {type === "intervals" ? (
        <>
          <rect fill="var(--lc-success-soft)" height="10" rx="5" width="76" x="48" y="30" />
          <rect fill="var(--lc-success-soft)" height="10" rx="5" width="86" x="96" y="54" />
          <rect fill="var(--lc-active)" height="10" rx="5" width="48" x="154" y="78" />
        </>
      ) : null}
      {type === "cyclic" ? (
        <path d="M72 32c26-22 70-22 96 0M168 32l-12-2M168 32l-5-11" fill="none" stroke="var(--lc-success)" strokeWidth="3" />
      ) : null}
      {type === "reverse" ? (
        <>
          <path d="M178 32L70 32" stroke="var(--lc-success)" strokeWidth="3" />
          <path d="M70 32l11-7M70 32l11 7" stroke="var(--lc-success)" strokeWidth="3" />
        </>
      ) : null}
      {type === "binary-search" ? (
        <>
          <path d="M76 28h82" stroke="var(--lc-success)" strokeWidth="3" />
          <path d="M117 27v54" stroke="var(--lc-warning)" strokeWidth="3" />
        </>
      ) : null}
      {type === "top-k" ? (
        <path d="M64 82l56-58 56 58z" fill="var(--lc-success-soft)" stroke="var(--lc-success)" strokeWidth="3" />
      ) : null}
      {type === "window" ? <g transform="translate(74 30)">{animatedCell}</g> : null}
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
      className="max-w-full justify-start border-[var(--lc-border)] bg-[var(--lc-panel)] px-2 py-1 text-left text-xs text-[var(--lc-text-strong)] transition-colors hover:border-[#d4af37] hover:shadow-[0_0_0_1px_#d4af37]"
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
  const practiceCount = patterns.reduce((total, pattern) => total + pattern.problems.length, 0);

  return (
    <div className="space-y-4">
      <header className="rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel-raised)] p-4">
        <div className="mb-2 text-lg font-semibold text-[var(--lc-text-strong)]">
          Гайд MedikCode по паттернам
        </div>
        <p className="mb-3 text-sm leading-6 text-[var(--lc-muted)]">
          Русская адаптация 14 паттернов из статьи HackerNoon: как распознать тип задачи, какой
          прием применить и на каких задачах закрепить навык. Тексты и примеры здесь написаны
          заново под локальный тренажер.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border border-[var(--lc-border)] px-2 py-1 text-[var(--lc-muted)]">
            14 паттернов
          </span>
          <span className="rounded-md border border-[var(--lc-border)] px-2 py-1 text-[var(--lc-muted)]">
            {practiceCount} задач для практики
          </span>
        </div>
      </header>

      {patterns.map((pattern) => (
        <article
          key={pattern.title}
          className="rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel-raised)] p-4"
        >
          {(() => {
            const articleDetails = articlePatternDetails[pattern.title];

            return (
          <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)]">
            <PatternVisual title={pattern.title} type={pattern.visual} />

            <div className="min-w-0">
              {articleDetails ? (
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--lc-muted)]">
                  {articleDetails.original}
                </div>
              ) : null}
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
              {articleDetails ? (
                <div className="mt-3 border-t border-[var(--lc-border)] pt-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--lc-muted)]">
                    Как мыслить на интервью
                  </div>
                  <ul className="space-y-1 text-sm leading-6 text-[var(--lc-muted)]">
                    {articleDetails.details.map((detail) => (
                      <li key={detail} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--lc-success)]" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
            );
          })()}

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
