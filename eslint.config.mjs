import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 画像最適化は Cloudinary が担うため plain <img> を許容する。
      "@next/next/no-img-element": "off",
      // クライアントの認証付きマウント時データ取得（async load() を effect で呼ぶ）を許容する。
      // load() は await 後に setState するため同期的な cascading render ではない。
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "docs/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
