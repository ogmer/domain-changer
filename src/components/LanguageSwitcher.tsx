import React from "react";
import { useLanguage } from "../i18n/LanguageContext";

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  return (
    <select
      value={language}
      onChange={handleLanguageChange}
      className="px-2 py-1 text-xs border rounded bg-white"
      title={language === "ja" ? "Language" : "言語"}
    >
      <option value="ja">日本語</option>
      <option value="en">English</option>
    </select>
  );
};

export default LanguageSwitcher;
