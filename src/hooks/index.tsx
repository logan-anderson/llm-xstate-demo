// src/hooks/use-markdown-processor.tsx

// Custom Dialog component rendered with Radix.
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as prod from "react/jsx-runtime";
import "highlight.js/styles/base16/green-screen.css";
import mermaid from "mermaid";
import {
  createElement,
  Fragment,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import rehypeHighlight from "rehype-highlight";
import rehypeReact from "rehype-react";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { Button } from "@/components/ui/button";

// @ts-expect-error: the react types are missing.
const production = { Fragment: prod.Fragment, jsx: prod.jsx, jsxs: prod.jsxs };

export const useMarkdownProcessor = (content: string) => {
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "forest" });
  }, []);

  return useMemo(() => {
    return (
      unified()
        // Parse the raw string
        .use(remarkParse)
        // Add support for GitHub-flavored Markdown
        .use(remarkGfm)
        // Convert the remark tree (Markdown) into a rehype tree (HTML)
        .use(remarkRehype)
        // Add support for syntax highlighting (and avoid throwing when it's an unknown language)
        .use(
          rehypeHighlight,
          // @ts-expect-error: the highlight types are missing.
          { ignoreMissing: true }
        )
        // Convert the rehype tree (HTML) into a React component tree,
        // with custom components for each element...
        // @ts-expect-error: the react types are missing.
        .use(rehypeReact, {
          ...production,
          createElement,
          Fragment,
          components: {
            a: ({ href, children }: JSX.IntrinsicElements["a"]) => (
              <a href={href} target="_blank" rel="noreferrer" className="...">
                {children}
              </a>
            ),
            h1: ({ children, id }: JSX.IntrinsicElements["h1"]) => (
              <h1 className="..." id={id}>
                {children}
              </h1>
            ),
            h2: ({ children, id }: JSX.IntrinsicElements["h2"]) => (
              <h2 className="..." id={id}>
                {children}
              </h2>
            ),
            h3: ({ children, id }: JSX.IntrinsicElements["h3"]) => (
              <h3 className="..." id={id}>
                {children}
              </h3>
            ),
            h4: ({ children, id }: JSX.IntrinsicElements["h4"]) => (
              <h4 className="..." id={id}>
                {children}
              </h4>
            ),
            h5: ({ children, id }: JSX.IntrinsicElements["h5"]) => (
              <h5 className="..." id={id}>
                {children}
              </h5>
            ),
            h6: ({ children, id }: JSX.IntrinsicElements["h6"]) => (
              <h6 className="..." id={id}>
                {children}
              </h6>
            ),
            p: ({ children }: JSX.IntrinsicElements["p"]) => {
              return <p className="...">{children}</p>;
            },
            strong: ({ children }: JSX.IntrinsicElements["strong"]) => (
              <strong className="...">{children}</strong>
            ),
            em: ({ children }: JSX.IntrinsicElements["em"]) => (
              <em>{children}</em>
            ),
            code: CodeBlock,
            pre: ({ children }: JSX.IntrinsicElements["pre"]) => {
              return (
                <div className="...">
                  <pre className="...">{children}</pre>
                </div>
              );
            },
            ul: ({ children }: JSX.IntrinsicElements["ul"]) => (
              <ul className="...">{children}</ul>
            ),
            ol: ({ children }: JSX.IntrinsicElements["ol"]) => (
              <ol className="...">{children}</ol>
            ),
            li: ({ children }: JSX.IntrinsicElements["li"]) => (
              <li className="...">{children}</li>
            ),
            table: ({ children }: JSX.IntrinsicElements["table"]) => (
              <div className="...">
                <table className="...">{children}</table>
              </div>
            ),
            thead: ({ children }: JSX.IntrinsicElements["thead"]) => (
              <thead className="...">{children}</thead>
            ),
            th: ({ children }: JSX.IntrinsicElements["th"]) => (
              <th className="...">{children}</th>
            ),
            td: ({ children }: JSX.IntrinsicElements["td"]) => (
              <td className="...">{children}</td>
            ),
            blockquote: ({ children }: JSX.IntrinsicElements["blockquote"]) => (
              <blockquote className="...">{children}</blockquote>
            ),
          },
        })
        .processSync(content).result as ReactNode
    );
  }, [content]);
};

// A more complex custom component for the `code` element.
const CodeBlock = ({ children, className }: JSX.IntrinsicElements["code"]) => {
  // State to display the Mermaid diagram.
  const [showMermaidPreview, setShowMermaidPreview] = useState(false);

  // Highlight.js adds a `className` so this is a hack to detect if the code block
  // is a language block wrapped in a `pre` tag versus an inline `code` tag.
  if (className) {
    // Determine if it's a mermaid diagram code block.
    const isMermaid = className.includes("language-mermaid");

    return (
      <>
        <code className={className}>{children}</code>
        {/* If the code block is a Mermaid diagram, display additional UI to allow rendering it. */}
        <div className="...">
          {isMermaid ? (
            <>
              <Button
                type="button"
                className="my-2"
                onClick={() => {
                  setShowMermaidPreview(true);
                }}
              >
                Open Mermaid preview
              </Button>
              <DialogWrapper
                open={showMermaidPreview}
                setOpen={setShowMermaidPreview}
                title="Mermaid diagram preview"
                size="3xl"
              >
                <Mermaid content={children?.toString() ?? ""} />
              </DialogWrapper>
            </>
          ) : null}
        </div>
      </>
    );
  }

  // Handle an inline `code` tag.
  return <code className="...">{children}</code>;
};

// A custom component to render a Mermaid diagram given the string.
const Mermaid = ({ content }: { content: string }) => {
  const [diagram, setDiagram] = useState<string | boolean>(true);

  useEffect(() => {
    const render = async () => {
      // Generate a random ID for Mermaid to use.
      const id = `mermaid-svg-${Math.round(Math.random() * 10000000)}`;

      // Confirm the diagram is valid before rendering since it could be invalid
      // while streaming, or if the LLM "hallucinates" an invalid diagram.
      if (await mermaid.parse(content, { suppressErrors: true })) {
        const { svg } = await mermaid.render(id, content);
        setDiagram(svg);
      } else {
        setDiagram(false);
      }
    };
    render();
  }, [content]);

  if (diagram === true) {
    return <p className="...">Rendering diagram...</p>;
  } else if (diagram === false) {
    return <p className="...">Unable to render this diagram.</p>;
  } else {
    return <div dangerouslySetInnerHTML={{ __html: diagram ?? "" }} />;
  }
};

interface Props {
  open: boolean;
  setOpen(open: boolean): void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  size?: "xl" | "3xl";
}

const DialogWrapper = ({
  open,
  setOpen,
  title,
  description,
  children,
  size = "xl",
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {description ? (
          <DialogDescription>{description}</DialogDescription>
        ) : null}
        {children}
      </DialogContent>
    </Dialog>
  );
};
