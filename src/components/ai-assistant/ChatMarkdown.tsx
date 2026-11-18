import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import styles from "./chat-markdown.module.css";

export default function ChatMarkdown({ children }: { children: string }) {
  return (
    <div className={styles.markdown}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        skipHtml
        components={{
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
          table: ({ children }) => <div className={styles.tableScroll} role="region" aria-label="AI 답변 표" tabIndex={0}><table>{children}</table></div>,
        }}
      >{children}</Markdown>
    </div>
  );
}
