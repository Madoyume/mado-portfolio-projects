import { GuardedLink } from "@/components/admin/unsaved-guard";
import { ThemeToggle } from "@/components/theme-toggle";

export function AdminTopbar({ title }: { title: string }) {
  return (
    <div className="admin__topbar">
      <h1>{title}</h1>
      <div className="admin__actions">
        <ThemeToggle />
        <GuardedLink href="/" className="btn btn--ghost btn--sm">
          サイトを表示
        </GuardedLink>
      </div>
    </div>
  );
}
