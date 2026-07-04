"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ComponentProps,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Modal } from "@/components/admin/modal";

type Guard = { isDirty: () => boolean; save: () => Promise<boolean> };

type GuardCtx = {
  setGuard: (guard: Guard | null) => void;
  isBlocking: () => boolean;
  run: (action: () => void) => void;
};

const Context = createContext<GuardCtx | null>(null);

export function useUnsavedGuard() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("UnsavedGuardProvider がありません");
  return ctx;
}

export function GuardedLink({
  onNavigate,
  ...props
}: ComponentProps<typeof Link>) {
  const { isBlocking, run } = useUnsavedGuard();
  const router = useRouter();
  return (
    <Link
      {...props}
      onNavigate={(e) => {
        if (isBlocking()) {
          e.preventDefault();
          run(() => router.push(props.href.toString()));
        }
        onNavigate?.(e);
      }}
    />
  );
}

export function UnsavedGuardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const guardRef = useRef<Guard | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setGuard = useCallback((guard: Guard | null) => {
    guardRef.current = guard;
  }, []);

  const isBlocking = useCallback(
    () => !!guardRef.current?.isDirty(),
    [],
  );

  const run = useCallback((action: () => void) => {
    if (guardRef.current?.isDirty()) {
      pendingRef.current = action;
      setError("");
      setOpen(true);
    } else {
      action();
    }
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (guardRef.current?.isDirty()) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  function proceed() {
    const action = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    action?.();
  }

  async function saveAndLeave() {
    const guard = guardRef.current;
    if (!guard) return proceed();
    setSaving(true);
    setError("");
    try {
      const ok = await guard.save();
      if (ok) proceed();
      else
        setError(
          "保存に失敗しました。slug・タイトル・本文を確認してください。",
        );
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    pendingRef.current = null;
    setOpen(false);
  }

  return (
    <Context.Provider value={{ setGuard, isBlocking, run }}>
      {children}
      {open && (
        <Modal onClose={cancel}>
          <h2 style={{ fontSize: "1.2rem" }}>編集中の記事を保存しますか？</h2>
          <p className="muted" style={{ marginTop: "var(--space-2)" }}>
            保存してから画面を移動します。
          </p>
          {error && (
            <p className="form-error" style={{ marginTop: "var(--space-3)" }}>
              {error}
            </p>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 24,
            }}
          >
            <button
              type="button"
              className="btn"
              disabled={saving}
              onClick={saveAndLeave}
            >
              {saving ? "保存中…" : "はい（保存して移動）"}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={saving}
              onClick={proceed}
            >
              いいえ（保存せず移動）
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={saving}
              onClick={cancel}
            >
              キャンセル
            </button>
          </div>
        </Modal>
      )}
    </Context.Provider>
  );
}
