import { getCareers, getProfile, getSkills } from "@/lib/api";
import { formatMonth } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "About" };

export default async function About() {
  const [profile, careers, skills] = await Promise.all([
    getProfile(),
    getCareers(),
    getSkills(),
  ]);

  const categories = new Map<string, typeof skills>();
  for (const skill of skills) {
    const list = categories.get(skill.category) ?? [];
    list.push(skill);
    categories.set(skill.category, list);
  }

  return (
    <main className="container">
      <section className="profile-head">
        {profile?.avatarUrl && (
          <img src={profile.avatarUrl} alt={profile.name} />
        )}
        <div>
          <h1>{profile?.name ?? "Mado"}</h1>
          <p className="muted">{profile?.headline}</p>
          {profile?.bio && (
            <p style={{ marginTop: "var(--space-3)" }}>{profile.bio}</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Career</span>
          <h2>経歴</h2>
        </div>
        <ul className="timeline">
          {careers.map((career) => (
            <li key={career.id}>
              <span className="period">
                {formatMonth(career.startedAt)} –{" "}
                {career.endedAt ? formatMonth(career.endedAt) : "現在"}
              </span>
              <div>
                <h4>{career.company}</h4>
                <p className="role">{career.role}</p>
                {career.description && (
                  <p className="muted" style={{ whiteSpace: "pre-line" }}>
                    {career.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Skills</span>
          <h2>スキル</h2>
        </div>
        <div className="skills-grid">
          {[...categories.entries()].map(([category, list]) => (
            <div className="skill-cat" key={category}>
              <h4>{category}</h4>
              <ul>
                {list.map((skill) => (
                  <li key={skill.id}>
                    <span>{skill.name}</span>
                    {skill.level && (
                      <span className="skill-level">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span
                            key={i}
                            className={i < (skill.level ?? 0) ? "on" : ""}
                          />
                        ))}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
