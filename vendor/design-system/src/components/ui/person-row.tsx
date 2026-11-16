// A person in a line: their face, their name, and one line about them. The
// lockup Leads' table draws in its name column (components/leads/LeadsTable.tsx
// `Cell`: a 28px avatar, the name over "title · company", both truncating) and
// Settings draws for the signed-in owner (screens/settings/sections/
// AccountSettings.tsx `Identity`: 40px, the name over the email). The avatar
// is the kit's (./avatar.tsx, Morrow's); the type is t3code's row type.
// Pass `avatar` to put any face there (a PersonAvatar that fetches a photo,
// an agent's Face).

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "../../lib/utils";
import { Avatar } from "./avatar";

export const personRowVariants = cva("flex min-w-0 items-center", {
  variants: {
    size: {
      /** A table row (28px face). */
      sm: "gap-2.5",
      /** A list row (32px face). */
      md: "gap-3",
      /** The owner, at the top of a section (40px face). */
      lg: "gap-3",
    },
  },
  defaultVariants: { size: "sm" },
});

const AVATAR_SIZE = { sm: "sm", md: "md", lg: "xl" } as const;

export type PersonRowProps = Omit<ComponentProps<"div">, "title"> &
  VariantProps<typeof personRowVariants> & {
    name: ReactNode;
    /** Under the name: "VP Growth · Numera", an email. */
    detail?: ReactNode;
    /** The face; a kit Avatar of `avatarName` by default. */
    avatar?: ReactNode;
    /** Whose initials the default avatar shows (the name, when it is text). */
    avatarName?: string;
    /** After the words, at the end of the line: a badge, a time. */
    trailing?: ReactNode;
    /** data-slot on the name and the detail, for screens and tests that find them. */
    nameSlot?: string;
    detailSlot?: string;
  };

export function PersonRow({
  name,
  detail,
  avatar,
  avatarName,
  trailing,
  nameSlot,
  detailSlot,
  size,
  className,
  ...props
}: PersonRowProps) {
  const at = size ?? "sm";
  const face =
    avatar ??
    (
      <Avatar
        name={avatarName ?? (typeof name === "string" ? name : "?")}
        size={AVATAR_SIZE[at]}
        tone={at === "lg" ? "strong" : "neutral"}
      />
    );
  return (
    <div data-slot="person-row" className={cn(personRowVariants({ size }), className)} {...props}>
      {face}
      <div className={cn("min-w-0", at === "sm" && "leading-tight", trailing ? "flex-1" : undefined)}>
        <div className="truncate text-sm font-medium text-foreground" data-slot={nameSlot ?? "person-name"}>
          {name}
        </div>
        {detail !== undefined ? (
          <div className="truncate text-xs text-muted-foreground" data-slot={detailSlot ?? "person-detail"}>
            {detail}
          </div>
        ) : null}
      </div>
      {trailing ? <div className="flex shrink-0 items-center gap-1.5">{trailing}</div> : null}
    </div>
  );
}
