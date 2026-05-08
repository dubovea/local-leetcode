import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import type { Problem } from "@/entities/problem/model/types";
import { convertNeenzaDataset } from "@/features/import-problems/model/neenzaConverter";
import { Button } from "@/shared/ui/button";

export function ImportProblemsButton({
  onImport,
  onStatusChange,
}: {
  onImport: (problems: Problem[]) => void;
  onStatusChange?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [statusText, setStatusText] = useState("");

  function setStatus(message: string) {
    if (onStatusChange) {
      onStatusChange(message);
      return;
    }

    setStatusText(message);
  }

  async function handleFile(file: File) {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      const { problems, skippedCount } = convertNeenzaDataset(parsed);

      if (problems.length === 0) {
        setStatus("Задачи не найдены");
        return;
      }

      onImport(problems);
      setStatus(
        `Импортировано задач: ${problems.length}${skippedCount ? `, пропущено: ${skippedCount}` : ""}`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось импортировать задачи");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        accept="application/json,.json"
        className="hidden"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void handleFile(file);
          }
        }}
      />
      <Button
        aria-label="Импортировать задачи"
        className="px-3"
        title="Импортировать файл merged_problems.json из публичного датасета neenza"
        variant="secondary"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        Импорт задач
      </Button>
      {!onStatusChange && statusText ? (
        <div className="mt-2 text-xs text-[var(--lc-muted)]">{statusText}</div>
      ) : null}
    </div>
  );
}
