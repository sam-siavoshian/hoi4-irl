// A screen's last word about what just happened ("5,000 people saved to
// lanes-people.csv"): t3code's Alert (./alert.tsx) under the toolbar, arriving
// on Zephium's menu curve, gone after a few seconds. Lanes' stand-in for a
// toast, where the old window raised one. Moved here from
// components/leads/Notice.tsx (Leads and Company used it), unchanged but for
// `Notice` as its kit name; errors stay until dismissed, since the owner has
// to read why.

import { CircleAlertIcon, CircleCheckIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "../../lib/utils";
import { Alert, AlertAction, AlertDescription } from "./alert";
import { Button } from "./button";

export interface NoticeValue {
  text: string;
  tone: "success" | "error" | "info";
  id: number;
}

/** A notice to show, and `say` to show one: it clears itself after `ttl` ms, unless it is an error. */
export function useNotice(ttl = 6000) {
  const [notice, setNotice] = useState<NoticeValue | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);
  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setNotice(null);
  }, []);
  const say = useCallback(
    (text: string, tone: NoticeValue["tone"] = "success") => {
      if (timer.current) clearTimeout(timer.current);
      counter.current += 1;
      setNotice({ text, tone, id: counter.current });
      // Errors stay until dismissed: the owner has to read why.
      timer.current = tone === "error" ? null : setTimeout(() => setNotice(null), ttl);
    },
    [ttl],
  );
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return { notice, say, clear };
}

/** The notice, with a close button; nothing when there is none. */
export function Notice({
  notice,
  onDismiss,
  className,
}: {
  notice: NoticeValue | null;
  onDismiss: () => void;
  className?: string;
}) {
  if (!notice) return null;
  // An info notice wears the check, as it did on Leads before the kit.
  const Icon = notice.tone === "error" ? CircleAlertIcon : CircleCheckIcon;
  return (
    <Alert
      key={notice.id}
      // Something that went wrong is a calm warning, not red: red is for a stopped send (docs/problems.md).
      variant={notice.tone === "error" ? "warning" : notice.tone === "success" ? "success" : "info"}
      role={notice.tone === "error" ? "alert" : "status"}
      className={cn("animate-menu-in py-2", className)}
      data-testid="notice"
    >
      <Icon />
      <AlertDescription className="text-current">{notice.text}</AlertDescription>
      <AlertAction>
        <Button size="icon-xs" variant="ghost-muted" aria-label="Close" onClick={onDismiss}>
          <XIcon />
        </Button>
      </AlertAction>
    </Alert>
  );
}
