import Link from "next/link";
import { SiteNav } from "./site-nav";

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
        <SiteNav />
      </div>
    </header>
  );
}
