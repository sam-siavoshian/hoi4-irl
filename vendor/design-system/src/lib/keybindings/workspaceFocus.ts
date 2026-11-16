// From pingdotgg/t3code apps/web/src/lib/workspaceFocus.ts (MIT, Copyright (c)
// T3 Tools Inc.; full notice in app/ui/THIRD_PARTY_NOTICES.md): F6 and
// Shift+F6 move focus between the window's areas (the sidebar, the section),
// each area remembers the control it last had, and focus that drops to the
// page because its control vanished goes back to that area. Like VS Code's
// focusPart / visible-neighbour actions.
//
// Changes: Lanes' composer is a textarea, not t3code's contenteditable
// editor, so it is one of the controls an area prefers
// (`[data-chat-composer-form] textarea`); the right-panel, terminal and
// pull-request hooks, the context-menu fallback, the deferred focus requests
// (`requestWorkspaceFocus`) and the palette hand-off are left out (no such
// surfaces here yet).

const AREA_SELECTOR = "[data-workspace-area]";
const FOCUS_BOUNDARY_SELECTOR =
  '[role="dialog"], [role="alertdialog"], [aria-modal="true"], dialog[open], [data-slot$="-popup"]:not([data-slot="tooltip-popup"]):not([role="tooltip"])';
const FOCUSABLE_SELECTOR =
  'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [contenteditable="true"], [tabindex]';
const PREFERRED_SELECTOR =
  '[data-workspace-focus-default], [data-sidebar-row][aria-current="page"], [data-settings-section][tabindex="0"], [contenteditable="true"], [data-chat-composer-form] textarea';

/** Props that make an element one stop in the F6 cycle; `order` sets its place in the cycle. */
export function workspaceAreaProps(name: string, order: number, label: string) {
  return {
    "data-workspace-area": name,
    "data-workspace-order": order,
    "aria-label": label,
    role: "region",
    tabIndex: -1,
  } as const;
}

function workspaceArea(element: Element): HTMLElement | null {
  const area = element.closest<HTMLElement>(AREA_SELECTOR);
  if (area) return area;
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? workspaceArea(root.host) : null;
}

function isWorkspaceElementVisible(element: HTMLElement): boolean {
  if (
    !element.isConnected ||
    element.closest(
      '[hidden], [inert], [data-closed], [aria-hidden="true"], [data-slot="sidebar"][data-state="collapsed"], [data-workspace-unavailable="true"]',
    )
  )
    return false;
  const style = getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const root = element.getRootNode();
  if (root instanceof ShadowRoot && root.host instanceof HTMLElement && !isWorkspaceElementVisible(root.host))
    return false;
  return Array.from(element.getClientRects()).some((rect) => rect.width > 0 && rect.height > 0);
}

function scrollingAncestors(target: HTMLElement) {
  const scrollers: HTMLElement[] = [];
  for (let element = target.parentElement; element; element = element.parentElement) {
    const { overflowY } = getComputedStyle(element);
    if ((overflowY === "auto" || overflowY === "scroll") && element.scrollHeight > element.clientHeight)
      scrollers.push(element);
  }
  return scrollers;
}

/**
 * Brings a restored control into view, innermost scrolling list first.
 * scrollIntoView would also scroll overflow-hidden layout containers out of place.
 */
function revealInScrollers(target: HTMLElement) {
  for (const scroller of scrollingAncestors(target)) {
    const box = scroller.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    if (rect.top < box.top) scroller.scrollTop -= box.top - rect.top;
    else if (rect.bottom > box.bottom) scroller.scrollTop += rect.bottom - box.bottom;
  }
}

/** Keeps area focus local, like VS Code's layout service focusPart/visible-neighbour actions. */
export function createWorkspaceFocusController(doc: Document) {
  const lastFocused = new Map<string, HTMLElement>();
  let lastArea: string | undefined;
  const remember = (event: FocusEvent) => {
    if (!(event.target instanceof HTMLElement)) return;
    const area = workspaceArea(event.target);
    if (!area?.dataset.workspaceArea) return;
    lastArea = area.dataset.workspaceArea;
    const key = area.dataset.workspaceFocusKey ?? lastArea;
    lastFocused.delete(key);
    const target = event.composedPath().find((element) => element instanceof HTMLElement);
    lastFocused.set(key, target instanceof HTMLElement ? target : event.target);
    if (lastFocused.size > 64) lastFocused.delete(lastFocused.keys().next().value!);
  };
  doc.addEventListener("focusin", remember);

  const focusArea = (area: HTMLElement, restore = true) => {
    const key = area.dataset.workspaceFocusKey ?? area.dataset.workspaceArea!;
    const previous = restore ? lastFocused.get(key) : undefined;
    const belongs = (element: HTMLElement) =>
      workspaceArea(element) === area && isWorkspaceElementVisible(element) && !element.matches(":disabled");
    const preferred = Array.from(area.querySelectorAll<HTMLElement>(PREFERRED_SELECTOR)).find(belongs);
    const fallback = Array.from(area.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).find(
      (element) => element.tabIndex >= 0 && belongs(element),
    );
    // A control that unmounted while hidden: find the same named control again when it is back.
    const restored =
      previous && !previous.isConnected
        ? Array.from(area.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).find(
            (element) =>
              belongs(element) &&
              element.tagName === previous.tagName &&
              ((previous.id && element.id === previous.id) ||
                (previous.getAttribute("aria-label") &&
                  element.getAttribute("aria-label") === previous.getAttribute("aria-label")) ||
                (previous.matches("button") &&
                  previous.textContent?.trim() &&
                  element.textContent === previous.textContent)),
          )
        : undefined;
    const targets = new Set([previous && belongs(previous) ? previous : undefined, restored, preferred, fallback, area]);
    for (const target of targets) {
      if (!target) continue;
      target.focus({ preventScroll: true });
      const root = target.getRootNode();
      const active = root instanceof ShadowRoot ? root.activeElement : doc.activeElement;
      if (active === target || (active && target.contains(active))) {
        if (target !== area) revealInScrollers(target);
        return true;
      }
    }
    return false;
  };

  const focus = (name: string, restore = true) => {
    const areas = Array.from(doc.querySelectorAll<HTMLElement>(AREA_SELECTOR)).filter(isWorkspaceElementVisible);
    const area =
      name === "content"
        ? (areas.find((element) => element.dataset.workspaceArea === "composer") ??
          areas.find((element) => element.matches("main")))
        : areas.find((element) => element.dataset.workspaceArea === name);
    if (!area) return false;
    return focusArea(area, restore);
  };

  const move = (direction: 1 | -1, fromArea?: string) => {
    // A palette or dialog keeps focus wherever it is; any other popup only while it holds focus,
    // so hover popups and notifications never swallow the key.
    const activePopup = doc.activeElement?.closest<HTMLElement>('[role="menu"], [role="listbox"]');
    const boundaries = Array.from(doc.querySelectorAll<HTMLElement>(FOCUS_BOUNDARY_SELECTOR));
    if (activePopup && !activePopup.closest(AREA_SELECTOR)) boundaries.push(activePopup);
    if (
      boundaries.some(
        (boundary) =>
          (boundary.matches('[aria-modal="true"]') || boundary.contains(doc.activeElement)) &&
          isWorkspaceElementVisible(boundary),
      )
    )
      return false;
    const areas = Array.from(doc.querySelectorAll<HTMLElement>(AREA_SELECTOR))
      .filter(isWorkspaceElementVisible)
      .sort((left, right) => Number(left.dataset.workspaceOrder) - Number(right.dataset.workspaceOrder));
    if (areas.length === 0) return false;
    const activeArea = doc.activeElement?.closest<HTMLElement>(AREA_SELECTOR);
    const currentId = fromArea ?? activeArea?.dataset.workspaceArea ?? lastArea;
    const current = areas.findIndex((area) => area.dataset.workspaceArea === currentId);
    const index =
      current === -1 ? (direction === 1 ? 0 : areas.length - 1) : (current + direction + areas.length) % areas.length;
    return focusArea(areas[index]!);
  };

  // Focus that drops to the body because its element was hidden, made inert, or removed
  // returns to the same control when React remounted it, else to its area, else the content.
  const recover = (event: FocusEvent) => {
    const lost = event.target;
    if (!(lost instanceof HTMLElement) || event.relatedTarget) return;
    const areaName = workspaceArea(lost)?.dataset.workspaceArea;
    const label = lost.getAttribute("aria-label");
    requestAnimationFrame(() => {
      if (doc.activeElement !== doc.body || !doc.hasFocus() || isWorkspaceElementVisible(lost)) return;
      const remounted = Array.from(doc.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).find(
        (element) =>
          element.tagName === lost.tagName &&
          ((lost.id && element.id === lost.id) || (label && element.getAttribute("aria-label") === label)) &&
          isWorkspaceElementVisible(element),
      );
      if (remounted) remounted.focus({ preventScroll: true });
      else if (!areaName || !focus(areaName)) focus("content");
    });
  };
  doc.addEventListener("focusout", recover);

  return {
    move,
    focus,
    dispose: () => {
      doc.removeEventListener("focusin", remember);
      doc.removeEventListener("focusout", recover);
    },
  };
}

let controller: ReturnType<typeof createWorkspaceFocusController> | undefined;

/** Starts workspace focus for the window: F6 area moves and focus-loss recovery. */
export function startWorkspaceFocus(): () => void {
  const active = createWorkspaceFocusController(document);
  controller = active;
  return () => {
    active.dispose();
    if (controller === active) controller = undefined;
  };
}

/** Moves to the next or previous visible area. `fromArea` overrides the focused area. */
export function moveWorkspaceFocus(direction: 1 | -1, fromArea?: string): boolean {
  return controller?.move(direction, fromArea) ?? false;
}
