import { useState } from "react";
import type { Difficulty, Problem } from "@/entities/problem/model/types";
import { createId } from "@/shared/lib/id";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

function toSlug(title: string) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "manual-problem"
  );
}

function toFunctionName(title: string) {
  const words = title
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const [first = "solution", ...rest] = words;

  return [first.toLowerCase(), ...rest.map((word) => word[0].toUpperCase() + word.slice(1))].join(
    "",
  );
}

export function CreateManualProblemForm({
  nextNumber,
  onCancel,
  onCreate,
}: {
  nextNumber: number;
  onCancel: () => void;
  onCreate: (problem: Problem) => void;
}) {
  const [title, setTitle] = useState("Своя задача");
  const [number, setNumber] = useState(String(nextNumber));
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [functionName, setFunctionName] = useState("solution");

  function createProblem() {
    const cleanTitle = title.trim() || "Своя задача";
    const cleanNumber = Number(number);
    const problemNumber =
      Number.isFinite(cleanNumber) && cleanNumber > 0 ? cleanNumber : nextNumber;
    const cleanFunctionName = functionName.trim() || toFunctionName(cleanTitle);
    const slug = toSlug(cleanTitle);

    onCreate({
      id: createId("custom"),
      source: "manual",
      number: problemNumber,
      title: cleanTitle,
      slug: `manual-${slug}`,
      difficulty,
      topics: [],
      functionName: cleanFunctionName,
      judgeMode: "exact",
      descriptionMarkdown: `# ${problemNumber}. ${cleanTitle}\n\nОпишите условие задачи в Markdown.`,
      notesMarkdown: "",
      code: `/**\n * Напишите решение здесь.\n */\nvar ${cleanFunctionName} = function (...args) {\n  console.log(args);\n};`,
      testCases: [{ id: createId("case"), input: "", expected: "undefined" }],
      submissions: [],
    });
  }

  return (
    <div className="rounded-lg border border-[var(--lc-border)] bg-[var(--lc-panel-raised)] p-3">
      <div className="mb-3 text-sm font-semibold text-[var(--lc-text-strong)]">
        Новая своя задача
      </div>

      <label className="mb-1 block text-xs font-medium text-[var(--lc-muted)]">Название</label>
      <Input
        className="mb-3"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);

          if (functionName === "solution") {
            setFunctionName(toFunctionName(event.target.value));
          }
        }}
      />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--lc-muted)]">Номер</label>
          <Input
            inputMode="numeric"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--lc-muted)]">
            Сложность
          </label>
          <Select
            value={difficulty}
            onValueChange={(value) => setDifficulty(value as Difficulty)}
          >
            <SelectTrigger
              aria-label="Сложность"
              className="h-8 w-full border-[var(--lc-border)] bg-[var(--lc-panel)] text-[var(--lc-text-strong)]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--lc-panel-raised)]">
              <SelectItem value="Easy">Лёгкая</SelectItem>
              <SelectItem value="Medium">Средняя</SelectItem>
              <SelectItem value="Hard">Сложная</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <label className="mb-1 block text-xs font-medium text-[var(--lc-muted)]">
        Имя функции
      </label>
      <Input
        className="mb-3 font-mono"
        value={functionName}
        onChange={(event) => setFunctionName(event.target.value)}
      />

      <div className="flex justify-end gap-2">
        <Button className="h-8 px-3 text-xs" onClick={onCancel} variant="ghost">
          Отмена
        </Button>
        <Button className="h-8 px-3 text-xs" onClick={createProblem}>
          Создать
        </Button>
      </div>
    </div>
  );
}
