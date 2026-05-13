import { useRef } from "react";
import { Download, MoreHorizontal, RotateCcw, Trash2, UploadCloud } from "lucide-react";
import type { Problem, ProblemsBackup } from "@/entities/problem/model/types";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

function isProblemArray(value: unknown): value is Problem[] {
  return (
    Array.isArray(value) &&
    value.every((item) => item && typeof item === "object" && "id" in item && "title" in item)
  );
}

function parseBackup(value: unknown): ProblemsBackup | Problem[] {
  if (isProblemArray(value)) {
    return value;
  }

  if (value && typeof value === "object" && Array.isArray((value as ProblemsBackup).problems)) {
    return value as ProblemsBackup;
  }

  throw new Error("Неподдерживаемый формат бэкапа");
}

export function BackupButtons({
  onExport,
  onImport,
  onReset,
  onResetSubmissions,
  onStatusChange,
}: {
  onExport: () => Promise<ProblemsBackup>;
  onImport: (backup: ProblemsBackup | Problem[]) => Promise<void>;
  onReset: () => void;
  onResetSubmissions: () => void;
  onStatusChange: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function exportBackup() {
    const backup = await onExport();
    const date = new Date().toISOString().slice(0, 10);

    downloadJson(`medikcode-backup-${date}.json`, backup);
    onStatusChange(`Бэкап экспортирован: ${backup.problems.length} задач`);
  }

  async function importBackup(file: File) {
    try {
      const raw = await file.text();
      const parsed = parseBackup(JSON.parse(raw));
      const count = Array.isArray(parsed) ? parsed.length : parsed.problems.length;

      await onImport(parsed);
      onStatusChange(`Бэкап импортирован: ${count} задач`);
    } catch (error) {
      onStatusChange(error instanceof Error ? error.message : "Не удалось импортировать бэкап");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleResetSubmissions() {
    const confirmed = window.confirm(
      "Сбросить всю историю решений? Попытки и статусы решённых задач будут удалены.",
    );

    if (!confirmed) {
      return;
    }

    await onResetSubmissions();
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
            void importBackup(file);
          }
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Действия с данными"
            size="icon"
            title="Бэкап и очистка задач"
            variant="secondary"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuItem onSelect={() => void exportBackup()}>
            <Download className="h-4 w-4" />
            Экспорт бэкапа
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
            <UploadCloud className="h-4 w-4" />
            Импорт бэкапа
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={onReset}>
            <Trash2 className="h-4 w-4" />
            Удалить все задачи
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={handleResetSubmissions}>
            <RotateCcw className="h-4 w-4" />
            Сбросить все решения
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
