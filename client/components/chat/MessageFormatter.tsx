import React from "react";
import { cn } from "../../lib/utils";

interface MessageFormatterProps {
  content: string;
  className?: string;
  onMentionClick?: (username: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  enableEmojis?: boolean;
  enableAutoLinks?: boolean;
  enableMentions?: boolean;
  enableHashtags?: boolean;
  maxPreviewLines?: number;
}

export const MessageFormatter: React.FC<MessageFormatterProps> = ({
  content,
  className,
  onMentionClick,
  onHashtagClick,
  enableEmojis = true,
  enableAutoLinks = true,
  enableMentions = true,
  enableHashtags = true,
  maxPreviewLines,
}) => {
  // Emoji mapping for common text-to-emoji conversions
  const emojiMap: Record<string, string> = {
    ":)": "😊",
    ":-)": "😊",
    ":(": "😢",
    ":-(": "😢",
    ":D": "😃",
    ":-D": "😃",
    ";)": "😉",
    ";-)": "😉",
    ":P": "😛",
    ":-P": "😛",
    ":o": "😮",
    ":-o": "😮",
    ":O": "😱",
    ":-O": "😱",
    ":|": "😐",
    ":-|": "😐",
    "<3": "❤️",
    "</3": "💔",
    ":heart:": "❤️",
    ":fire:": "🔥",
    ":thumbsup:": "👍",
    ":thumbsdown:": "👎",
    ":ok_hand:": "👌",
    ":clap:": "👏",
    ":pray:": "🙏",
    ":muscle:": "💪",
    ":100:": "💯",
    ":check:": "✅",
    ":x:": "❌",
    ":warning:": "⚠️",
    ":bulb:": "💡",
    ":rocket:": "🚀",
    ":star:": "⭐",
    ":party:": "🎉",
    ":thinking:": "🤔",
    ":shrug:": "🤷",
    ":facepalm:": "🤦",
    ":laugh:": "😂",
    ":joy:": "😂",
    ":cry:": "😭",
    ":angry:": "😠",
    ":love:": "😍",
    ":kiss:": "😘",
    ":cool:": "😎",
    ":nerd:": "🤓",
    ":sick:": "😷",
  };

  const formatText = (text: string) => {
    let formattedText = text;

    // Clean the input text first - remove any unwanted characters
    formattedText = formattedText.trim();

    // Escape HTML to prevent injection, but preserve our formatting
    // Only escape the most dangerous characters, leave quotes for later processing
    formattedText = formattedText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // ONLY process code blocks if the text actually contains triple backticks
    if (formattedText.includes("```")) {
      // Code blocks with language detection (multiline) - ONLY match actual triple backticks
      formattedText = formattedText.replace(
        /```(\w*)\n([\s\S]*?)\n```/g,
        (match, lang, code) => {
          const language = lang || "text";
          return `<pre class="bg-muted border border-border text-foreground rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono" data-language="${language}"><code>${code.trim()}</code></pre>`;
        },
      );

      // Single line code blocks - ONLY match actual triple backticks
      formattedText = formattedText.replace(
        /```(\w*)([^`\n]*?)```/g,
        (match, lang, code) => {
          // Only treat as code block if it has a language specified or contains code-like patterns
          if (lang && lang.length > 0) {
            return `<pre class="bg-muted border border-border text-foreground rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono" data-language="${lang}"><code>${code.trim()}</code></pre>`;
          }
          // For content without language, check if it looks like code
          if (
            code.match(/[{}();=<>]/) ||
            code.includes("function") ||
            code.includes("const") ||
            code.includes("let")
          ) {
            return `<pre class="bg-muted border border-border text-foreground rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono" data-language="text"><code>${code.trim()}</code></pre>`;
          }
          // If it doesn't look like code, treat as regular text
          return code.trim();
        },
      );
    }

    // Double backtick (rare, treat as inline code)
    formattedText = formattedText.replace(
      /``([^`\n]+)``/g,
      '<code class="bg-muted border border-border px-1.5 py-0.5 rounded text-xs font-mono">$1</code>',
    );

    // Inline code: single backtick
    formattedText = formattedText.replace(
      /`([^`\n]+)`/g,
      '<code class="bg-muted border border-border px-1 py-0.5 rounded text-xs font-mono">$1</code>',
    );

    // Bold with better conflict handling: **text** or __text__
    formattedText = formattedText.replace(
      /\*\*([^*\n]+)\*\*/g,
      "<strong>$1</strong>",
    );
    formattedText = formattedText.replace(
      /__([^_\n]+)__/g,
      "<strong>$1</strong>",
    );

    // Italic with better conflict handling: *text* or _text_
    formattedText = formattedText.replace(
      /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
      "<em>$1</em>",
    );
    formattedText = formattedText.replace(
      /(?<!_)_([^_\n]+)_(?!_)/g,
      "<em>$1</em>",
    );

    // Strikethrough: ~~text~~
    formattedText = formattedText.replace(
      /~~([^~\n]+)~~/g,
      '<del class="opacity-60">$1</del>',
    );

    // Underline: __text__ (alternative interpretation)
    formattedText = formattedText.replace(/\+\+([^+\n]+)\+\+/g, "<u>$1</u>");

    // Spoiler text: ||text||
    formattedText = formattedText.replace(
      /\|\|([^|\n]+)\|\|/g,
      '<span class="bg-foreground text-background hover:bg-muted hover:text-foreground cursor-pointer select-none transition-colors" title="Click to reveal spoiler">$1</span>',
    );

    // Quote blocks: > text (only at start of line)
    formattedText = formattedText.replace(
      /^&gt;\s+(.+)$/gm,
      '<blockquote class="border-l-4 border-primary pl-3 py-1 my-1 bg-muted/30 italic">$1</blockquote>',
    );

    // Mentions: @username (if enabled)
    if (enableMentions) {
      formattedText = formattedText.replace(
        /@([a-zA-Z0-9_]+)/g,
        (match, username) => {
          const clickHandler = onMentionClick
            ? `onclick="window.handleMentionClick?.('${username}')"`
            : "";
          return `<span class="mention bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-medium cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors" ${clickHandler}>@${username}</span>`;
        },
      );
    }

    // Hashtags: #hashtag (if enabled)
    if (enableHashtags) {
      formattedText = formattedText.replace(
        /#([a-zA-Z0-9_]+)/g,
        (match, hashtag) => {
          const clickHandler = onHashtagClick
            ? `onclick="window.handleHashtagClick?.('${hashtag}')"`
            : "";
          return `<span class="hashtag bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded font-medium cursor-pointer hover:bg-green-200 dark:hover:bg-green-800 transition-colors" ${clickHandler}>#${hashtag}</span>`;
        },
      );
    }

    // Auto-detect URLs (if enabled)
    if (enableAutoLinks) {
      const urlRegex =
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      formattedText = formattedText.replace(
        urlRegex,
        '<a href="$&" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 hover:underline transition-colors">$&</a>',
      );
    }

    // Markdown-style links: [text](url)
    formattedText = formattedText.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 hover:underline transition-colors">$1</a>',
    );

    // Email detection
    formattedText = formattedText.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      '<a href="mailto:$&" class="text-blue-500 hover:text-blue-600 hover:underline transition-colors">$&</a>',
    );

    // Convert text emoticons to emojis (if enabled)
    if (enableEmojis) {
      Object.entries(emojiMap).forEach(([text, emoji]) => {
        const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escapedText}\\b`, "g");
        formattedText = formattedText.replace(regex, emoji);
      });

      // Unicode emoji shortcodes: :emoji_name:
      formattedText = formattedText.replace(
        /:([a-zA-Z0-9_+-]+):/g,
        (match, code) => emojiMap[`:${code}:`] || match,
      );
    }

    // Line breaks
    formattedText = formattedText.replace(/\n/g, "<br />");

    // Clean up multiple consecutive line breaks
    formattedText = formattedText.replace(/(<br\s*\/?>){3,}/g, "<br /><br />");

    return formattedText;
  };

  // Set up global click handlers for mentions and hashtags
  React.useEffect(() => {
    if (onMentionClick) {
      (window as any).handleMentionClick = onMentionClick;
    }
    if (onHashtagClick) {
      (window as any).handleHashtagClick = onHashtagClick;
    }

    return () => {
      delete (window as any).handleMentionClick;
      delete (window as any).handleHashtagClick;
    };
  }, [onMentionClick, onHashtagClick]);

  const formattedContent = formatText(content);

  // Apply line limit if specified
  const shouldTruncate =
    maxPreviewLines && content.split("\n").length > maxPreviewLines;
  const truncatedContent = shouldTruncate
    ? formatText(
        content.split("\n").slice(0, maxPreviewLines).join("\n") + "\n...",
      )
    : formattedContent;

  const [isExpanded, setIsExpanded] = React.useState(false);
  const displayContent =
    shouldTruncate && !isExpanded ? truncatedContent : formattedContent;

  const handleSpoilerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.title?.includes("spoiler")) {
      target.style.backgroundColor = "var(--muted)";
      target.style.color = "var(--foreground)";
      target.title = "";
    }
  };

  return (
    <div
      className={cn(
        "whitespace-pre-wrap break-words message-content",
        className,
      )}
      onClick={handleSpoilerClick}
    >
      <div dangerouslySetInnerHTML={{ __html: displayContent }} />
      {shouldTruncate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-blue-500 hover:text-blue-600 text-sm mt-2 hover:underline transition-colors"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};
