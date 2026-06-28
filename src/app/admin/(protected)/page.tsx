import { AdminTopbar } from "@/components/admin/topbar";
import { getCareers, getPhotos, getPosts, getSkills } from "@/lib/api";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [posts, photos, skills, careers] = await Promise.all([
    getPosts(),
    getPhotos(),
    getSkills(),
    getCareers(),
  ]);

  const cards = [
    { num: posts.items.length, label: "公開記事" },
    { num: photos.length, label: "写真" },
    { num: skills.length, label: "スキル" },
    { num: careers.length, label: "経歴" },
  ];

  return (
    <main className="admin__main">
      <AdminTopbar title="ダッシュボード" />

      <div className="cards">
        {cards.map((card) => (
          <div className="card" key={card.label}>
            <div className="num">{card.num}</div>
            <div className="label">{card.label}</div>
          </div>
        ))}
      </div>

      <section style={{ marginTop: "var(--space-6)" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "var(--space-4)" }}>
          最近のブログ
        </h2>
        <table className="table">
          <thead>
            <tr>
              <th>タイトル</th>
              <th>状態</th>
              <th>公開日</th>
            </tr>
          </thead>
          <tbody>
            {posts.items.slice(0, 5).map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>
                  <span className="badge badge--published">published</span>
                </td>
                <td>{formatDate(post.publishedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
