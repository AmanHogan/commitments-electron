import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import "katex/dist/katex.min.css"
import { cn } from "@/lib/utils"

interface MarkdownProps {
  children: string
  className?: string
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <span className="block">{children}</span>,
          code({ node: _node, inline, className: cls, children: ch, ...props }: any) {
            const match = /language-(\w+)/.exec(cls || "")
            return !inline && match ? (
              <SyntaxHighlighter style={oneDark as any} language={match[1]} PreTag="div" {...props}>
                {String(ch).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className={cn("rounded bg-muted px-1 py-0.5 font-mono text-sm", cls)} {...props}>
                {ch}
              </code>
            )
          },
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="border-collapse border border-border w-full">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted px-3 py-2 text-left font-semibold text-sm">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-sm">{children}</td>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">{children}</blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
