"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { client } from "@/lib/rpc";

const items = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/profile", label: "プロフィール" },
  { href: "/admin/careers", label: "経歴" },
  { href: "/admin/skills", label: "スキル" },
  { href: "/admin/blog", label: "ブログ" },
  { href: "/admin/photos", label: "写真" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function logout() {
    await client.api.auth.logout.$post();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="admin__side">
      <div className="admin__brand">
        Mado<small>Admin</small>
      </div>
      <ul className="admin__nav">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn--ghost btn--sm admin__logout"
        onClick={logout}
      >
        ログアウト
      </button>
    </aside>
  );
}
