import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MessageTranslationProps {
  originalText: string;
  onClose?: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "tr", name: "Turkish" },
];

export const MessageTranslation: React.FC<MessageTranslationProps> = ({
  originalText,
  onClose,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const translateText = async () => {
    if (!selectedLanguage || !originalText) return;

    setIsTranslating(true);
    try {
      // TODO: Implement actual translation API
      // For now, we'll simulate translation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate translation result
      const mockTranslations: Record<string, string> = {
        es: `[Traducido al español] ${originalText}`,
        fr: `[Traduit en français] ${originalText}`,
        de: `[Ins Deutsche übersetzt] ${originalText}`,
        it: `[Tradotto in italiano] ${originalText}`,
        pt: `[Traduzido para português] ${originalText}`,
        ru: `[Переведено на русский] ${originalText}`,
        ja: `[日本語に翻訳] ${originalText}`,
        ko: `[한국어로 번역] ${originalText}`,
        zh: `[翻译成中文] ${originalText}`,
        ar: `[مترجم إلى العربية] ${originalText}`,
        hi: `[हिंदी में अनुवादित] ${originalText}`,
        tr: `[Türkçeye çevrildi] ${originalText}`,
      };

      setTranslatedText(mockTranslations[selectedLanguage] || originalText);
      toast.success("Translation completed");
    } catch (error) {
      toast.error("Failed to translate message");
    } finally {
      setIsTranslating(false);
    }
  };

  const copyTranslation = () => {
    if (translatedText) {
      navigator.clipboard.writeText(translatedText);
      toast.success("Translation copied to clipboard");
    }
  };

  return (
    <div className="p-3 bg-muted/50 rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <Languages className="w-4 h-4" />
        <span className="text-sm font-medium">Translate Message</span>
      </div>

      {/* Original text */}
      <div>
        <p className="text-xs text-muted-foreground mb-1">Original:</p>
        <p className="text-sm bg-background p-2 rounded">{originalText}</p>
      </div>

      {/* Language selector */}
      <div className="flex items-center gap-2">
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={translateText}
          disabled={!selectedLanguage || isTranslating}
        >
          {isTranslating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Translate"
          )}
        </Button>
      </div>

      {/* Translated text */}
      {translatedText && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Translation:</p>
          <div className="bg-background p-2 rounded">
            <p className="text-sm mb-2">{translatedText}</p>
            <Button size="sm" variant="outline" onClick={copyTranslation}>
              Copy
            </Button>
          </div>
        </div>
      )}

      {/* Close button */}
      {onClose && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
};
