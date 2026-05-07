import { useState } from "react";
import type { Difficulty, Problem } from "@/entities/problem/model/types";
import { createId } from "@/shared/lib/id";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

function toSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "manual-problem";
}

function toFunctionName(title: string) {
  const words = title.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const [first = "solution", ...rest] = words;

  return [first.toLowerCase(), ...rest.map((word) => word[0].toUpperCase() + word.slice(1))].join("");
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
  const [title, setTitle] = useState("Custom Problem");
  const [number, setNumber] = useState(String(nextNumber));
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [functionName, setFunctionName] = useState("solution");

  function createProblem() {
    const cleanTitle = title.trim() || "Custom Problem";
    const cleanNumber = Number(number);
    const problemNumber = Number.isFinite(cleanNumber) && cleanNumber > 0 ? cleanNumber : nextNumber;
    const cleanFunctionName = functionName.trim() || toFunctionName(cleanTitle);
    const slug = toSlug(cleanTitle);

    onCreate({
      id: createId("custom"),
      source: "manual",
      number: problemNumber,
      title: cleanTitle,
      slug: `manual-${slug}`,
      difficulty,
      functionName: cleanFunctionName,
      judgeMode: "exact",
      descriptionMarkdown: `# ${problemNumber}. ${cleanTitle}\n\nWrite the problem description in Markdown.`,
      notesMarkdown: "",
      code: `/**\n * Write your solution here.\n */\nvar ${cleanFunctionName} = function (...args) {\n  console.log(args);\n};`,
      testCases: [{ id: createId("case"), input: "", expected: "undefined" }],
      submissions: [],
    });
  }

  return (
    <div className="rounded-lg border border-[#333] bg-[#202020] p-3">
      <div className="mb-3 text-sm font-semibold text-[#f0f0f0]">New manual problem</div>

      <label className="mb-1 block text-xs font-medium text-[#9f9f9f]">Title</label>
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
          <label className="mb-1 block text-xs font-medium text-[#9f9f9f]">Number</label>
          <Input
            inputMode="numeric"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#9f9f9f]">Difficulty</label>
          <select
            className="h-9 w-full rounded-md border border-[#333] bg-[#2b2b2b] px-3 text-sm text-[#f1f1f1] outline-none focus:border-[#555]"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty)}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>
      </div>

      <label className="mb-1 block text-xs font-medium text-[#9f9f9f]">Function name</label>
      <Input
        className="mb-3 font-mono"
        value={functionName}
        onChange={(event) => setFunctionName(event.target.value)}
      />

      <div className="flex justify-end gap-2">
        <Button className="h-8 px-3 text-xs" onClick={onCancel} variant="ghost">
          Cancel
        </Button>
        <Button className="h-8 px-3 text-xs" onClick={createProblem}>
          Create
        </Button>
      </div>
    </div>
  );
}
