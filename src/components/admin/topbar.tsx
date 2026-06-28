import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function AdminTopbar({ title }: { title: string }) {
  return (
    <div className="admin__topbar">
      <h1>{title}</h1>
      <div className="admin__actions">
        <ThemeToggle />
        <Link href="/" className="btn btn--ghost btn--sm">
          サイトを表示
        </Link>
      </div>
    </div>
  );
}
