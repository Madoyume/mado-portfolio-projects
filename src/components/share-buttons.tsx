"use client";

import { useEffect, useRef, useState } from "react";
import {
  SHARE_COPY_FEEDBACK_MS,
  SHARE_FACEBOOK_URL,
  SHARE_X_URL,
} from "@/lib/constants";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(
        () => setCopied(false),
        SHARE_COPY_FEEDBACK_MS,
      );
    } catch {}
  }

  const xHref = `${SHARE_X_URL}?${new URLSearchParams({ url, text: title })}`;
  const facebookHref = `${SHARE_FACEBOOK_URL}?${new URLSearchParams({ u: url })}`;

  return (
    <div className="share">
      <a
        className="share__btn"
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Xで共有"
        title="Xで共有"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <a
        className="share__btn"
        href={facebookHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebookで共有"
        title="Facebookで共有"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.5-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z" />
        </svg>
      </a>
      <button
        type="button"
        className="share__btn"
        onClick={copy}
        aria-label="リンクをコピー"
        title="リンクをコピー"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        <span
          className={`share__tooltip${copied ? " is-visible" : ""}`}
          role="status"
        >
          コピーしました
        </span>
      </button>
    </div>
  );
}
