"use client";

export function UploadButton({
  onSelect,
  label = "画像を選択",
  disabled = false,
}: {
  onSelect: (file: File) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label className="btn btn--ghost btn--sm">
      {label}
      <input
        type="file"
        accept="image/*"
        className="visually-hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onSelect(file);
        }}
      />
    </label>
  );
}
