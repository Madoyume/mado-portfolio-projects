"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({
  onClose,
  wide,
  children,
}: {
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: wide ? 860 : 480,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 32,
          borderRadius: 12,
          background: "var(--bg)",
          border: "1px solid var(--border)",
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
