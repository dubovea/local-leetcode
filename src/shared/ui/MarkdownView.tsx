import type { ReactNode } from "react";

type Block =
  | { type: "code"; value: string; lang: string }
  | { type: "heading"; level: 1 | 2 | 3; value: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; value: string }
  | { type: "paragraph"; value: string };

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const code: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trimStart().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }

      blocks.push({ type: "code", value: code.join("\n"), lang });
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        value: heading[2],
      });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", value: quote.join("\n") });
      continue;
    }

    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      const pattern = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/;

      while (index < lines.length && pattern.test(lines[index])) {
        items.push(lines[index].replace(pattern, ""));
        index += 1;
      }

      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trimStart().startsWith("```") &&
      !/^(#{1,3})\s+(.+)$/.test(lines[index]) &&
      !/^>\s?/.test(lines[index]) &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }

    blocks.push({ type: "paragraph", value: paragraph.join(" ") });
  }

  return blocks;
}

function inline(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("**")) {
      result.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      result.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      result.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}

export function MarkdownView({ markdown }: { markdown: string }) {
  const blocks = parseBlocks(markdown);

  return (
    <div className="markdown">
      {blocks.map((block, index) => {
        if (block.type === "code") {
          return (
            <pre key={index}>
              <code>{block.value}</code>
            </pre>
          );
        }

        if (block.type === "heading") {
          const Tag = `h${block.level}` as "h1" | "h2" | "h3";
          return <Tag key={index}>{inline(block.value)}</Tag>;
        }

        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{inline(item)}</li>
              ))}
            </Tag>
          );
        }

        if (block.type === "quote") {
          return <blockquote key={index}>{inline(block.value)}</blockquote>;
        }

        return <p key={index}>{inline(block.value)}</p>;
      })}
    </div>
  );
}
