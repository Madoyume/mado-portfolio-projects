"use client";

type UploadButtonProps = { label?: string; disabled?: boolean } & (
  | { multiple?: false; onSelect: (file: File) => void }
  | { multiple: true; onSelect: (files: File[]) => void }
);

export function UploadButton(props: UploadButtonProps) {
  const { label = "画像を選択", disabled = false } = props;
  return (
    <label className="btn btn--ghost btn--sm">
      {label}
      <input
        type="file"
        accept="image/*"
        className="visually-hidden"
        multiple={props.multiple}
        disabled={disabled}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length === 0) return;
          if (props.multiple) props.onSelect(files);
          else props.onSelect(files[0]);
        }}
      />
    </label>
  );
}
