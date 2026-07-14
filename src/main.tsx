import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageContext";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 拡張機能のポップアップでは再フォーカスごとの自動再取得は不要
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
