import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand" aria-label="Mado">
          <img
            src="/logo-light.png"
            alt="Mado"
            className="brand__logo brand__logo--light"
          />
          <img
            src="/logo-dark.png"
            alt="Mado"
            className="brand__logo brand__logo--dark"
          />
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
