"use client";

import {
  type DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Modal } from "@/components/admin/modal";
import { UploadButton } from "@/components/admin/upload-button";
import { HERO_FOLDER } from "@/lib/constants";
import { isSameOrder, moveTo, moveToEdge, shiftSelected } from "@/lib/reorder";
import { client } from "@/lib/rpc";
import { uploadToCloudinary } from "@/lib/upload";

type HeroImage = { id: string; url: string };

function toIds(images: HeroImage[]) {
  return images.map((image) => image.id);
}

function sortByIds(images: HeroImage[], ids: string[]) {
  const byId = new Map(images.map((image) => [image.id, image]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

function hasFiles(e: DragEvent) {
  return e.dataTransfer.types.includes("Files");
}

async function fetchImages() {
  const res = await client.api.profile.$get();
  if (!res.ok) return null;
  const profile = await res.json();
  return profile.heroImages.flatMap((image) =>
    image.url ? [{ id: image.id, url: image.url }] : [],
  );
}

export function HeroImageManager() {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [fileOver, setFileOver] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const imagesRef = useRef<HeroImage[]>([]);
  const dragOrigin = useRef<HeroImage[] | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const latestSave = useRef(0);

  const apply = useCallback((next: HeroImage[]) => {
    imagesRef.current = next;
    setImages(next);
  }, []);

  const reload = useCallback(async () => {
    try {
      const next = await fetchImages();
      if (!next) return;
      apply(next);
      const ids = toIds(next);
      setSelected((prev) => prev.filter((id) => ids.includes(id)));
    } catch {
      setError("ヒーロー画像の取得に失敗しました。");
    }
  }, [apply]);

  useEffect(() => {
    reload();
  }, [reload]);

  const closeConfirm = useCallback(() => setConfirming(false), []);

  function enqueue(task: () => Promise<void>) {
    queue.current = queue.current.then(task);
  }

  function saveOrder(next: HeroImage[]) {
    const saveId = ++latestSave.current;
    apply(next);
    setError("");
    setStatus("並び順を保存中…");
    enqueue(async () => {
      try {
        const res = await client.api.profile["hero-images"].order.$put({
          json: { ids: toIds(next) },
        });
        if (!res.ok) throw new Error();
        if (saveId === latestSave.current) {
          setStatus("並び順を保存しました。");
        }
      } catch {
        if (saveId !== latestSave.current) return;
        setStatus("");
        setError("並び順を保存できませんでした。");
        await reload();
      }
    });
  }

  function reorder(ids: string[]) {
    if (busy || isSameOrder(toIds(imagesRef.current), ids)) return;
    saveOrder(sortByIds(imagesRef.current, ids));
  }

  function upload(files: File[]) {
    if (busy) return;
    const targets = files.filter((file) => file.type.startsWith("image/"));
    setStatus("");
    setError("");
    if (targets.length === 0) {
      setError("画像ファイルを選択してください。");
      return;
    }
    setBusy(true);
    enqueue(async () => {
      let failed = 0;
      for (const [i, file] of targets.entries()) {
        setStatus(`アップロード中… ${i + 1} / ${targets.length}`);
        try {
          const { publicId, version } = await uploadToCloudinary(file, {
            folder: HERO_FOLDER,
          });
          const res = await client.api.profile["hero-images"].$post({
            json: { publicId, version },
          });
          if (!res.ok) throw new Error();
        } catch {
          failed++;
        }
      }
      await reload();
      const added = targets.length - failed;
      setStatus(added > 0 ? `${added}枚を追加しました。` : "");
      if (failed > 0) setError(`${failed}枚の追加に失敗しました。`);
      setBusy(false);
    });
  }

  function removeSelected() {
    if (busy) return;
    const targets = selected;
    setConfirming(false);
    setError("");
    setStatus("削除中…");
    setBusy(true);
    enqueue(async () => {
      let failed = 0;
      for (const id of targets) {
        try {
          const res = await client.api.profile["hero-images"][":id"].$delete({
            param: { id },
          });
          if (!res.ok) throw new Error();
        } catch {
          failed++;
        }
      }
      await reload();
      const removed = targets.length - failed;
      setStatus(removed > 0 ? `${removed}枚を削除しました。` : "");
      if (failed > 0) setError(`${failed}枚の削除に失敗しました。`);
      setBusy(false);
    });
  }

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function startDrag(e: DragEvent, id: string) {
    if (busy) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    dragOrigin.current = imagesRef.current;
    setDraggingId(id);
  }

  function dragOverTile(targetId: string) {
    if (!dragOrigin.current || !draggingId || draggingId === targetId) return;
    const ids = toIds(imagesRef.current);
    const next = moveTo(ids, draggingId, ids.indexOf(targetId));
    apply(sortByIds(imagesRef.current, next));
  }

  function dropTile(e: DragEvent) {
    const origin = dragOrigin.current;
    if (!origin) return;
    e.preventDefault();
    e.stopPropagation();
    dragOrigin.current = null;
    setDraggingId(null);
    if (!isSameOrder(toIds(origin), toIds(imagesRef.current))) {
      saveOrder(imagesRef.current);
    }
  }

  function endDrag() {
    if (dragOrigin.current) apply(dragOrigin.current);
    dragOrigin.current = null;
    setDraggingId(null);
  }

  const ids = toIds(images);
  const moves = [
    { label: "先頭へ", next: moveToEdge(ids, selected, "start") },
    { label: "前へ", next: shiftSelected(ids, selected, "backward") },
    { label: "次へ", next: shiftSelected(ids, selected, "forward") },
    { label: "末尾へ", next: moveToEdge(ids, selected, "end") },
  ];

  return (
    <section
      className={`panel hero-manager${fileOver ? " is-file-over" : ""}`}
      aria-label="ヒーロー画像"
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setFileOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFileOver(false);
        }
      }}
      onDrop={(e) => {
        setFileOver(false);
        if (!hasFiles(e)) return;
        e.preventDefault();
        upload(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="hero-manager__head">
        <h2>
          ヒーロー画像<span className="muted">{images.length}枚</span>
        </h2>
        <UploadButton
          label="画像を追加"
          multiple
          disabled={busy}
          onSelect={upload}
        />
      </div>

      <div className="hero-manager__info">
        <p className="muted">ドラッグで並べ替え・クリックで選択</p>
        <p role="status">{status}</p>
        {error && (
          <p className="hero-manager__error" role="alert">
            {error}
          </p>
        )}
      </div>

      {images.length > 0 ? (
        <ol
          className="hero-manager__grid"
          onDragOver={(e) => {
            if (!draggingId) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={dropTile}
        >
          {images.map((image, index) => {
            const isSelected = selected.includes(image.id);
            return (
              <li
                key={image.id}
                className={draggingId === image.id ? "is-dragging" : undefined}
                draggable={!busy}
                onDragStart={(e) => startDrag(e, image.id)}
                onDragEnter={() => dragOverTile(image.id)}
                onDragEnd={endDrag}
              >
                <div
                  className="hero-manager__tile"
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`${index + 1}枚目のヒーロー画像`}
                  onClick={() => toggle(image.id)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    toggle(image.id);
                  }}
                >
                  <img
                    src={image.url}
                    alt=""
                    draggable={false}
                    loading="lazy"
                  />
                  <span className="hero-manager__order" aria-hidden="true">
                    {index + 1}
                  </span>
                  {isSelected && (
                    <span className="hero-manager__check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="muted">画像がありません。</p>
      )}

      <div
        className={`hero-manager__toolbar${
          selected.length > 0 ? " is-active" : ""
        }`}
      >
        <span className="hero-manager__count">{selected.length}枚を選択中</span>
        {moves.map((move) => (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            key={move.label}
            disabled={busy || isSameOrder(ids, move.next)}
            onClick={() => reorder(move.next)}
          >
            {move.label}
          </button>
        ))}
        <button
          type="button"
          className="btn btn--danger btn--sm"
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          削除
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setSelected([])}
        >
          選択解除
        </button>
      </div>

      {confirming && (
        <Modal onClose={closeConfirm}>
          <div className="modal__head">
            <h2>削除の確認</h2>
          </div>
          <p className="modal__description">
            選択した{selected.length}
            枚のヒーロー画像を削除します。この操作は元に戻せません。
          </p>
          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={closeConfirm}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={removeSelected}
            >
              削除する
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
