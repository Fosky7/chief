import { useEffect, useId, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  MAX_PROOF_BYTES,
  MAX_PROOF_FILES,
  PROOF_ACCEPT,
  PROOF_ALLOWANCE_HINT,
  formatFileSize,
} from "@/types";

export interface ImageUploadProps {
  /** Currently selected file (single-file mode, controlled). */
  value?: File | null;
  /** Called with the newly chosen file, or null when cleared (single-file mode). */
  onChange?: (file: File | null) => void;
  /** Currently selected files (multi-file mode, controlled). */
  files?: File[];
  /** Called with the updated list; providing it enables multi-file mode. */
  onFilesChange?: (files: File[]) => void;
  /** Maximum number of files in multi-file mode. Defaults to 3. */
  maxFiles?: number;
  /** Validation message to show under the field. */
  error?: string;
  /** Visible label for the field. */
  label?: string;
  /** Input id so the label and tests can target it. */
  id?: string;
  /** Accepted MIME types. */
  accept?: string;
}

/** One selected proof file, shown as a removable thumbnail row. */
function ProofFileThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const ext = (file.name.split(".").pop() || "file").toUpperCase();

  return (
    <li
      data-testid="proof-selected"
      className="flex items-center gap-3 rounded-xl border border-border bg-background p-2 text-foreground"
    >
      {previewUrl ? (
        <img src={previewUrl} alt={`Preview of ${file.name}`} className="h-14 w-14 rounded object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
        >
          {ext.slice(0, 4)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="rounded-md border border-border p-1.5 text-foreground hover:bg-muted"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}

/**
 * File picker for proof-of-bill uploads.
 *
 * - Single-file mode: pass `value` + `onChange`.
 * - Multi-file mode: pass `files` + `onFilesChange` to allow up to three files.
 *
 * Every file is capped at 5 MB and the list is capped at three, both enforced
 * by the shared allowance in `@/types` so the rules never drift between screens.
 */
export function ImageUpload({
  value = null,
  onChange,
  files,
  onFilesChange,
  maxFiles = MAX_PROOF_FILES,
  error,
  label = "Proof of bill",
  id = "bill-proof",
  accept = PROOF_ACCEPT,
}: ImageUploadProps) {
  const multi = typeof onFilesChange === "function";
  const limit = Math.min(Math.max(1, maxFiles), MAX_PROOF_FILES);
  const selected: File[] = multi ? (files ?? []) : value ? [value] : [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const hintId = useId();
  const errorId = `${id}-error`;

  const emit = (next: File[]) => {
    const kept = next.slice(0, limit);
    if (multi) onFilesChange?.(kept);
    else onChange?.(kept[0] ?? null);
  };

  const limitMessage = `You can attach up to ${limit} proof files. Remove one to continue.`;

  /**
   * Adds the chosen files, refusing anything over 5 MB and anything beyond the
   * three-file allowance. Refused files never enter the selection, and the
   * reason is always shown under the field.
   */
  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    const messages: string[] = [];
    const accepted: File[] = [];
    const room = multi ? Math.max(0, limit - selected.length) : 1;
    for (const file of incoming) {
      if (file.size > MAX_PROOF_BYTES) {
        messages.push(`${file.name} is ${formatFileSize(file.size)} — each file must be 5 MB or smaller.`);
        continue;
      }
      if (accepted.length >= room) {
        if (!messages.includes(limitMessage)) messages.push(limitMessage);
        continue;
      }
      accepted.push(file);
    }
    setLocalError(messages[0] ?? null);
    if (accepted.length === 0) return;
    emit(multi ? [...selected, ...accepted] : accepted);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = "";
    addFiles(chosen);
  };

  const removeAt = (index: number) => {
    setLocalError(null);
    emit(selected.filter((_, i) => i !== index));
    if (inputRef.current) inputRef.current.value = "";
  };

  const message = localError ?? error ?? null;
  const hint = multi
    ? limit === MAX_PROOF_FILES
      ? PROOF_ALLOWANCE_HINT
      : `Up to ${limit} files, 5 MB each (photo or PDF).`
    : "Upload a photo or PDF of the bill (max 5 MB).";

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multi}
        onChange={handleChange}
        aria-describedby={message ? `${hintId} ${errorId}` : hintId}
        aria-invalid={message ? true : undefined}
        className="block w-full rounded-xl border border-border bg-background p-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-purple-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-500"
      />
      <p id={hintId} className="text-sm text-muted-foreground">
        {hint}
      </p>
      {selected.length > 0 ? (
        <ul className="space-y-2" data-testid="proof-list">
          {selected.map((file, index) => (
            <ProofFileThumb
              key={`${file.name}-${file.size}-${index}`}
              file={file}
              onRemove={() => removeAt(index)}
            />
          ))}
        </ul>
      ) : null}
      {message ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-rose-600 dark:text-rose-400">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default ImageUpload;
