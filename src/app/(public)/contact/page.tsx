import { ContactForm } from "@/components/contact-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Contact" };

export default function Contact() {
  return (
    <main className="container">
      <section className="section">
        <div className="section__head">
          <span className="eyebrow">Contact</span>
          <h2>お問い合わせ</h2>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
