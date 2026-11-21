import { useCallback, useEffect, useRef, useState } from "react";
import type { ClaudeStatus } from "../../../shared/assistant";
import type { UiSnapshot } from "../../../shared/ipc";
import type { FabToastShown } from "../../../shared/quick";
import { AssistantPanel } from "./AssistantPanel";
import { AssistantSetup } from "./AssistantSetup";

function useSnapshot(): UiSnapshot | null {
  const [snap, setSnap] = useState<UiSnapshot | null>(null);
  useEffect(() => {
    void window.missiondesk.getSnapshot().then((s) => setSnap((cur) => cur ?? s)); // a pushed snapshot may arrive first
    return window.missiondesk.onSnapshot(setSnap);
  }, []);
  return snap;
}

type Edges = { x?: "left" | "right"; y?: "top" | "bottom" };
const HANDLES: { cls: string; edges: Edges }[] = [
  { cls: "l", edges: { x: "left" } },
  { cls: "r", edges: { x: "right" } },
  { cls: "t", edges: { y: "top" } },
  { cls: "b", edges: { y: "bottom" } },
  { cls: "tl", edges: { x: "left", y: "top" } },
  { cls: "tr", edges: { x: "right", y: "top" } },
  { cls: "bl", edges: { x: "left", y: "bottom" } },
  { cls: "br", edges: { x: "right", y: "bottom" } },
];

/** Edges and corners to resize the chat window (main follows the pointer while it is down). */
function ResizeHandles(): React.JSX.Element {
  const down = useRef(false);
  const end = (): void => {
    if (!down.current) return;
    down.current = false;
    window.missiondesk.assistantChatResize("end");
  };
  return (
    <>
      {HANDLES.map((h) => (
        <div
          key={h.cls}
          className={`aw-resize ${h.cls}`}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            down.current = true;
            window.missiondesk.assistantChatResize("start", h.edges);
          }}
          onPointerUp={end}
          onLostPointerCapture={end}
        />
      ))}
    </>
  );
}

/** The floating chat window (its own small view above the account pages). */
export function AssistantWindow(): React.JSX.Element | null {
  const snap = useSnapshot();
  const [status, setStatus] = useState<ClaudeStatus | null>(null);
  // Once the chat has been shown it stays (the conversation lives in it); only a check that
  // finds Claude Code signed out or gone sends the user back to the setup steps.
  const [chatShown, setChatShown] = useState(false);
  // A request from Home ("Brief me") waits here until the chat can take it.
  const [pendingAsk, setPendingAsk] = useState<string | null>(null);
  const open = snap?.assistant.open ?? false;
  const engine = snap?.assistant.engine ?? "claude";
  const latest = useRef(0);

  const recheck = useCallback((next?: ClaudeStatus) => {
    const req = ++latest.current; // only the newest answer counts
    if (next) {
      setStatus(next);
      return;
    }
    void window.missiondesk
      .assistantStatus()
      .then((s) => req === latest.current && setStatus(s));
  }, []);

  // Subscribed from the page's first moment, so a request sent while it loads isn't lost.
  useEffect(
    () => window.missiondesk.onAssistantAsk((text) => setPendingAsk(text)),
    [],
  );

  // Check when it opens, quietly (Claude Code may have been installed or signed in meanwhile).
  useEffect(() => {
    if (open) recheck();
  }, [open, engine, recheck]);
  // Back from Settings (e.g. just connected OpenRouter): check again.
  useEffect(() => {
    const onFocus = (): void => {
      if (open) recheck();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [open, recheck]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") window.missiondesk.toggleAssistant(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shared = !!snap?.accounts.some(
    (x) => (x.claudeAccess ?? "off") !== "off",
  );
  const ready = status?.state === "ready" && shared;
  const broken = status !== null && status.state !== "ready";
  useEffect(() => {
    if (ready) setChatShown(true);
    if (broken || (status?.state === "ready" && !shared)) setChatShown(false);
  }, [ready, broken, shared, status]);

  if (!snap) return null;
  return (
    <>
      <ResizeHandles />
      <div className="aw">
        {chatShown || ready ? (
          <AssistantPanel
            snapshot={snap}
            onNeedsSetup={() => recheck()}
            pendingAsk={pendingAsk}
            onAskTaken={() => setPendingAsk(null)}
          />
        ) : (
          <>
            <header className="as-head">
              <span className="as-title">✦ Assistant</span>
              <button
                className="as-icon"
                title="Close (⌘J)"
                aria-label="Close"
                onClick={() => window.missiondesk.toggleAssistant(false)}
              >
                ×
              </button>
            </header>
            <div className="aw-scroll">
              {engine === "claude" || status === null ? (
                <AssistantSetup
                  status={status}
                  snapshot={snap}
                  onRecheck={recheck}
                />
              ) : status.state !== "ready" ? (
                <div className="ast">
                  <p className="ast-intro">
                    This space uses{" "}
                    <strong>
                      {engine === "codex" ? "OpenAI Codex" : "OpenRouter"}
                    </strong>
                    , which isn't connected yet.
                  </p>
                  <button
                    className="ast-primary"
                    onClick={() =>
                      window.missiondesk.openSettings("integrations")
                    }
                  >
                    Connect it in Settings → Integrations
                  </button>
                  <p className="ast-muted">
                    Or choose another assistant for this space in{" "}
                    <button
                      className="ast-link"
                      onClick={() => window.missiondesk.openSettings("assistant")}
                    >
                      Settings → Assistant
                    </button>
                    .
                  </p>
                </div>
              ) : (
                <AssistantSetup
                  status={status}
                  snapshot={snap}
                  onRecheck={recheck}
                />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

/** The + on the button; it turns 45° into × when the menu or the chat is open. */
export const PlusIcon = (): React.JSX.Element => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/** A confirmation beside the button: "Creating a meeting link…", then "Meeting link copied". */
function FabToast({ toast }: { toast: FabToastShown }): React.JSX.Element {
  return (
    <div className={`fab-toast ${toast.state} ${toast.side}`} role="status" aria-live="polite">
      <span className="fab-toast-mark" aria-hidden="true">
        {toast.state === "busy" ? <span className="fab-spin" /> : toast.state === "done" ? "✓" : "!"}
      </span>
      <span className="fab-toast-text">
        <strong>{toast.title}</strong>
        {toast.detail && <span>{toast.detail}</span>}
      </span>
    </div>
  );
}

/**
 * The floating round button: a click opens the quick actions (the assistant among them), or
 * closes the assistant when it's open; a drag moves it (up, down, either side).
 */
export function AssistantFab(): React.JSX.Element {
  const snap = useSnapshot();
  const open = snap?.assistant.open ?? false;
  const press = useRef<{ x: number; y: number; dragging: boolean } | null>(
    null,
  );
  const [toast, setToast] = useState<FabToastShown | null>(null);
  // The side is kept after the toast goes, so the button doesn't jump while the view narrows.
  const [side, setSide] = useState<"left" | "right">("right");
  useEffect(
    () =>
      window.missiondesk.onFabToast((t) => {
        setToast(t);
        if (t) setSide(t.side);
      }),
    [],
  );
  const click = (): void => (open ? window.missiondesk.toggleAssistant(false) : window.missiondesk.showActionsMenu());
  const end = (): void => {
    const p = press.current;
    press.current = null;
    if (p?.dragging) window.missiondesk.assistantFabDrag("end");
    return void 0;
  };
  return (
    <>
      {toast && <FabToast toast={toast} />}
      <button
        className={`fab ${side}${open ? " open" : ""}`}
        title={open ? "Close the assistant  (⌘J)" : "Quick actions · drag to move"}
        aria-label={open ? "Close the assistant" : "Quick actions"}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          press.current = { x: e.screenX, y: e.screenY, dragging: false };
        }}
        onPointerMove={(e) => {
          const p = press.current;
          if (
            p &&
            !p.dragging &&
            Math.hypot(e.screenX - p.x, e.screenY - p.y) > 4
          ) {
            p.dragging = true;
            window.missiondesk.assistantFabDrag("start"); // main follows the pointer from here
          }
        }}
        onPointerUp={() => {
          const wasDrag = press.current?.dragging;
          end();
          if (!wasDrag) click();
        }}
        onLostPointerCapture={end}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && click()}
      >
        <PlusIcon />
      </button>
    </>
  );
}
