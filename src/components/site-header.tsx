import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          Mado
        </Link>
        <nav className="nav">
          <Link href="/photos">Photos</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/about">About</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
