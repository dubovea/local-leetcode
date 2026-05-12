import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useMemo, useRef } from "react";
import type * as Monaco from "monaco-editor";
import type { CodeLanguage } from "@/entities/problem/model/types";
import { getCodeLanguageConfig } from "@/entities/problem/model/codeLanguages";
import { formatJavaScript } from "@/shared/lib/formatJavaScript";

const CODE_SAVE_DELAY_MS = 700;
type AppTheme = "dark" | "light";

export function SolutionEditor({
  problemId,
  initialCode,
  language,
  onChange,
  onDraftChange,
  onRun,
  resetKey,
  theme,
}: {
  problemId: string;
  initialCode: string;
  language: CodeLanguage;
  resetKey: number;
  theme: AppTheme;
  onChange: (problemId: string, language: CodeLanguage, code: string) => void;
  onDraftChange: (problemId: string, language: CodeLanguage, code: string) => void;
  onRun: () => void;
}) {
  const languageConfig = getCodeLanguageConfig(language);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const runRef = useRef(onRun);
  const changeRef = useRef(onChange);
  const draftChangeRef = useRef(onDraftChange);
  const saveTimerRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<{
    problemId: string;
    language: CodeLanguage;
    code: string;
  } | null>(null);
  const problemIdRef = useRef(problemId);
  const languageRef = useRef(language);
  const lastEditorProblemIdRef = useRef(problemId);
  const lastEditorLanguageRef = useRef(language);
  const lastResetKeyRef = useRef(resetKey);

  useEffect(() => {
    runRef.current = onRun;
  }, [onRun]);

  useEffect(() => {
    monacoRef.current?.editor.setTheme(theme === "dark" ? "medikcode-dark" : "medikcode-light");
  }, [theme]);

  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    draftChangeRef.current = onDraftChange;
  }, [onDraftChange]);

  const flushCode = useMemo(() => {
    return (code: string) => {
      const currentProblemId = problemIdRef.current;
      const currentLanguage = languageRef.current;

      draftChangeRef.current(currentProblemId, currentLanguage, code);

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      pendingSaveRef.current = { problemId: currentProblemId, language: currentLanguage, code };
      saveTimerRef.current = window.setTimeout(() => {
        const pendingSave = pendingSaveRef.current;

        if (pendingSave) {
          changeRef.current(pendingSave.problemId, pendingSave.language, pendingSave.code);
          pendingSaveRef.current = null;
        }
      }, CODE_SAVE_DELAY_MS);
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;

    problemIdRef.current = problemId;
    languageRef.current = language;

    if (!editor) {
      return;
    }

    const problemChanged = lastEditorProblemIdRef.current !== problemId;
    const languageChanged = lastEditorLanguageRef.current !== language;
    const resetRequested = lastResetKeyRef.current !== resetKey;

    if (!problemChanged && !languageChanged && !resetRequested) {
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (pendingSaveRef.current) {
      changeRef.current(
        pendingSaveRef.current.problemId,
        pendingSaveRef.current.language,
        pendingSaveRef.current.code,
      );
      pendingSaveRef.current = null;
    }

    editor.setValue(initialCode);
    const model = editor.getModel();

    if (model) {
      monacoRef.current?.editor.setModelLanguage(model, languageConfig.monacoLanguage);
      editor.updateOptions({ tabSize: languageConfig.tabSize });
    }

    draftChangeRef.current(problemId, language, initialCode);
    lastEditorProblemIdRef.current = problemId;
    lastEditorLanguageRef.current = language;
    lastResetKeyRef.current = resetKey;
  }, [
    initialCode,
    language,
    languageConfig.monacoLanguage,
    languageConfig.tabSize,
    problemId,
    resetKey,
  ]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      if (pendingSaveRef.current) {
        changeRef.current(
          pendingSaveRef.current.problemId,
          pendingSaveRef.current.language,
          pendingSaveRef.current.code,
        );
        pendingSaveRef.current = null;
      }
    };
  }, []);

  const formatCode = async () => {
    if (languageRef.current !== "javascript") {
      return;
    }

    try {
      const editor = editorRef.current;
      const formatted = await formatJavaScript(editor?.getValue() ?? initialCode);

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      pendingSaveRef.current = null;

      editor?.setValue(formatted);
      draftChangeRef.current(problemIdRef.current, languageRef.current, formatted);
      changeRef.current(problemIdRef.current, languageRef.current, formatted);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    monaco.editor.defineTheme("medikcode-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1f1f1f",
        "editorLineNumber.foreground": "#6f6f6f",
        "editorCursor.foreground": "#ffffff",
        "editor.selectionBackground": "#3a3d41",
      },
    });
    monaco.editor.defineTheme("medikcode-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#ffffff",
        "editorLineNumber.foreground": "#8a8a8a",
        "editorCursor.foreground": "#111827",
        "editor.selectionBackground": "#dbeafe",
      },
    });
    monaco.editor.setTheme(theme === "dark" ? "medikcode-dark" : "medikcode-light");

    const model = editor.getModel();

    if (model) {
      monaco.editor.setModelLanguage(model, languageConfig.monacoLanguage);
      editor.updateOptions({ tabSize: languageConfig.tabSize });
    }

    monaco.languages.registerDocumentFormattingEditProvider("javascript", {
      async provideDocumentFormattingEdits(model: Monaco.editor.ITextModel) {
        const formatted = await formatJavaScript(model.getValue());

        return [
          {
            range: model.getFullModelRange(),
            text: formatted,
          },
        ];
      },
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      void formatCode();
    });
  };

  return (
    <Editor
      defaultLanguage={languageConfig.monacoLanguage}
      defaultValue={initialCode}
      height="100%"
      language={languageConfig.monacoLanguage}
      onChange={(value) => flushCode(value ?? "")}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontLigatures: false,
        fontFamily: "JetBrains Mono, Menlo, Consolas, monospace",
        lineNumbersMinChars: 3,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        tabSize: languageConfig.tabSize,
        automaticLayout: true,
        wordWrap: "on",
        padding: { top: 12, bottom: 12 },
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        parameterHints: { enabled: true },
      }}
      path={`problem-${problemId}.${languageConfig.extension}`}
    />
  );
}
