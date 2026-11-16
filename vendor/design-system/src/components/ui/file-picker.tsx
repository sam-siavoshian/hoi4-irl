// Choose a file: a dashed tile that opens the system's picker, with what was
// chosen said on it. Moved here from Leads' import dialog
// (components/leads/LeadDialogs.tsx: a hidden native file input, and t3code's
// dashed drop-zone tile on `bg-fill` that names the file once chosen); the
// look is unchanged. The native input stays in the document (screen readers,
// Playwright's setInputFiles) but is visually hidden; `inputProps` reaches it.
// `FileInput` and `FileDropZone` are the Company page's documents
// (components/company/DocumentsSection.tsx): the hidden input a button opens,
// and the dashed zone files are dropped on, moved here unchanged.

import { FileUpIcon } from "lucide-react";
import { type ComponentProps, type DragEvent, type ReactNode, useRef, useState } from "react";

import { cn } from "../../lib/utils";

export function FilePicker({
  accept,
  title,
  hint,
  icon,
  onFile,
  label = "Choose a file",
  inputProps,
  className,
}: {
  /** The input's accept list (".csv,text/csv"). */
  accept?: string;
  /** The tile's first line: the chosen file's name, or what to choose. */
  title: ReactNode;
  /** The second line: a limit, or what was read. */
  hint?: ReactNode;
  /** The tile's icon; an upload glyph by default. */
  icon?: ReactNode;
  onFile: (file: File | undefined) => void;
  /** The native input's spoken name. */
  label?: string;
  /** The native input (data-testid, multiple). */
  inputProps?: Omit<ComponentProps<"input">, "type" | "accept" | "onChange" | "ref" | "className">;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={accept}
        className="sr-only"
        aria-label={label}
        onChange={(event) => onFile(event.currentTarget.files?.[0])}
        {...inputProps}
      />
      <button
        type="button"
        data-slot="file-picker"
        onClick={() => input.current?.click()}
        className={cn(
          "pressable flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-fill/40 px-4 py-4 text-start hover:border-ring/60 hover:bg-fill-hover/60",
          className,
        )}
      >
        {icon ?? <FileUpIcon className="size-5 shrink-0 text-muted-foreground" />}
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">{title}</span>
          {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
        </span>
      </button>
    </>
  );
}

/**
 * The native file input, kept in the document but out of sight (screen
 * readers, Playwright's setInputFiles); a button elsewhere opens it through
 * its ref. `onFiles` hears what was chosen, and the input is emptied so the
 * same file can be chosen again.
 */
export function FileInput({
  ref,
  onFiles,
  ...props
}: Omit<ComponentProps<"input">, "type" | "onChange" | "className"> & {
  onFiles: (files: File[]) => void;
}) {
  return (
    <input
      ref={ref}
      type="file"
      className="sr-only"
      onChange={(event) => {
        const files = Array.from(event.currentTarget.files ?? []);
        event.currentTarget.value = "";
        onFiles(files);
      }}
      {...props}
    />
  );
}

/**
 * Files dropped here: t3code's dashed drop zone, which warms and sinks a
 * little while files are held over it. It only answers a drag that carries
 * files.
 */
export function FileDropZone({
  onFiles,
  children,
  className,
  ...props
}: Omit<ComponentProps<"div">, "onDrop"> & { onFiles: (files: File[]) => void }) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");
  return (
    <div
      data-slot="file-drop-zone"
      data-over={over || undefined}
      {...props}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground transition-[background-color,border-color,scale] duration-(--motion-fast)",
        over && "scale-[0.995] border-ring bg-fill-hover/60 text-foreground",
        className,
      )}
      onDragEnter={(event) => {
        if (!carriesFiles(event)) return;
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(event) => {
        if (carriesFiles(event)) event.preventDefault();
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setOver(false);
      }}
      onDrop={(event) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        depth.current = 0;
        setOver(false);
        onFiles(Array.from(event.dataTransfer.files));
      }}
    >
      {children}
    </div>
  );
}
