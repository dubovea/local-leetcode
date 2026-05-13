export function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

export async function readMemoryBytes() {
  const measureUserAgentSpecificMemory =
    typeof performance !== "undefined" &&
    performance &&
    typeof performance.measureUserAgentSpecificMemory === "function"
      ? performance.measureUserAgentSpecificMemory.bind(performance)
      : undefined;

  if (measureUserAgentSpecificMemory) {
    try {
      const sample = await measureUserAgentSpecificMemory();

      if (Number.isFinite(sample?.bytes)) {
        return sample.bytes;
      }
    } catch {
      // Fall back to lighter browser-specific heap counters below.
    }
  }

  const memory =
    typeof performance !== "undefined" && performance && "memory" in performance
      ? performance.memory
      : undefined;
  const usedHeapSize = memory?.usedJSHeapSize;

  return Number.isFinite(usedHeapSize) ? usedHeapSize : undefined;
}

export function estimateValueMemoryBytes(value, seen = new Set()) {
  if (value === null || typeof value === "undefined") {
    return 0;
  }

  if (typeof value === "string") {
    return value.length * 2;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return 8;
  }

  if (typeof value === "boolean") {
    return 4;
  }

  if (typeof value !== "object") {
    return 0;
  }

  if (seen.has(value)) {
    return 0;
  }

  seen.add(value);

  if (value instanceof ArrayBuffer) {
    return value.byteLength;
  }

  if (ArrayBuffer.isView(value)) {
    return value.byteLength;
  }

  if (Array.isArray(value)) {
    return value.reduce(
      (total, item) => total + estimateValueMemoryBytes(item, seen),
      24 + value.length * 8,
    );
  }

  return Object.entries(value).reduce(
    (total, [key, item]) => total + key.length * 2 + estimateValueMemoryBytes(item, seen),
    32,
  );
}

export function createMemoryTracker() {
  let trackedBytes = 0;

  function track(value) {
    trackedBytes += estimateValueMemoryBytes(value);
    return value;
  }

  class TrackedMap extends Map {
    constructor(entries) {
      super(entries);
      trackedBytes += 56 + estimateValueMemoryBytes([...this.entries()]);
    }

    set(key, value) {
      if (!this.has(key)) {
        trackedBytes += 32 + estimateValueMemoryBytes(key) + estimateValueMemoryBytes(value);
      } else {
        trackedBytes += estimateValueMemoryBytes(value);
      }

      return super.set(key, value);
    }
  }

  class TrackedSet extends Set {
    constructor(entries) {
      super(entries);
      trackedBytes += 48 + estimateValueMemoryBytes([...this.values()]);
    }

    add(value) {
      if (!this.has(value)) {
        trackedBytes += 24 + estimateValueMemoryBytes(value);
      }

      return super.add(value);
    }
  }

  const TrackedArray = new Proxy(Array, {
    apply(target, thisArg, args) {
      return track(Reflect.apply(target, thisArg, args));
    },
    construct(target, args) {
      return track(Reflect.construct(target, args));
    },
    get(target, prop, receiver) {
      if (prop === "from") {
        return (...args) => track(Array.from(...args));
      }

      if (prop === "of") {
        return (...args) => track(Array.of(...args));
      }

      return Reflect.get(target, prop, receiver);
    },
  });

  return {
    Array: TrackedArray,
    Map: TrackedMap,
    Set: TrackedSet,
    readBytes: () => trackedBytes,
    reset: () => {
      trackedBytes = 0;
    },
  };
}

export async function measureMemoryBytes(
  startHeapBytes,
  output,
  references = [],
  trackedBytes = 0,
) {
  const finishHeapBytes = await readMemoryBytes();
  const heapDelta =
    typeof startHeapBytes === "number" && typeof finishHeapBytes === "number"
      ? Math.max(0, finishHeapBytes - startHeapBytes)
      : 0;
  const retainedBytes =
    estimateValueMemoryBytes(output) +
    references.reduce((total, value) => total + estimateValueMemoryBytes(value), 0);

  return Math.max(heapDelta, retainedBytes, trackedBytes);
}

export function maxCaseMemoryBytes(cases) {
  const values = cases
    .map((testCase) => testCase.memoryBytes)
    .filter((memoryBytes) => Number.isFinite(memoryBytes));

  return values.length > 0 ? Math.max(...values) : undefined;
}
