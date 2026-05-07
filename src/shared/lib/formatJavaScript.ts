import { format } from "prettier/standalone";
import babel from "prettier/plugins/babel";
import estree from "prettier/plugins/estree";

export async function formatJavaScript(code: string) {
  return format(code, {
    parser: "babel",
    plugins: [babel, estree],
    semi: true,
    singleQuote: false,
    printWidth: 100,
    trailingComma: "all",
  });
}
