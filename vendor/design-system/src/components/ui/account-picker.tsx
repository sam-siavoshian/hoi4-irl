// A choice of account, one row each: the account's picture, its handle with
// the name under it, small, a badge for the one open now, and a tick on the
// one chosen. Made for the X accounts signed in to the owner's browser (first
// run's X step, Settings > X, Connections), and fit for any account a person
// picks from a short list.
//
// A radio group, as ChoiceCards is (./choice-cards.tsx): one tab stop (the
// chosen row, or the first), the arrow keys and Home and End move the focus,
// and Space or Enter picks, since a pick here saves. The row is the kit's
// PersonRow lockup (./person-row.tsx: a 32px Avatar, the name over a line,
// both truncating); the chosen row wears ChoiceCards' 2px ring in the lit ink
// on `bg-fill`. A picture that is missing or fails to load leaves the
// Avatar's generic face (`fallback`), never a broken image.

import { CheckIcon, UserRoundIcon } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useRef } from "react";

import { cn } from "../../lib/utils";
import { Avatar } from "./avatar";
import { Badge } from "./badge";
import { Spinner } from "./spinner";

export interface AccountOption {
  /** What the choice is keyed by (an X account's number). */
  id: string;
  /** The first line: "@sam_builds". */
  title: string;
  /** Under it, small: the display name, or what is known instead. */
  detail?: string | undefined;
  /** The picture; missing, the generic face. */
  avatarUrl?: string | undefined;
  /** A word for this one in a badge: "Current". */
  badge?: string | undefined;
  /** Shown, but not one to pick (an account Lanes can't name yet). */
  disabled?: boolean | undefined;
  /** Data attributes for the row's button. */
  data?: Record<`data-${string}`, string>;
}

const MOVES: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

export function AccountPicker({
  label,
  accounts,
  value,
  onChange,
  busy = null,
  disabled = false,
  className,
  ...rest
}: {
  /** The group's spoken name: "X account Lanes uses". */
  label: string;
  accounts: readonly AccountOption[];
  /** The chosen account's id, or null while none is. */
  value: string | null;
  onChange: (id: string) => void;
  /** The id being saved: its tick is a spinner until it is. */
  busy?: string | null;
  disabled?: boolean | undefined;
  className?: string;
} & Record<`data-${string}`, string | undefined>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  // The rows that can be picked; the arrows step over the others.
  const open = accounts.map((account, at) => (account.disabled ? -1 : at)).filter((at) => at >= 0);
  const chosen = accounts.findIndex((account) => account.id === value && !account.disabled);
  const stop = chosen >= 0 ? chosen : (open[0] ?? 0);

  const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const here = open.indexOf(index);
    let next: number | undefined;
    if (event.key in MOVES) next = open[(here + MOVES[event.key]! + open.length) % open.length];
    else if (event.key === "Home") next = open[0];
    else if (event.key === "End") next = open[open.length - 1];
    if (next === undefined) return;
    event.preventDefault();
    buttons.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-busy={busy ? true : undefined}
      data-slot="account-picker"
      className={cn("flex flex-col gap-1.5", className)}
      {...rest}
    >
      {accounts.map((account, at) => {
        const on = account.id === value;
        const saving = busy === account.id;
        let mark: ReactNode = null;
        if (saving) mark = <Spinner size="sm" tone="muted" />;
        else if (on) mark = <CheckIcon strokeWidth={3} />;
        return (
          <button
            key={account.id}
            ref={(node) => {
              buttons.current[at] = node;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={at === stop ? 0 : -1}
            disabled={disabled || account.disabled}
            data-account={account.id}
            data-chosen={on || undefined}
            {...account.data}
            onClick={() => onChange(account.id)}
            onKeyDown={onKeyDown(at)}
            className={cn(
              "group flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left outline-none",
              "transition-[box-shadow,background-color] duration-(--motion-fast) ease-out focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-default disabled:opacity-60",
              on ? "bg-fill shadow-[0_0_0_2px_var(--primary)]" : "shadow-[0_0_0_1px_var(--color-border)] hover:bg-fill",
            )}
          >
            <Avatar
              name={account.title}
              src={account.avatarUrl || null}
              fallback={<UserRoundIcon aria-hidden className="size-4" />}
              referrerPolicy="no-referrer"
              size="md"
            />
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-sm font-medium text-foreground" data-slot="account-title">
                {account.title}
              </span>
              {account.detail ? (
                <span className="truncate text-xs text-muted-foreground" data-slot="account-detail">
                  {account.detail}
                </span>
              ) : null}
            </span>
            {account.badge ? (
              <Badge variant="outline" size="sm" className="shrink-0">
                {account.badge}
              </Badge>
            ) : null}
            <span
              aria-hidden="true"
              data-slot="account-radio"
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-(--motion-fast) [&_svg]:size-3",
                on && !saving ? "bg-primary text-primary-foreground" : "shadow-[inset_0_0_0_1.5px_var(--color-border-strong)]",
                saving && "shadow-none",
              )}
            >
              {mark}
            </span>
          </button>
        );
      })}
    </div>
  );
}
