import { useEffect, useId, useRef, useState } from "react";
import { Upload, X } from "lucide-react";

export interface ImageUploadProps {
  /** Visible field label. Defaults to "Proof of bill". */
  label?: string;
  /** Helper text shown under the label. */
  description?: string;
  /** Currently selected file (controlled). */
  value?: File | null;
  /** Called whenever the selected file changes (null when cleared). */
  onChange?: (file: File | null) => void;
  /** Alias of onChange for callers that prefer this name. */
  onFileSelect?: (file: File | null) => void;
  /** Accepted mime types. */
  accept?: string;
  /** Validation error message to display. */
  error?: string | null;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** Max file size in bytes (default 5MB). */
  maxSizeBytes?: number;
  className?: string;
}

const DEFAULT_MAX = 5 * 1024 * 1024;

export function ImageUpload({
  label = "Proof of bill",
  description = "Upload a photo or PDF of the bill (max 5MB).",
  value,
  onChange,
  onFileSelect,
  accept = "image/*,application/pdf",
  error,
  id,
  name = "proof",
  required,
  disabled,
  maxSizeBytes = DEFAULT_MAX,
  className,
}: ImageUploadProps) {
  const generatedId = useId();
  const inputId = id ?? `proof-upload-${generatedId.replace(/:/g, "")}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const file = value !== undefined ? value : internalFile;

  useEffect(() => {
    if (file && file.type.startsWith("image/") && typeof URL !== "undefined" && URL.createObjectURL) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [file]);

  const emit = (next: File | null) => {
    if (value === undefined) setInternalFile(next);
    onChange?.(next);
    onFileSelect?.(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected && selected.size > maxSizeBytes) {
      setLocalError(`File is too large (max ${Math.round(maxSizeBytes / (1024 * 1024))}MB)`);
      e.target.value = "";
      emit(null);
      return;
    }
    setLocalError(null);
    emit(selected);
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    setLocalError(null);
    emit(null);
  };

  const shownError = error || localError;
  const errorId = `${inputId}-error`;

  return (
    <div className={className ?? "space-y-2"} data-testid="proof-upload">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {description ? <p className="text-xs opacity-70">{description}</p> : null}
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-white/20 p-3">
        <Upload className="h-5 w-5 shrink-0 opacity-70" aria-hidden="true" />
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          required={required}
          disabled={disabled}
          onChange={handleChange}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={shownError ? errorId : undefined}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm"
        />
        {file ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Remove proof file"
            className="rounded-md p-1 hover:bg-white/10"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {file ? (
        <p className="text-xs" data-testid="proof-file-name">
          Selected: {file.name}
        </p>
      ) : null}
      {previewUrl ? (
        <img src={previewUrl} alt="Proof of bill preview" className="max-h-40 rounded-md border border-white/10" />
      ) : null}
      {shownError ? (
        <p id={errorId} role="alert" className="text-xs text-red-400">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}

export default ImageUpload;
