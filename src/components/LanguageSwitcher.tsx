import React from "react";
import { useLanguage } from "../i18n/LanguageContext";

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-700">{t.language}</span>
      <select
        value={language}
        onChange={handleLanguageChange}
        className="px-2 py-1 text-xs border rounded bg-white"
        title={language === "ja" ? "Language" : "言語"}
      >
        <option value="ja">日本語</option>
        <option value="en">English</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
