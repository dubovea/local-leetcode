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
        setStatus("No problems found");
        return;
      }

      onImport(problems);
      setStatus(`Imported ${problems.length}${skippedCount ? `, skipped ${skippedCount}` : ""}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Import failed");
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
        className="hidden"
        type="file"
        accept="application/json,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            void handleFile(file);
          }
        }}
      />
      <Button
        aria-label="Import neenza JSON"
        size="icon"
        title="Import neenza JSON"
        variant="secondary"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
      </Button>
      {!onStatusChange && statusText ? <div className="mt-2 text-xs text-[#8f8f8f]">{statusText}</div> : null}
    </div>
  );
}
