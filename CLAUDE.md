# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## コマンド

ランタイム・パッケージ管理は **Bun**（mise でバージョン固定）。npm/pnpm は使わない。

```bash
bun run docker:db      # ローカル libSQL サーバ起動（要 Docker。初回は db:keygen で鍵生成）
bun run db:migrate     # マイグレーション適用
bun run dev            # 開発サーバ → http://localhost:3000

bun run lint           # ESLint（正確性ルール担当）
bun run format         # Biome（整形・import整理担当。lint とは役割分離）
bun run format:check   # Biome チェックのみ

bun run db:generate    # src/db/schema.ts からマイグレーション生成
bun run db:studio      # Drizzle Studio
```

テストフレームワークは未導入。

## アーキテクチャ

Next.js 16（App Router）に Hono API を統合した単一 Vercel プロジェクト。公開サイト `src/app/(public)/` と認証付き管理画面 `src/app/admin/(protected)/` の2面構成。

### API: Hono RPC の型フロー

- Hono アプリ（`src/server/index.ts`）を `src/app/api/[[...route]]/route.ts` にマウント。
- `src/server/index.ts` と各 `routes/*.ts` は **メソッドチェーンで定義を繋ぐこと**。`AppType = typeof app` の型推論が RPC クライアントの型の源泉であり、チェーンを崩すと型が失われる。
- クライアントは `src/lib/rpc.ts` の `hc<AppType>`。Server Component からは `src/lib/api.ts` の React `cache()` ラッパー経由で呼ぶ。
- API 仕様は `docs/api/openapi.yaml` が契約。**API を変更したら実装と同時に必ず更新する**。

### データの型フロー

Drizzle スキーマ（`src/db/schema.ts`）→ drizzle-zod で入力スキーマ導出（`src/schemas/`）→ ルートで `zValidator` / `zJson`（`src/server/validator.ts`）検証。型の源泉は常に Drizzle スキーマ。

DB は Turso（libSQL）。ローカルは `docker-compose.yml` の libSQL サーバ。**DB には導出不能な最小値のみ保存する**（例: Cloudinary はフル URL でなく public ID の断片を保存し、読み取り時に `src/lib/constants.ts` の定数 + `imageUrl()` で組み立てる）。

### 認証（2層）

1. **管理画面**: 単一管理者トークン（`ADMIN_TOKEN`）でログイン → jose JWT のセッション Cookie 発行（`src/lib/session.ts`）。変更系・下書き取得の API は `requireAuth` ミドルウェア（`src/server/middleware/auth.ts`）必須。公開 GET は認証不要。
2. **サイト全体ゲート**: `src/proxy.ts` の Basic 認証。Vercel preview では常時有効、production では `BASIC_AUTH_ENABLED` で切替。

### 横断ルール

- 定数・設定値は `src/lib/constants.ts` にサブシステム別セクションで集約し、ベタ書きしない。
- 秘密系の環境変数は `process.env` 直読みせず `src/lib/env.ts` の Zod 検証済みゲッター経由で読む。
- 画像は Cloudinary への署名付きブラウザ直接アップロード（`src/server/routes/uploads.ts` が署名発行、`src/lib/upload.ts` がクライアント側）。
- 日時は JST 基準で `src/lib/datetime.ts` を使う。
- 仕様書は `docs/spec/`（Spec 駆動開発）。UI モックは `docs/mock/`。
- スタイルは Tailwind CSS 4。設定は `globals.css` の `@theme` に集約（tailwind.config は不使用）。
