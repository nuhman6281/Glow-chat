import React from "react";
import { MessageFormatter } from "../components/chat/MessageFormatter";
import { MessageFormatterDebug } from "../components/chat/MessageFormatterDebug";

export function MessageFormatterTest() {
  const testMessages = [
    "Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
    "Regular text with **bold** and *italic*",
    "```javascript\nconsole.log('hello');\n```",
    "Normal text without any special formatting",
    "Text with @mentions and #hashtags",
    "Simple message :)",
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">MessageFormatter Debug Test</h1>

      {testMessages.map((message, index) => (
        <div key={index} className="mb-6 p-4 border rounded">
          <h3 className="font-medium mb-2">Test {index + 1}:</h3>
          <div className="mb-2 text-sm text-muted-foreground">
            Raw: <code>{message}</code>
          </div>
          <div className="bg-muted p-3 rounded">
            <MessageFormatterDebug content={message} />
          </div>
          <div className="bg-blue-50 p-3 rounded mt-2">
            <h4 className="text-sm font-medium mb-2">Production Version:</h4>
            <MessageFormatter content={message} />
          </div>
        </div>
      ))}
    </div>
  );
}
