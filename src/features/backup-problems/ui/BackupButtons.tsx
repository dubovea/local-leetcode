import { useRef } from "react";
import { Download, UploadCloud } from "lucide-react";
import type { Problem, ProblemsBackup } from "@/entities/problem/model/types";
import { Button } from "@/shared/ui/button";

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
  return Array.isArray(value) && value.every((item) => item && typeof item === "object" && "id" in item && "title" in item);
}

function parseBackup(value: unknown): ProblemsBackup | Problem[] {
  if (isProblemArray(value)) {
    return value;
  }

  if (value && typeof value === "object" && Array.isArray((value as ProblemsBackup).problems)) {
    return value as ProblemsBackup;
  }

  throw new Error("Unsupported backup JSON format");
}

export function BackupButtons({
  onExport,
  onImport,
  onStatusChange,
}: {
  onExport: () => Promise<ProblemsBackup>;
  onImport: (backup: ProblemsBackup | Problem[]) => Promise<void>;
  onStatusChange: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function exportBackup() {
    const backup = await onExport();
    const date = new Date().toISOString().slice(0, 10);

    downloadJson(`local-leetcode-backup-${date}.json`, backup);
    onStatusChange(`Backup exported: ${backup.problems.length} problems`);
  }

  async function importBackup(file: File) {
    try {
      const raw = await file.text();
      const parsed = parseBackup(JSON.parse(raw));
      const count = Array.isArray(parsed) ? parsed.length : parsed.problems.length;

      await onImport(parsed);
      onStatusChange(`Backup imported: ${count} problems`);
    } catch (error) {
      onStatusChange(error instanceof Error ? error.message : "Backup import failed");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void importBackup(file);
          }
        }}
      />
      <Button className="flex-1" variant="ghost" onClick={() => void exportBackup()}>
        <Download className="h-4 w-4" />
        Export backup
      </Button>
      <Button className="flex-1" variant="ghost" onClick={() => inputRef.current?.click()}>
        <UploadCloud className="h-4 w-4" />
        Import backup
      </Button>
    </div>
  );
}
