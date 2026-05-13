import type { CodeLanguage, Problem } from "./types";

export const DEFAULT_CODE_LANGUAGE: CodeLanguage = "javascript";

export const codeLanguageOptions: Array<{
  value: CodeLanguage;
  label: string;
  monacoLanguage: string;
  extension: string;
  tabSize: number;
}> = [
  {
    value: "javascript",
    label: "JavaScript",
    monacoLanguage: "javascript",
    extension: "js",
    tabSize: 2,
  },
  {
    value: "python-pyodide",
    label: "Python (Pyodide)",
    monacoLanguage: "python",
    extension: "py",
    tabSize: 4,
  },
  // {
  //   value: "c-wasm",
  //   label: "C (WASM)",
  //   monacoLanguage: "c",
  //   extension: "c",
  //   tabSize: 4,
  // },
  // {
  //   value: "csharp-wasm",
  //   label: "C# (WASM)",
  //   monacoLanguage: "csharp",
  //   extension: "cs",
  //   tabSize: 4,
  // },
  // {
  //   value: "cpp-wasm",
  //   label: "C++ (WASM)",
  //   monacoLanguage: "cpp",
  //   extension: "cpp",
  //   tabSize: 4,
  // },
  // {
  //   value: "go-wasm",
  //   label: "GoLang (WASM)",
  //   monacoLanguage: "go",
  //   extension: "go",
  //   tabSize: 4,
  // },
];

const languageConfigByValue = new Map(
  codeLanguageOptions.map((language) => [language.value, language]),
);

export function isCodeLanguage(value: unknown): value is CodeLanguage {
  return typeof value === "string" && languageConfigByValue.has(value as CodeLanguage);
}

export function getCodeLanguageConfig(language: CodeLanguage) {
  return languageConfigByValue.get(language) ?? codeLanguageOptions[0];
}

export function getCodeLanguageLabel(language?: CodeLanguage) {
  return getCodeLanguageConfig(isCodeLanguage(language) ? language : DEFAULT_CODE_LANGUAGE).label;
}

function extractParameterNames(inputText?: string) {
  const matches = String(inputText ?? "").matchAll(/(?:^|[\s,;])([A-Za-z_]\w*)\s*=/g);

  return Array.from(matches, (match) => match[1]);
}

function getProblemParameters(problem: Problem) {
  return extractParameterNames(problem.testCases[0]?.input);
}

export function getStarterCodeForLanguage(problem: Problem, language: CodeLanguage) {
  const functionName = problem.functionName || "solution";
  const parameters = getProblemParameters(problem);
  const notice =
    "Snippet for this language was not found in the imported dataset. Support may appear later.";

  if (language === "python-pyodide") {
    return `# ${notice}\n\ndef ${functionName}(${parameters.length > 0 ? parameters.join(", ") : "*args"}):\n    return None\n`;
  }

  if (language === "cpp-wasm") {
    return `// ${notice}\n\n#include <vector>\nusing namespace std;\n\nauto ${functionName}() {\n    return 0;\n}\n`;
  }

  if (language === "c-wasm") {
    return `// ${notice}\n\nint ${functionName}(void) {\n    return 0;\n}\n`;
  }

  if (language === "csharp-wasm") {
    return `// ${notice}\n\npublic class Solution {\n    public object ${functionName}() {\n        return null;\n    }\n}\n`;
  }

  if (language === "go-wasm") {
    return `// ${notice}\n\npackage main\n\nfunc ${functionName}() any {\n    return nil\n}\n`;
  }

  return problem.code;
}

export function getResetCodeForLanguage(problem: Problem, language: CodeLanguage) {
  const functionName = problem.functionName || "solution";
  const parameters = getProblemParameters(problem);
  const parameterText = parameters.join(", ");

  if (language === "python-pyodide") {
    return `def ${functionName}(${parameterText}):\n    return None\n`;
  }

  return `/**\n * Write your solution here.\n */\nvar ${functionName} = function(${parameterText}) {\n  \n};`;
}

export function getProblemCode(problem: Problem, language: CodeLanguage) {
  return (
    problem.codeByLanguage?.[language] ??
    (language === DEFAULT_CODE_LANGUAGE ? problem.code : undefined) ??
    getStarterCodeForLanguage(problem, language)
  );
}
