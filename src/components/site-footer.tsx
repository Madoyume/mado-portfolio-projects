import { getProfile } from "@/lib/api";
import { currentYear } from "@/lib/format";

export async function SiteFooter() {
  const profile = await getProfile();
  const year = currentYear();
  const links = profile?.socialLinks ?? [];

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span>
          © {year} {profile?.name ?? "Mado"}
        </span>
        <div className="social">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              title={link.label}
            >
              {link.iconUrl ? (
                <>
                  <img
                    src={link.iconUrl}
                    alt={link.label}
                    className="social__icon social__icon--light"
                  />
                  <img
                    src={link.iconUrlDark ?? link.iconUrl}
                    alt={link.label}
                    className="social__icon social__icon--dark"
                  />
                </>
              ) : (
                link.label
              )}
            </a>
          ))}
          {profile?.email && (
            <a href={`mailto:${profile.email}`} title="Mail">
              <img src="/mail.png" alt="Mail" className="social__icon" />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
