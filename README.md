# mado-portfolio

窓のポートフォリオサイト。
公開サイト（トップ / About / 写真ギャラリー / ブログ）と、コンテンツを管理する認証付き管理画面（`/admin`）で構成。

## 技術スタック

| 領域           | 採用技術                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| ランタイム     | Bun                                                                                                      |
| フレームワーク | Next.js 16（App Router / Turbopack）・React 19                                                           |
| API            | Hono 4 を Next の Route Handler（`/api/[[...route]]`）にマウント。型付き RPC クライアントで呼び出し      |
| DB             | Turso（libSQL / SQLite）＋ Drizzle ORM ＋ drizzle-zod。ローカルは Docker の libSQL サーバ                |
| 画像           | Cloudinary（署名付きブラウザ直接アップロード）                                                           |
| 認証           | 単一管理者トークン ＋ セッション Cookie（jose / JWT）。プレビュー等は Basic 認証ゲート（`src/proxy.ts`） |
| Markdown       | react-markdown ＋ remark-gfm / remark-breaks / rehype-highlight                                          |
| スタイル       | Tailwind CSS 4 ＋ next-themes（ダーク / ライト）                                                         |
| 品質           | ESLint（lint）・Biome（format）                                                                          |
| デプロイ       | Vercel（dev / prod）・GitHub Actions（CI → migrate → deploy）                                            |

## プロジェクト構成

```
src/
  app/
    (public)/          公開ページ（/・about・photos・blog・blog/[slug]）
    admin/             管理画面（login・(protected)/ 配下: dashboard・profile・careers・skills・blog・photos）
    api/[[...route]]/  Hono アプリのマウント先
    layout.tsx / sitemap.ts / robots.ts
  server/              Hono アプリ（index.ts・routes/・middleware/auth・validator）
  db/                  Drizzle（schema.ts・client.ts）
  schemas/             drizzle-zod による入力スキーマ（post・photo・career・skill・profile）
  lib/                 共有モジュール（constants・datetime・format・cloudinary・photo・upload・api・rpc・session・site）
  components/          UI（公開・admin/・共通）
  proxy.ts             Basic 認証ゲート
drizzle/               マイグレーション
docker-compose.yml     ローカル libSQL サーバ定義
scripts/               ユーティリティ
```

## 環境構築

前提: **Bun** と **Docker** がインストール済みであること。

```bash
# 依存インストール
bun install

# ローカル DB（libSQL）を起動
bun run docker:db

# マイグレーション適用
bun run db:migrate

# 開発サーバ起動 → http://localhost:3000
bun run dev
```

管理画面は `http://localhost:3000/admin/login` からログインする。

## スクリプト

| コマンド                            | 内容                             |
| ----------------------------------- | -------------------------------- |
| `bun run dev`                       | 開発サーバ（Turbopack）          |
| `bun run build` / `bun run start`   | 本番ビルド / 起動                |
| `bun run lint`                      | ESLint                           |
| `bun run format` / `format:check`   | Biome による整形 / チェック      |
| `bun run db:generate`               | スキーマからマイグレーション生成 |
| `bun run db:migrate`                | マイグレーション適用             |
| `bun run db:push`                   | スキーマを直接反映（開発用）     |
| `bun run db:studio`                 | Drizzle Studio                   |
| `bun run db:keygen`                 | ローカル libSQL 用の鍵を生成     |
| `bun run docker:db` / `docker:down` | ローカル libSQL の起動 / 停止    |

## デプロイ

Vercel にデプロイ。GitHub Actions（`.github/workflows/deploy-dev.yml` / `deploy-prod.yml`）で **CI（lint・型チェック・build）→ マイグレーション → デプロイ** を実行する。
