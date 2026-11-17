import { useEffect, useId, useRef, useState } from "react";

export interface ImageUploadProps {
  /** Currently selected file (controlled). */
  value: File | null;
  /** Called with the newly chosen file, or null when cleared. */
  onChange: (file: File | null) => void;
  /** Validation message to show under the field. */
  error?: string;
  /** Visible label for the field. */
  label?: string;
  /** Input id so the label and tests can target it. */
  id?: string;
  /** Accepted MIME types. */
  accept?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * File picker for the proof-of-bill upload. Shows an image preview for
 * image files and the file name/size for anything else (e.g. PDF).
 */
export function ImageUpload({
  value,
  onChange,
  error,
  label = "Proof of bill",
  id = "bill-proof",
  accept = "image/*,application/pdf",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const hintId = useId();
  const errorId = `${id}-error`;

  // Build and revoke an object URL for image previews.
  useEffect(() => {
    if (!value || !value.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_BYTES) {
      setLocalError("File must be 5 MB or smaller");
      onChange(null);
      e.target.value = "";
      return;
    }
    setLocalError(null);
    onChange(file);
  };

  const clear = () => {
    setLocalError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const message = localError ?? error;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleChange}
        aria-describedby={message ? `${hintId} ${errorId}` : hintId}
        aria-invalid={message ? true : undefined}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-purple-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-500"
      />
      <p id={hintId} className="text-xs opacity-70">
        Upload a photo or PDF of the bill (max 5 MB).
      </p>
      {value ? (
        <div className="flex items-center gap-3 rounded-md border border-white/10 p-2" data-testid="proof-selected">
          {previewUrl ? (
            <img src={previewUrl} alt="Proof of bill preview" className="h-14 w-14 rounded object-cover" />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{value.name}</p>
            <p className="text-xs opacity-70">{formatSize(value.size)}</p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="rounded-md border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
          >
            Remove
          </button>
        </div>
      ) : null}
      {message ? (
        <p id={errorId} role="alert" className="text-xs text-red-400">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default ImageUpload;
