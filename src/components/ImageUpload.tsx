import { useEffect, useId, useState, type ChangeEvent } from "react";

interface ImageUploadProps {
  /** Visible label; also the accessible name of the file input. */
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  error?: string;
  hint?: string;
  id?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** File picker with an image preview (PDFs show their name only). */
export function ImageUpload({ label, value, onChange, accept, error, hint, id }: ImageUploadProps) {
  const generatedId = useId();
  const inputId = id ?? `upload-${generatedId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create and revoke object URLs for image previews.
  useEffect(() => {
    if (!value || !value.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files?.[0] ?? null);
  }

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-semibold">
        {label}
      </label>
      <div
        className={`mt-1.5 rounded-2xl border border-dashed p-4 transition ${
          error ? "border-destructive bg-destructive/5" : "border-input bg-background/60"
        }`}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          onChange={handleChange}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
        />
        {value && (
          <div className="mt-4 flex items-center gap-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected proof preview"
                className="h-20 w-20 rounded-xl border border-border object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted text-xs font-semibold text-muted-foreground"
              >
                PDF
              </span>
            )}
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-semibold text-foreground">{value.name}</p>
              <p className="text-muted-foreground">{formatBytes(value.size)}</p>
            </div>
          </div>
        )}
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default ImageUpload;
