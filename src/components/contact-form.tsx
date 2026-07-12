"use client";

import { useState } from "react";
import {
  CONTACT_COMMENT_MAX,
  CONTACT_EMAIL_MAX,
  CONTACT_NAME_MAX,
} from "@/lib/constants";
import { client } from "@/lib/rpc";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await client.api.contact.$post({
        json: { name, email, comment, website },
      });
      if (res.ok) setDone(true);
      else setError("送信に失敗しました。入力内容を確認してください。");
    } catch {
      setError("送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <p role="status">
        送信しました。お問い合わせありがとうございます。
        <br />
        内容を確認のうえ、必要に応じてご連絡いたします。
      </p>
    );
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="contact-name">Name</label>
        <input
          id="contact-name"
          type="text"
          value={name}
          maxLength={CONTACT_NAME_MAX}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          type="email"
          value={email}
          maxLength={CONTACT_EMAIL_MAX}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="contact-comment">Comment</label>
        <textarea
          id="contact-comment"
          value={comment}
          maxLength={CONTACT_COMMENT_MAX}
          onChange={(e) => setComment(e.target.value)}
          required
        />
      </div>
      <input
        type="text"
        name="website"
        className="visually-hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn" disabled={sending}>
        {sending ? "送信中…" : "SEND"}
      </button>
    </form>
  );
}
