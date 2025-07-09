import React from "react";
import { cn } from "../../lib/utils";

interface MessageFormatterDebugProps {
  content: string;
  className?: string;
}

export const MessageFormatterDebug: React.FC<MessageFormatterDebugProps> = ({
  content,
  className,
}) => {
  console.log("=== MessageFormatter Debug ===");
  console.log("Original content:", JSON.stringify(content));
  console.log("Content length:", content.length);
  console.log("Contains backticks:", content.includes("`"));
  console.log("Contains triple backticks:", content.includes("```"));

  // Show character codes for debugging
  const charCodes = content
    .split("")
    .map((char, i) => `${i}: ${char} (${char.charCodeAt(0)})`)
    .join("\n");
  console.log("Character breakdown:", charCodes);

  const formatText = (text: string) => {
    let formattedText = text;
    console.log("Step 1 - Original:", JSON.stringify(formattedText));

    // Clean the input text first
    formattedText = formattedText.trim();
    console.log("Step 2 - Trimmed:", JSON.stringify(formattedText));

    // Escape HTML
    formattedText = formattedText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    console.log("Step 3 - HTML escaped:", JSON.stringify(formattedText));

    // Check for backticks
    console.log("Has backticks after escape:", formattedText.includes("`"));
    console.log(
      "Has triple backticks after escape:",
      formattedText.includes("```"),
    );

    // Bold: **text**
    formattedText = formattedText.replace(
      /\*\*([^*\n]+)\*\*/g,
      "<strong>$1</strong>",
    );
    console.log("Step 4 - Bold processed:", JSON.stringify(formattedText));

    // Italic: *text*
    formattedText = formattedText.replace(
      /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
      "<em>$1</em>",
    );
    console.log("Step 5 - Italic processed:", JSON.stringify(formattedText));

    // Line breaks
    formattedText = formattedText.replace(/\n/g, "<br />");
    console.log("Step 6 - Line breaks:", JSON.stringify(formattedText));

    console.log("Final result:", JSON.stringify(formattedText));
    return formattedText;
  };

  const formattedContent = formatText(content);

  return (
    <div
      className={cn(
        "whitespace-pre-wrap break-words message-content",
        className,
      )}
    >
      <div
        style={{
          backgroundColor: "#f0f0f0",
          padding: "8px",
          marginBottom: "8px",
          fontSize: "12px",
        }}
      >
        <strong>Debug Info:</strong>
        <br />
        Original: <code>{JSON.stringify(content)}</code>
        <br />
        Length: {content.length}
        <br />
        Has backticks: {content.includes("`") ? "YES" : "NO"}
        <br />
        Has triple backticks: {content.includes("```") ? "YES" : "NO"}
      </div>
      <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
    </div>
  );
};
