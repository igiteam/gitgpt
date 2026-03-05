import React, { useEffect, useState, useCallback, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import { marked } from "marked";

interface MessageContentProps {
  content: string;
  role: "user" | "assistant" | "system";
  isTruncated?: boolean;
  isHtmlEmail?: boolean;
  fullHtml?: boolean;
  iframeWidth?: string | number;
  iframeHeight?: string | number;
}

const MessageContent: React.FC<MessageContentProps> = ({
  content = "",
  role,
  isTruncated = false,
  isHtmlEmail = false,
  fullHtml = false,
  iframeWidth = "100%",
  iframeHeight = 400,
}) => {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Only highlight code, don't apply Prism themes
    Prism.highlightAll();
  }, [content]);

  const copyMessageToClipboard = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    });
  }, [content]);

  // Custom marked renderer to include copy buttons on code blocks
  const renderer = new marked.Renderer();

  renderer.code = function (code: string, language?: string) {
    if (!language) {
      const yamlIndicators = [": ", "name:", "template:", "network:", "roles:"];
      if (yamlIndicators.some((indicator) => code.includes(indicator))) {
        language = "yaml";
      }
    }

    const validLanguage = Prism.languages[language || ""]
      ? language
      : "plaintext";
    const highlighted = Prism.highlight(
      code,
      Prism.languages[validLanguage || "plaintext"],
      validLanguage || "plaintext"
    );

    return `
  <div class="code-block-wrapper relative rounded-lg my-3 group">
    <div class="absolute right-2 top-2 flex gap-2">
      <button 
        type="button" 
        class="copy-code-button bg-[var(--color-secondary)] text-[var(--color-foreground)] px-2 py-1 text-xs rounded select-none"
        aria-label="Copy code"
        data-copy-code="true"
      >
        Copy
      </button>
      ${
        language
          ? `<div class="code-language text-xs px-2 py-1 rounded bg-[var(--color-secondary)] text-[var(--color-foreground)] select-none">${language}</div>`
          : ""
      }
    </div>
    <pre class="!p-4 !m-0 overflow-x-auto rounded" style="background: var(--color-code-background); color: var(--color-code-foreground);">
      <code class="language-${validLanguage}">${highlighted}</code>
    </pre>
  </div>
`;
  };

  renderer.codespan = function (text: string) {
    text = text.replace(/^`|`$/g, "");
    return `<code class="inline-code" style="background: var(--color-code-background); color: var(--color-code-foreground);">${text}</code>`;
  };

  renderer.link = function (href, title, text) {
    if (!href) {
      return text;
    }

    const youtubeMatch = href.match(
      /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/
    );

    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return `
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/${videoId}?loop=1&mute=0&playlist=${videoId}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          style="margin:6px 0px; border:none;"
          title="YouTube video player"
        ></iframe>
      `;
    }

    const titleAttr = title ? ` title="${title}"` : "";
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  marked.use({ renderer });

  const safeContent = content || "";
  const htmlContent = safeContent ? marked.parse(safeContent) : "";

  // Special effect for HTML email to sanitize and isolate styles
  useEffect(() => {
    if (isHtmlEmail && containerRef.current) {
      const container = containerRef.current;

      // Isolate the email styles by prefixing them
      const styleElements = container.querySelectorAll("style");
      styleElements.forEach((style) => {
        const originalCss = style.innerHTML;
        const prefixedCss = originalCss.replace(
          /([^{}]+)\{/g,
          (match, selector) => {
            if (selector.trim().startsWith("@")) return match;
            return `.email-container ${selector}{`;
          }
        );
        style.innerHTML = prefixedCss;
      });

      // Remove any potentially conflicting elements
      const headElements = container.querySelectorAll(
        "head, title, meta, link"
      );
      headElements.forEach((el) => el.remove());

      // Fix iframe sources to ensure they're secure
      const iframes = container.querySelectorAll("iframe");
      iframes.forEach((iframe) => {
        const src = iframe.getAttribute("src") || "";
        if (src.startsWith("//")) {
          iframe.setAttribute("src", `https:${src}`);
        } else if (src.startsWith("http://")) {
          iframe.setAttribute("src", src.replace("http://", "https://"));
        }
      });
    }
  }, [isHtmlEmail]);

  // If fullHtml is true, render inside iframe
  useEffect(() => {
    if (fullHtml && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(content);
        doc.close();
      }
    }
  }, [fullHtml, content]);

  // Copy code button click handlers inside container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const copyButtons = container.querySelectorAll<HTMLButtonElement>(
      "button.copy-code-button"
    );

    const handleClick = (event: MouseEvent) => {
      const button = event.currentTarget as HTMLButtonElement;
      const wrapper = button.closest(".code-block-wrapper");
      const codeElement = wrapper?.querySelector("pre code");

      if (!codeElement) return;

      const codeText = codeElement.textContent || "";

      navigator.clipboard.writeText(codeText).then(() => {
        button.classList.add("copied");
        const originalText = button.textContent;
        button.textContent = "Copied!";

        setTimeout(() => {
          button.classList.remove("copied");
          button.textContent = originalText || "Copy";
        }, 2000);
      });
    };

    copyButtons.forEach((button) => {
      button.addEventListener("click", handleClick);
    });

    return () => {
      copyButtons.forEach((button) => {
        button.removeEventListener("click", handleClick);
      });
    };
  }, [htmlContent]);

  // Container classes for non-html-email rendering
  const containerClasses = `message-content ${
    isTruncated ? "message-truncated" : ""
  } ${role === "user" ? "user-message" : "assistant-message"}`;

  if (fullHtml) {
    return (
      <iframe
        ref={iframeRef}
        title="Full HTML content"
        style={{
          width: iframeWidth,
          height: iframeHeight,
          border: "none",
          borderRadius: 8,
          boxShadow: "0 0 10px rgba(0,0,0,0.3)",
        }}
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    );
  }

  if (isHtmlEmail) {
    return (
      <div
        ref={containerRef}
        className="email-container"
        style={{
          maxWidth: "100%",
          overflow: "auto",
          border: "1px solid var(--color-border)",
          borderRadius: "8px",
          padding: "16px",
          backgroundColor: "var(--color-background)",
          color: "var(--color-foreground)",
          margin: "16px 0",
          position: "relative",
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  return (
    <div className={containerClasses}>
      <div
        ref={containerRef}
        className={`prose max-w-none relative ${
          role === "user"
            ? "prose-p:text-[var(--color-foreground)] prose-headings:text-[var(--color-foreground)] prose-strong:text-[var(--color-foreground)] prose-code:text-[var(--color-foreground)]"
            : "prose-p:text-[var(--color-foreground)] prose-headings:text-[var(--color-foreground)] prose-strong:text-[var(--color-foreground)] prose-code:text-[var(--color-foreground)]"
        }`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {isTruncated && (
        <div className="absolute bottom-0 left-0 right-0 text-center py-1 text-xs text-[var(--color-foreground)]">
          Message truncated - click "Continue" to see more
        </div>
      )}
      <style>{`
        /* COMPLETE SYNTAX HIGHLIGHTING RESET AND OVERRIDE */
        .message-content .token {
          background: transparent !important;
          text-shadow: none !important;
          color: var(--color-code-foreground) !important;
        }
        
        /* Syntax token styles using CSS variables */
        .message-content .token.comment,
        .message-content .token.prolog,
        .message-content .token.doctype,
        .message-content .token.cdata {
          color: var(--color-code-comment) !important;
        }
        
        .message-content .token.punctuation {
          color: var(--color-code-punctuation) !important;
        }
        
        .message-content .token.namespace {
          opacity: 0.7 !important;
        }
        
        .message-content .token.property,
        .message-content .token.tag,
        .message-content .token.boolean,
        .message-content .token.number,
        .message-content .token.constant,
        .message-content .token.symbol,
        .message-content .token.deleted {
          color: var(--color-code-property) !important;
        }
        
        .message-content .token.selector,
        .message-content .token.attr-name,
        .message-content .token.string,
        .message-content .token.char,
        .message-content .token.builtin,
        .message-content .token.inserted {
          color: var(--color-code-selector) !important;
        }
        
        .message-content .token.operator,
        .message-content .token.entity,
        .message-content .token.url,
        .message-content .language-css .token.string,
        .message-content .style .token.string {
          color: var(--color-code-operator) !important;
        }
        
        .message-content .token.atrule,
        .message-content .token.attr-value,
        .message-content .token.keyword {
          color: var(--color-code-keyword) !important;
        }
        
        .message-content .token.function,
        .message-content .token.class-name {
          color: var(--color-code-function) !important;
        }
        
        .message-content .token.regex,
        .message-content .token.important,
        .message-content .token.variable {
          color: var(--color-code-variable) !important;
        }
        
        .message-content .token.important,
        .message-content .token.bold {
          font-weight: bold !important;
        }
        
        .message-content .token.italic {
          font-style: italic !important;
        }
        
        .message-content .token.entity {
          cursor: help !important;
        }
        
        /* UI styles */
        .copy-code-button.copied {
          background-color: var(--color-success) !important;
          color: white !important;
        }
        
        .code-block-wrapper pre {
          background: var(--color-code-background) !important;
          color: var(--color-code-foreground) !important;
          padding: 1rem !important;
          border-radius: 0.5rem !important;
        }
        
        .code-block-wrapper code {
          background-color: transparent !important;
          padding: 0 !important;
          font-size: 0.875em !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace !important;
        }
        
        /* Improved inline code styling */
        .message-content .inline-code {
          padding: 0.2em 0.4em !important;
          border-radius: 0.25rem !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace !important;
          background: var(--color-code-background) !important;
          color: var(--color-code-foreground) !important;
        }
        
        .code-language {
          background: var(--color-secondary) !important;
          color: var(--color-foreground) !important;
        }
      `}</style>
    </div>
  );
};

export default MessageContent;
