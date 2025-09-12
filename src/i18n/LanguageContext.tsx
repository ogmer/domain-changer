import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Translations } from "./translations";

// 環境に基づく言語検出のヘルパー関数
const detectLanguageFromEnvironment = (): string => {
  console.log("[LanguageContext] Starting language detection...");

  // 1. Chrome拡張機能の環境の場合、Chrome APIを使用
  if (typeof chrome !== "undefined" && chrome.i18n) {
    const chromeLang = chrome.i18n.getUILanguage();
    const chromeLangCode = chromeLang.split("-")[0];
    console.log(
      `[LanguageContext] Chrome UI language: ${chromeLang} -> ${chromeLangCode}`
    );
    if (translations[chromeLangCode]) {
      console.log(`[LanguageContext] Using Chrome language: ${chromeLangCode}`);
      return chromeLangCode;
    }
  }

  // 2. ブラウザの言語設定を確認
  const browserLang = navigator.language.split("-")[0];
  console.log(
    `[LanguageContext] Browser language: ${navigator.language} -> ${browserLang}`
  );
  if (translations[browserLang]) {
    console.log(`[LanguageContext] Using browser language: ${browserLang}`);
    return browserLang;
  }

  // 3. ブラウザの言語がサポートされていない場合、navigator.languagesを確認
  if (navigator.languages) {
    console.log(
      `[LanguageContext] Available languages: ${navigator.languages.join(", ")}`
    );
    for (const lang of navigator.languages) {
      const langCode = lang.split("-")[0];
      if (translations[langCode]) {
        console.log(`[LanguageContext] Using available language: ${langCode}`);
        return langCode;
      }
    }
  }

  // 4. タイムゾーンから推測（簡易的な地域検出）
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(`[LanguageContext] Timezone: ${timezone}`);
    if (timezone.includes("Tokyo") || timezone.includes("Asia/Tokyo")) {
      console.log("[LanguageContext] Using timezone-based detection: ja");
      return "ja";
    }
    if (timezone.includes("America") || timezone.includes("Europe")) {
      console.log("[LanguageContext] Using timezone-based detection: en");
      return "en";
    }
  } catch (e) {
    console.log("[LanguageContext] Timezone detection failed:", e);
  }

  // 5. デフォルトは日本語
  console.log("[LanguageContext] Using default language: ja");
  return "ja";
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<string>(() => {
    // 1. まずlocalStorageから保存された言語設定を確認
    const savedLanguage = localStorage.getItem("domain-replacer-language");
    if (savedLanguage && translations[savedLanguage]) {
      console.log(`[LanguageContext] Using saved language: ${savedLanguage}`);
      return savedLanguage;
    }

    // 2. 環境から言語を検出
    const detectedLanguage = detectLanguageFromEnvironment();
    console.log(
      `[LanguageContext] Detected language from environment: ${detectedLanguage}`
    );
    return detectedLanguage;
  });

  const t = translations[language] || translations.ja;

  useEffect(() => {
    // 言語設定をlocalStorageに保存
    localStorage.setItem("domain-replacer-language", language);
    console.log(`[LanguageContext] Language changed to: ${language}`);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
