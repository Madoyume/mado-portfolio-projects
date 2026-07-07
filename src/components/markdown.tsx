import type { ComponentProps } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

const LANG_PREFIX = "language-";

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function splitCodeFilename() {
  const visit = (node: HastNode) => {
    if (node.tagName === "pre") {
      const code = node.children?.find((c) => c.tagName === "code");
      const cls = code?.properties?.className;
      if (code?.properties && Array.isArray(cls)) {
        const i = cls.findIndex(
          (c) =>
            typeof c === "string" &&
            c.startsWith(LANG_PREFIX) &&
            c.includes(":"),
        );
        if (i !== -1) {
          const [lang, ...rest] = (cls[i] as string)
            .slice(LANG_PREFIX.length)
            .split(":");
          cls[i] = `${LANG_PREFIX}${lang}`;
          node.properties = {
            ...node.properties,
            dataFilename: rest.join(":"),
          };
        }
      }
    }
    for (const child of node.children ?? []) visit(child);
  };
  return (tree: HastNode) => visit(tree);
}

const components: Components = {
  a({ node, href, children, ...rest }) {
    const external = typeof href === "string" && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  },
  pre({ node, children, ...rest }) {
    const { "data-filename": filename, ...preProps } =
      rest as ComponentProps<"pre"> & { "data-filename"?: string };
    if (!filename) return <pre {...preProps}>{children}</pre>;
    return (
      <div className="code-block">
        <span className="code-block__filename">{filename}</span>
        <pre {...preProps}>{children}</pre>
      </div>
    );
  },
};

export function MarkdownContent({ children }: { children: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeRaw, splitCodeFilename, rehypeHighlight]}
      components={components}
    >
      {children}
    </Markdown>
  );
}
