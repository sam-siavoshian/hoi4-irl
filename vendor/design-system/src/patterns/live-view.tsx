// A live view of a page in a browser somewhere else (the owner's Lanes computer): its frame,
// scaled to fit and kept to the page's own shape, with the owner's pointer, wheel and keys
// mapped to the page's own CSS pixels and handed to `onInput`. Nothing typed is kept here: a
// key goes out as it is pressed, and the phone's field is emptied the moment it is sent.
//
// * `state`: `loading` (no frame yet), `live`, `stale` (the last frame is old: the picture
//   dims and says so), `closed` (the view ended: a timeout, Done). Each but `live` lays its
//   `status` words over the frame, on the sky's glass.
// * `keyboard`: the field and keys under the frame for a phone, where pressing the picture
//   opens no keyboard: `auto` (a coarse pointer), `always`, `never`.
// * `mode`: `control` (the owner works the page) or `view` (view only: watching agents at a
//   site's desk; nothing the owner does reaches the page, and a "View only" badge says so).
// * `paused`: the picture is held back on purpose (the owner is signing in there, so nobody
//   watches): it dims and says so, with no spinner.
//
// Lanes: signing in to any site on the Lanes computer (components/connections/SiteSignInDialog.tsx).

import { CornerDownLeftIcon, DeleteIcon, EyeIcon, EyeOffIcon, SendIcon } from "lucide-react";
import {
  type ClipboardEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type WheelEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "../lib/utils";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { IconButton } from "../components/ui/icon-button";
import { Input } from "../components/ui/input";
import { Spinner } from "../components/ui/spinner";

export type LiveViewInput =
  | { type: "down" | "up" | "move"; x: number; y: number; button: "left" | "right" | "middle"; count: number }
  | { type: "wheel"; x: number; y: number; dx: number; dy: number }
  | { type: "text"; text: string }
  | { type: "key"; key: string };

export type LiveViewState = "loading" | "live" | "stale" | "paused" | "closed";

export type LiveViewMode = "control" | "view";

/** The keys a live view passes on by name; anything printable goes as text. */
export const LIVE_VIEW_KEYS = new Set([
  "Enter", "Tab", "Backspace", "Delete", "Escape", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
  "Home", "End", "PageUp", "PageDown",
]);

const BUTTONS = ["left", "middle", "right"] as const;

/** Where a pointer is on the page, in its own CSS pixels, from where it is on the picture. */
export function pagePoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  viewport: { width: number; height: number },
): { x: number; y: number } {
  const clamp = (value: number, max: number) => Math.max(0, Math.min(max - 1, value));
  return {
    x: Math.round(clamp(((clientX - rect.left) / Math.max(1, rect.width)) * viewport.width, viewport.width)),
    y: Math.round(clamp(((clientY - rect.top) / Math.max(1, rect.height)) * viewport.height, viewport.height)),
  };
}

/** A key press as the live view passes it on, or null for one it leaves alone. */
export function keyInput(event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}): LiveViewInput | null {
  const { key } = event;
  const command = event.ctrlKey || event.metaKey;
  if (key.length === 1 && !command && !event.altKey) return { type: "text", text: key };
  if (key.length === 1 && command && key.toLowerCase() === "a") return { type: "key", key: `${event.metaKey ? "Meta" : "Control"}+a` };
  if (LIVE_VIEW_KEYS.has(key)) return { type: "key", key: event.shiftKey && key === "Tab" ? "Shift+Tab" : key };
  return null;
}

export function LiveView({
  src,
  viewport,
  state,
  label,
  status,
  onInput: given,
  keyboard = "auto",
  disabled = false,
  mode = "control",
  className,
  ...props
}: {
  /** The frame now (an object URL), or null before the first. */
  src: string | null;
  /** The page's own size, in CSS pixels: what the frame shows, and what a pointer maps to. */
  viewport: { width: number; height: number };
  state: LiveViewState;
  /** The view's spoken name ("Reddit's sign-in page, on your Lanes computer"). */
  label: string;
  /** The words over the frame while it is not live. */
  status?: ReactNode;
  /** Where the owner's input goes; never called in `view` mode. */
  onInput?: (event: LiveViewInput) => void;
  keyboard?: "auto" | "always" | "never";
  /** `control`: the owner works the page. `view`: view only, nothing reaches the page. */
  mode?: LiveViewMode;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}) {
  const picture = useRef<HTMLDivElement | null>(null);
  const wheel = useRef<{ dx: number; dy: number; x: number; y: number; timer: ReturnType<typeof setTimeout> | null }>({
    dx: 0,
    dy: 0,
    x: 0,
    y: 0,
    timer: null,
  });
  const [coarse, setCoarse] = useState(false);
  const [typed, setTyped] = useState("");
  const [shown, setShown] = useState(false);
  const live = state === "live" || state === "stale";
  const viewOnly = mode === "view";
  const acting = live && !disabled && !viewOnly;
  const onInput = (event: LiveViewInput) => {
    if (!viewOnly) given?.(event);
  };

  useEffect(() => {
    const query = globalThis.matchMedia?.("(pointer: coarse)");
    if (!query) return;
    const update = () => setCoarse(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  useEffect(() => () => {
    if (wheel.current.timer) clearTimeout(wheel.current.timer);
  }, []);

  const point = (event: { clientX: number; clientY: number }) => {
    const rect = picture.current?.getBoundingClientRect();
    return rect ? pagePoint(event.clientX, event.clientY, rect, viewport) : { x: 0, y: 0 };
  };

  const pointer = (type: "down" | "up") => (event: PointerEvent<HTMLDivElement>) => {
    if (!acting) return;
    if (type === "down") picture.current?.focus({ preventScroll: true });
    const { x, y } = point(event);
    onInput({ type, x, y, button: BUTTONS[event.button] ?? "left", count: Math.max(1, Math.min(3, event.detail || 1)) });
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!acting) return;
    const { x, y } = point(event);
    const held = wheel.current;
    held.dx += event.deltaX;
    held.dy += event.deltaY;
    held.x = x;
    held.y = y;
    if (held.timer) return;
    held.timer = setTimeout(() => {
      onInput({ type: "wheel", x: held.x, y: held.y, dx: Math.round(held.dx), dy: Math.round(held.dy) });
      held.dx = 0;
      held.dy = 0;
      held.timer = null;
    }, 60);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!acting) return;
    // Paste goes through onPaste, with its words.
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") return;
    const input = keyInput(event);
    if (!input) return;
    event.preventDefault();
    onInput(input);
  };

  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (!acting) return;
    const text = event.clipboardData.getData("text/plain");
    event.preventDefault();
    if (text) onInput({ type: "text", text });
  };

  const sendTyped = () => {
    if (!typed) return;
    onInput({ type: "text", text: typed });
    setTyped("");
  };

  const withField = !viewOnly && (keyboard === "always" || (keyboard === "auto" && coarse));

  return (
    <div className={cn("flex min-w-0 flex-col gap-2.5", className)} data-slot="live-view" data-state={state} data-mode={mode} {...props}>
      <div
        ref={picture}
        role="application"
        aria-label={label}
        aria-roledescription={viewOnly ? "view-only live view" : "live view"}
        aria-busy={state === "loading"}
        tabIndex={acting ? 0 : -1}
        className={cn(
          "relative w-full touch-none overflow-hidden rounded-xl bg-background shadow-raised outline-none select-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          acting ? "cursor-default" : "cursor-wait",
        )}
        style={{ aspectRatio: `${viewport.width} / ${viewport.height}` }}
        onPointerDown={pointer("down")}
        onPointerUp={pointer("up")}
        onContextMenu={(event) => event.preventDefault()}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        data-slot="live-view-frame"
      >
        {src ? (
          <img
            src={src}
            alt=""
            draggable={false}
            className={cn(
              "absolute inset-0 size-full object-fill transition-[opacity,filter] duration-(--motion-base)",
              state === "stale" && "opacity-60 saturate-50",
              state === "paused" && "opacity-25 blur-sm",
              state === "closed" && "opacity-35 blur-xs",
            )}
          />
        ) : null}
        {viewOnly ? (
          <div className="pointer-events-none absolute start-2.5 top-2.5" data-slot="live-view-mode">
            <Badge variant="outline" size="sm">
              <EyeIcon />
              View only
            </Badge>
          </div>
        ) : null}
        {state !== "live" && status ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-4" data-slot="live-view-status">
            <div className="sky-glass flex max-w-sm items-center gap-2.5 rounded-panel px-4 py-3 text-sm text-foreground shadow-raised">
              {state === "loading" ? <Spinner size="sm" /> : null}
              <span className="text-pretty">{status}</span>
            </div>
          </div>
        ) : null}
      </div>
      {withField ? (
        <div className="flex flex-col gap-2" data-slot="live-view-keyboard">
          <div className="flex items-center gap-2">
            <Input
              type={shown ? "text" : "password"}
              value={typed}
              disabled={!acting}
              placeholder="Type here, then Send"
              aria-label="Text to type on the page"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => setTyped(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  sendTyped();
                }
              }}
              data-testid="live-view-type"
            />
            <IconButton
              label={shown ? "Hide what you type" : "Show what you type"}
              variant="ghost-muted"
              onClick={() => setShown((value) => !value)}
            >
              {shown ? <EyeOffIcon /> : <EyeIcon />}
            </IconButton>
            <Button size="sm" disabled={!acting || !typed} onClick={sendTyped} data-testid="live-view-send">
              <SendIcon />
              Send
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="xs" variant="outline" disabled={!acting} onClick={() => onInput({ type: "key", key: "Tab" })}>
              Tab
            </Button>
            <Button size="xs" variant="outline" disabled={!acting} onClick={() => onInput({ type: "key", key: "Backspace" })}>
              <DeleteIcon />
              Delete
            </Button>
            <Button size="xs" variant="outline" disabled={!acting} onClick={() => onInput({ type: "key", key: "Enter" })}>
              <CornerDownLeftIcon />
              Enter
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
