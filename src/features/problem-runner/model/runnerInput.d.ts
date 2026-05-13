export type ParsedInputAssignments = { names: string[]; values: unknown[] };

export type ExpectedValueOutput = {
  kind: "value";
  value: unknown;
};

export type ExpectedNamedOutput = {
  kind: "named";
  hasReturn: boolean;
  returnValue: unknown;
  fields: Array<{ name: string; value: unknown }>;
};

export type ExpectedOutput = ExpectedValueOutput | ExpectedNamedOutput;

export function parseInputAssignments(inputText: string): ParsedInputAssignments;
export function evaluateLiteral(valueText: string): unknown;
export function cleanValueText(text: string): string;
export function parseExpectedOutput(expectedText: string): ExpectedOutput;
export function formatNamedOutput(output: ExpectedNamedOutput): string;
export function formatExpectedOutput(expected: ExpectedOutput): string;
