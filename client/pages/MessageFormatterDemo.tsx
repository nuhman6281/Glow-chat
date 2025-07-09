import React, { useState } from "react";
import { MessageFormatter } from "../components/chat/MessageFormatter";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { useToast } from "../hooks/use-toast";

const demoMessages = [
  {
    title: "Basic Formatting",
    content: `**Bold text** and *italic text*
~~Strikethrough~~ and ++underlined++
\`inline code\` and normal text`,
  },
  {
    title: "Code Blocks",
    content: `Here's some JavaScript code:
\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet('World'));
\`\`\`

And some Python:
\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
\`\`\``,
  },
  {
    title: "Links and URLs",
    content: `Check out [OpenAI](https://openai.com) for AI info.
Auto-detected link: https://github.com/openai/gpt-4
Email contact: support@example.com`,
  },
  {
    title: "Mentions and Hashtags",
    content: `Hey @john_doe and @alice_smith! 
This is about #javascript #react #frontend development.
Don't forget to ping @team_lead about #urgent #deployment issues.`,
  },
  {
    title: "Emojis and Emoticons",
    content: `Traditional emoticons: :) :( :D ;) :P <3 </3
Emoji codes: :heart: :fire: :thumbsup: :rocket: :party: :thinking:
Unicode emojis: 🚀 💻 ⚡ 🎉 💯 🔥`,
  },
  {
    title: "Quotes and Spoilers",
    content: `> This is a quoted message
> It can span multiple lines
> Like this!

Regular text here.

||This is a spoiler text - click to reveal it||
Normal text after spoiler.`,
  },
  {
    title: "Mixed Content",
    content: `**Important announcement** from @admin! 🎉

> The new #feature-release is coming soon!

Check the docs at https://docs.example.com or contact support@company.com

\`\`\`bash
npm install @glow-lab/chat
npm start
\`\`\`

Features include:
- **Real-time** messaging :fire:
- ||Secret dark mode|| :cool:
- @mention support #awesome
- And much more! :rocket:`,
  },
  {
    title: "Long Content (Truncation Demo)",
    content: `This is a very long message that should demonstrate the truncation feature when maxPreviewLines is set.

Line 1 of content
Line 2 of content  
Line 3 of content
Line 4 of content
Line 5 of content
Line 6 of content
Line 7 of content
Line 8 of content
Line 9 of content
Line 10 of content
Line 11 of content - this should be hidden initially
Line 12 of content - this should be hidden initially
Line 13 of content - this should be hidden initially
Line 14 of content - this should be hidden initially
Line 15 of content - this should be hidden initially

**The end** of the long message! :party:`,
  },
];

export function MessageFormatterDemo() {
  const [customContent, setCustomContent] = useState("");
  const { toast } = useToast();

  const handleMentionClick = (username: string) => {
    toast({
      title: "Mention Clicked",
      description: `You clicked on @${username}`,
    });
  };

  const handleHashtagClick = (hashtag: string) => {
    toast({
      title: "Hashtag Clicked",
      description: `You clicked on #${hashtag}`,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">MessageFormatter Demo</h1>
        <p className="text-muted-foreground">
          Comprehensive demonstration of rich text formatting features in the
          chat application.
        </p>
      </div>

      {/* Feature overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Supported Features</CardTitle>
          <CardDescription>
            The MessageFormatter component supports the following formatting
            options:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">**Bold**</Badge>
            <Badge variant="secondary">*Italic*</Badge>
            <Badge variant="secondary">~~Strikethrough~~</Badge>
            <Badge variant="secondary">++Underline++</Badge>
            <Badge variant="secondary">`Code`</Badge>
            <Badge variant="secondary">```Code Blocks```</Badge>
            <Badge variant="secondary">[Links](url)</Badge>
            <Badge variant="secondary">Auto URLs</Badge>
            <Badge variant="secondary">@Mentions</Badge>
            <Badge variant="secondary">#Hashtags</Badge>
            <Badge variant="secondary">:emoji:</Badge>
            <Badge variant="secondary">&gt; Quotes</Badge>
            <Badge variant="secondary">||Spoilers||</Badge>
            <Badge variant="secondary">Email Detection</Badge>
            <Badge variant="secondary">Line Truncation</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Demo examples */}
      <div className="space-y-6 mb-8">
        <h2 className="text-2xl font-semibold">Examples</h2>
        {demoMessages.map((demo, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{demo.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Raw Input:</h4>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                  {demo.content}
                </pre>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Formatted Output:</h4>
                <div className="bg-background border rounded p-4">
                  <MessageFormatter
                    content={demo.content}
                    onMentionClick={handleMentionClick}
                    onHashtagClick={handleHashtagClick}
                    enableEmojis={true}
                    enableAutoLinks={true}
                    enableMentions={true}
                    enableHashtags={true}
                    maxPreviewLines={
                      demo.title.includes("Truncation") ? 8 : undefined
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interactive testing */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Testing</CardTitle>
          <CardDescription>
            Try out your own content with the MessageFormatter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Enter your message content:
            </label>
            <Textarea
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="Try typing: **bold**, @username, #hashtag, :heart:, ||spoiler||, > quote, etc."
              rows={6}
              className="w-full"
            />
          </div>
          <Button
            onClick={() => {
              setCustomContent(demoMessages[6].content);
            }}
            variant="outline"
          >
            Load Example Content
          </Button>
          {customContent && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Live Preview:</h4>
                <div className="bg-background border rounded p-4">
                  <MessageFormatter
                    content={customContent}
                    onMentionClick={handleMentionClick}
                    onHashtagClick={handleHashtagClick}
                    enableEmojis={true}
                    enableAutoLinks={true}
                    enableMentions={true}
                    enableHashtags={true}
                    maxPreviewLines={5}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Implementation notes */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • HTML is escaped to prevent XSS attacks
          </p>
          <p className="text-sm text-muted-foreground">
            • Formatting order matters - code blocks are processed first to
            avoid conflicts
          </p>
          <p className="text-sm text-muted-foreground">
            • Spoiler text reveals on click
          </p>
          <p className="text-sm text-muted-foreground">
            • Mentions and hashtags trigger click handlers
          </p>
          <p className="text-sm text-muted-foreground">
            • Long messages can be truncated with expand/collapse functionality
          </p>
          <p className="text-sm text-muted-foreground">
            • All features can be enabled/disabled via props
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
