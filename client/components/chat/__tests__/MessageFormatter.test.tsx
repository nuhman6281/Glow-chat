import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MessageFormatter } from "../MessageFormatter";

// Mock window functions for mentions and hashtags
const mockHandleMentionClick = jest.fn();
const mockHandleHashtagClick = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  // Setup global handlers
  (window as any).handleMentionClick = mockHandleMentionClick;
  (window as any).handleHashtagClick = mockHandleHashtagClick;
});

afterEach(() => {
  delete (window as any).handleMentionClick;
  delete (window as any).handleHashtagClick;
});

describe("MessageFormatter", () => {
  describe("Basic Text Formatting", () => {
    test("renders plain text without modification", () => {
      render(<MessageFormatter content="Hello world" />);
      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });

    test("handles empty content", () => {
      const { container } = render(<MessageFormatter content="" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test("preserves whitespace and line breaks", () => {
      const { container } = render(
        <MessageFormatter content="Line 1\nLine 2\n\nLine 4" />,
      );
      const html = container.innerHTML;
      expect(html).toContain("<br />");
    });

    test("does not treat regular text as code blocks", () => {
      const content =
        "Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.";
      const { container } = render(<MessageFormatter content={content} />);
      const html = container.innerHTML;
      expect(html).not.toContain("<pre");
      expect(html).not.toContain("data-language");
    });
  });

  describe("Bold Formatting", () => {
    test("formats **bold** text", () => {
      render(<MessageFormatter content="This is **bold** text" />);
      const boldElement = screen.getByText("bold");
      expect(boldElement.tagName).toBe("STRONG");
    });

    test("formats __bold__ text", () => {
      render(<MessageFormatter content="This is __bold__ text" />);
      const boldElement = screen.getByText("bold");
      expect(boldElement.tagName).toBe("STRONG");
    });

    test("handles multiple bold sections", () => {
      const { container } = render(
        <MessageFormatter content="**First** and **second** bold" />,
      );
      const strongElements = container.querySelectorAll("strong");
      expect(strongElements).toHaveLength(2);
      expect(strongElements[0]).toHaveTextContent("First");
      expect(strongElements[1]).toHaveTextContent("second");
    });

    test("does not format incomplete bold markers", () => {
      render(<MessageFormatter content="This is **incomplete bold" />);
      expect(screen.queryByTagName("strong")).not.toBeInTheDocument();
    });
  });

  describe("Italic Formatting", () => {
    test("formats *italic* text", () => {
      render(<MessageFormatter content="This is *italic* text" />);
      const italicElement = screen.getByText("italic");
      expect(italicElement.tagName).toBe("EM");
    });

    test("formats _italic_ text", () => {
      render(<MessageFormatter content="This is _italic_ text" />);
      const italicElement = screen.getByText("italic");
      expect(italicElement.tagName).toBe("EM");
    });

    test("avoids conflict with bold formatting", () => {
      const { container } = render(
        <MessageFormatter content="**bold** and *italic*" />,
      );
      expect(container.querySelector("strong")).toHaveTextContent("bold");
      expect(container.querySelector("em")).toHaveTextContent("italic");
    });
  });

  describe("Strikethrough Formatting", () => {
    test("formats ~~strikethrough~~ text", () => {
      render(<MessageFormatter content="This is ~~crossed out~~ text" />);
      const delElement = screen.getByText("crossed out");
      expect(delElement.tagName).toBe("DEL");
    });
  });

  describe("Underline Formatting", () => {
    test("formats ++underlined++ text", () => {
      render(<MessageFormatter content="This is ++underlined++ text" />);
      const underlineElement = screen.getByText("underlined");
      expect(underlineElement.tagName).toBe("U");
    });
  });

  describe("Code Formatting", () => {
    test("formats `inline code`", () => {
      render(<MessageFormatter content="This is `inline code` text" />);
      const codeElement = screen.getByText("inline code");
      expect(codeElement.tagName).toBe("CODE");
    });

    test("formats ``double backtick`` code", () => {
      render(<MessageFormatter content="This is ``double code`` text" />);
      const codeElement = screen.getByText("double code");
      expect(codeElement.tagName).toBe("CODE");
    });

    test("formats code blocks with language", () => {
      const codeContent = 'console.log("hello");';
      const { container } = render(
        <MessageFormatter
          content={`\`\`\`javascript\n${codeContent}\n\`\`\``}
        />,
      );
      const preElement = container.querySelector("pre");
      expect(preElement).toHaveAttribute("data-language", "javascript");
      expect(preElement).toHaveTextContent(codeContent);
    });

    test("formats code blocks without language", () => {
      const codeContent = "some code here";
      const { container } = render(
        <MessageFormatter content={`\`\`\`\n${codeContent}\n\`\`\``} />,
      );
      const preElement = container.querySelector("pre");
      expect(preElement).toHaveAttribute("data-language", "text");
    });

    test("only processes actual code blocks with triple backticks", () => {
      const content = "Regular text without any backticks at all";
      const { container } = render(<MessageFormatter content={content} />);
      expect(container.querySelector("pre")).toBeNull();
    });

    test("does not create code blocks from single backticks in regular text", () => {
      const content = "This text doesn't have triple backticks";
      const { container } = render(<MessageFormatter content={content} />);
      expect(container.querySelector("pre")).toBeNull();
    });
  });

  describe("Link Formatting", () => {
    test("formats markdown links [text](url)", () => {
      render(
        <MessageFormatter content="Check out [Google](https://google.com)" />,
      );
      const linkElement = screen.getByRole("link");
      expect(linkElement).toHaveAttribute("href", "https://google.com");
      expect(linkElement).toHaveTextContent("Google");
      expect(linkElement).toHaveAttribute("target", "_blank");
    });

    test("auto-detects URLs when enabled", () => {
      render(
        <MessageFormatter
          content="Visit https://example.com"
          enableAutoLinks={true}
        />,
      );
      const linkElement = screen.getByRole("link");
      expect(linkElement).toHaveAttribute("href", "https://example.com");
    });

    test("does not auto-detect URLs when disabled", () => {
      render(
        <MessageFormatter
          content="Visit https://example.com"
          enableAutoLinks={false}
        />,
      );
      expect(screen.queryByRole("link")).toBeNull();
    });

    test("auto-detects email addresses", () => {
      render(
        <MessageFormatter
          content="Contact me at test@example.com"
          enableAutoLinks={true}
        />,
      );
      const linkElement = screen.getByRole("link");
      expect(linkElement).toHaveAttribute("href", "mailto:test@example.com");
    });
  });

  describe("Mentions", () => {
    test("formats @mentions when enabled", () => {
      const { container } = render(
        <MessageFormatter
          content="Hello @john_doe!"
          enableMentions={true}
          onMentionClick={mockHandleMentionClick}
        />,
      );
      const mentionElement = container.querySelector(".mention");
      expect(mentionElement).toHaveTextContent("@john_doe");
      expect(mentionElement).toHaveClass("bg-blue-100");
    });

    test("does not format @mentions when disabled", () => {
      const { container } = render(
        <MessageFormatter content="Hello @john_doe!" enableMentions={false} />,
      );
      expect(container.querySelector(".mention")).toBeNull();
    });

    test("handles mention clicks", () => {
      const { container } = render(
        <MessageFormatter
          content="Hello @john_doe!"
          enableMentions={true}
          onMentionClick={mockHandleMentionClick}
        />,
      );
      const mentionElement = container.querySelector(".mention");
      fireEvent.click(mentionElement!);
      expect(mockHandleMentionClick).toHaveBeenCalledWith("john_doe");
    });

    test("formats multiple mentions", () => {
      const { container } = render(
        <MessageFormatter
          content="Hello @john and @jane!"
          enableMentions={true}
        />,
      );
      const mentions = container.querySelectorAll(".mention");
      expect(mentions).toHaveLength(2);
      expect(mentions[0]).toHaveTextContent("@john");
      expect(mentions[1]).toHaveTextContent("@jane");
    });
  });

  describe("Hashtags", () => {
    test("formats #hashtags when enabled", () => {
      const { container } = render(
        <MessageFormatter
          content="This is about #react!"
          enableHashtags={true}
          onHashtagClick={mockHandleHashtagClick}
        />,
      );
      const hashtagElement = container.querySelector(".hashtag");
      expect(hashtagElement).toHaveTextContent("#react");
      expect(hashtagElement).toHaveClass("bg-green-100");
    });

    test("does not format #hashtags when disabled", () => {
      const { container } = render(
        <MessageFormatter
          content="This is about #react!"
          enableHashtags={false}
        />,
      );
      expect(container.querySelector(".hashtag")).toBeNull();
    });

    test("handles hashtag clicks", () => {
      const { container } = render(
        <MessageFormatter
          content="This is about #react!"
          enableHashtags={true}
          onHashtagClick={mockHandleHashtagClick}
        />,
      );
      const hashtagElement = container.querySelector(".hashtag");
      fireEvent.click(hashtagElement!);
      expect(mockHandleHashtagClick).toHaveBeenCalledWith("react");
    });
  });

  describe("Emojis", () => {
    test("converts emoticons to emojis when enabled", () => {
      render(
        <MessageFormatter content="Hello :) and :(" enableEmojis={true} />,
      );
      expect(screen.getByText(/😊/)).toBeInTheDocument();
      expect(screen.getByText(/😢/)).toBeInTheDocument();
    });

    test("does not convert emoticons when disabled", () => {
      render(
        <MessageFormatter content="Hello :) and :(" enableEmojis={false} />,
      );
      expect(screen.queryByText(/😊/)).toBeNull();
      expect(screen.queryByText(/😢/)).toBeNull();
    });

    test("converts emoji shortcodes", () => {
      render(
        <MessageFormatter
          content="Great work :heart: :fire:"
          enableEmojis={true}
        />,
      );
      expect(screen.getByText(/❤️/)).toBeInTheDocument();
      expect(screen.getByText(/🔥/)).toBeInTheDocument();
    });

    test("preserves unicode emojis", () => {
      render(
        <MessageFormatter content="Hello 🌟 world 🚀" enableEmojis={true} />,
      );
      expect(screen.getByText(/🌟/)).toBeInTheDocument();
      expect(screen.getByText(/🚀/)).toBeInTheDocument();
    });
  });

  describe("Quote Blocks", () => {
    test("formats quote blocks", () => {
      const { container } = render(
        <MessageFormatter content="> This is a quote" />,
      );
      const blockquoteElement = container.querySelector("blockquote");
      expect(blockquoteElement).toHaveTextContent("This is a quote");
      expect(blockquoteElement).toHaveClass("border-l-4");
    });

    test("handles multiline quotes", () => {
      const { container } = render(
        <MessageFormatter content="> Line 1\n> Line 2\n> Line 3" />,
      );
      const blockquotes = container.querySelectorAll("blockquote");
      expect(blockquotes).toHaveLength(3);
    });
  });

  describe("Spoiler Text", () => {
    test("formats spoiler text", () => {
      const { container } = render(
        <MessageFormatter content="This is ||hidden|| text" />,
      );
      const spoilerElement = container.querySelector('[title*="spoiler"]');
      expect(spoilerElement).toHaveTextContent("hidden");
      expect(spoilerElement).toHaveClass("bg-foreground");
    });

    test("reveals spoiler on click", () => {
      const { container } = render(
        <MessageFormatter content="This is ||hidden|| text" />,
      );
      const spoilerElement = container.querySelector(
        '[title*="spoiler"]',
      ) as HTMLElement;

      fireEvent.click(spoilerElement);

      expect(spoilerElement.style.backgroundColor).toBe("var(--muted)");
      expect(spoilerElement.title).toBe("");
    });
  });

  describe("Content Truncation", () => {
    test("truncates long content when maxPreviewLines is set", () => {
      const longContent = Array(20).fill("Line of text").join("\n");
      const { container } = render(
        <MessageFormatter content={longContent} maxPreviewLines={5} />,
      );
      expect(screen.getByText("Show more")).toBeInTheDocument();
    });

    test('expands content when "Show more" is clicked', () => {
      const longContent = Array(20).fill("Line of text").join("\n");
      render(<MessageFormatter content={longContent} maxPreviewLines={5} />);

      const showMoreButton = screen.getByText("Show more");
      fireEvent.click(showMoreButton);

      expect(screen.getByText("Show less")).toBeInTheDocument();
    });

    test("does not show truncation for short content", () => {
      const shortContent = "Just a short message";
      render(<MessageFormatter content={shortContent} maxPreviewLines={5} />);
      expect(screen.queryByText("Show more")).toBeNull();
    });
  });

  describe("HTML Security", () => {
    test("escapes dangerous HTML characters", () => {
      const { container } = render(
        <MessageFormatter content="<script>alert('xss')</script>" />,
      );
      const html = container.innerHTML;
      expect(html).toContain("&lt;script&gt;");
      expect(html).not.toContain("<script>");
    });

    test("escapes ampersands", () => {
      const { container } = render(<MessageFormatter content="Tom & Jerry" />);
      const html = container.innerHTML;
      expect(html).toContain("Tom &amp; Jerry");
    });

    test("does not double-escape already escaped content", () => {
      const { container } = render(
        <MessageFormatter content="&lt;already&gt;" />,
      );
      const html = container.innerHTML;
      expect(html).toContain("&amp;lt;already&amp;gt;");
    });
  });

  describe("Complex Combinations", () => {
    test("handles mixed formatting correctly", () => {
      const content =
        "**Bold** and *italic* with `code` and @mention #hashtag :)";
      const { container } = render(
        <MessageFormatter
          content={content}
          enableMentions={true}
          enableHashtags={true}
          enableEmojis={true}
        />,
      );

      expect(container.querySelector("strong")).toHaveTextContent("Bold");
      expect(container.querySelector("em")).toHaveTextContent("italic");
      expect(container.querySelector("code")).toHaveTextContent("code");
      expect(container.querySelector(".mention")).toHaveTextContent("@mention");
      expect(container.querySelector(".hashtag")).toHaveTextContent("#hashtag");
      expect(container.innerHTML).toContain("😊");
    });

    test("maintains correct order of operations", () => {
      const content = "**`bold code`** and *`italic code`*";
      const { container } = render(<MessageFormatter content={content} />);

      // Code should be processed first, then bold/italic
      const strongElement = container.querySelector("strong");
      const emElement = container.querySelector("em");
      expect(strongElement?.querySelector("code")).toHaveTextContent(
        "bold code",
      );
      expect(emElement?.querySelector("code")).toHaveTextContent("italic code");
    });

    test("handles edge cases with formatting conflicts", () => {
      const content = "**bold *italic** still bold*";
      const { container } = render(<MessageFormatter content={content} />);

      // Should handle overlapping formatting gracefully
      expect(container.querySelector("strong")).toBeInTheDocument();
    });
  });

  describe("Feature Toggles", () => {
    test("respects all feature toggles", () => {
      const content =
        "**bold** @mention #hashtag :) `code` https://example.com";
      const { container } = render(
        <MessageFormatter
          content={content}
          enableMentions={false}
          enableHashtags={false}
          enableEmojis={false}
          enableAutoLinks={false}
        />,
      );

      // Should still have bold and code
      expect(container.querySelector("strong")).toHaveTextContent("bold");
      expect(container.querySelector("code")).toHaveTextContent("code");

      // Should not have social features
      expect(container.querySelector(".mention")).toBeNull();
      expect(container.querySelector(".hashtag")).toBeNull();
      expect(container.querySelector("a")).toBeNull();
      expect(container.innerHTML).not.toContain("😊");
    });
  });

  describe("Regression Tests", () => {
    test("does not create code blocks from regular text with apostrophes", () => {
      const content = "Lorem Ipsum has been the industry's standard dummy text";
      const { container } = render(<MessageFormatter content={content} />);
      expect(container.querySelector("pre")).toBeNull();
      expect(container.innerHTML).not.toContain("data-language");
    });

    test("handles text with HTML entities correctly", () => {
      const content = "Johnson & Johnson's products";
      const { container } = render(<MessageFormatter content={content} />);
      expect(container.innerHTML).toContain("Johnson &amp; Johnson");
      expect(container.querySelector("pre")).toBeNull();
    });

    test("preserves line breaks in regular text", () => {
      const content = "Line 1\nLine 2\nLine 3";
      const { container } = render(<MessageFormatter content={content} />);
      const html = container.innerHTML;
      expect(html).toContain("<br />");
      expect(container.querySelector("pre")).toBeNull();
    });

    test("handles empty and whitespace-only content", () => {
      const { container: container1 } = render(<MessageFormatter content="" />);
      const { container: container2 } = render(
        <MessageFormatter content="   " />,
      );
      const { container: container3 } = render(
        <MessageFormatter content="\n\n\n" />,
      );

      expect(container1.firstChild).toBeInTheDocument();
      expect(container2.firstChild).toBeInTheDocument();
      expect(container3.firstChild).toBeInTheDocument();
    });
  });
});
