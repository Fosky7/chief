import { useEffect, useId, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export interface ImageUploadProps {
  id?: string;
  name?: string;
  label?: string;
  hint?: string;
  error?: string | null;
  accept?: string;
  value?: File | null;
  disabled?: boolean;
  maxSizeMb?: number;
  onChange?: (file: File | null) => void;
  onFileChange?: (file: File | null) => void;
  // Tolerate additional props passed by callers.
  [key: string]: unknown;
}

export function ImageUpload(props: ImageUploadProps) {
  const {
    id,
    name = "proof",
    label = "Proof of bill",
    hint = "Upload a photo or PDF of the bill (max 5 MB).",
    error,
    accept = "image/*,application/pdf",
    value,
    disabled,
    maxSizeMb = 5,
    onChange,
    onFileChange,
  } = props;
  const generatedId = useId();
  const inputId = id ?? `image-upload-${generatedId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const file = value !== undefined ? value : internalFile;
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type?.startsWith("image/")) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const emit = (f: File | null) => {
    setInternalFile(f);
    onChange?.(f);
    onFileChange?.(f);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > maxSizeMb * 1024 * 1024) {
      setLocalError(`File must be smaller than ${maxSizeMb} MB`);
      e.target.value = "";
      emit(null);
      return;
    }
    setLocalError(null);
    emit(f);
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    setLocalError(null);
    emit(null);
  };

  const shownError = error || localError;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 p-4">
        {preview ? (
          <img src={preview} alt="Proof preview" className="h-16 w-16 rounded-lg object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10">
            <Plus className="h-6 w-6 opacity-70" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            id={inputId}
            name={name}
            type="file"
            accept={accept}
            disabled={disabled}
            onChange={handleChange}
            aria-invalid={shownError ? true : undefined}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm"
          />
          <p className="mt-1 truncate text-xs opacity-70">{file ? file.name : hint}</p>
        </div>
        {file && (
          <button
            type="button"
            onClick={clear}
            aria-label="Remove proof file"
            className="rounded-md p-2 hover:bg-white/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {shownError && (
        <p role="alert" className="text-sm text-red-400">
          {shownError}
        </p>
      )}
    </div>
  );
}

export default ImageUpload;
