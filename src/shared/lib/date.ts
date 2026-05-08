export function formatDateTime(isoDate: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(isoDate));
}

export function formatRuntime(ms: number) {
  if (!Number.isFinite(ms)) {
    return "0 ms";
  }

  if (ms < 1) {
    return `${ms.toFixed(3)} ms`;
  }

  return `${Math.round(ms)} ms`;
}

export function formatMemory(bytes?: number) {
  if (!Number.isFinite(bytes)) {
    return "N/A";
  }

  const value = bytes ?? 0;

  if (value < 1024) {
    return `${Math.round(value)} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
