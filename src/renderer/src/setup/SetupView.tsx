import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ClaudeStatus } from "../../../shared/assistant";
import type { AssistantEngine } from "../../../shared/assistant-engines";
import { cleanSiteUrl } from "../../../shared/custom-site";
import {
  appNames,
  planOf,
  setupSteps,
  spaceColours,
  spaceNameProblem,
  type DraftApp,
  type SetupDraft,
  type SetupStep,
} from "../../../shared/setup";
import type { ServiceId } from "../../../shared/types";
import { useModal } from "../modal";
import { ServiceLogo } from "../service-glyph";
import "./setup.css";

const SERVICES: {
  id: Exclude<ServiceId, "custom">;
  name: string;
  what: string;
}[] = [
  { id: "google", name: "Google", what: "Gmail, Calendar, Drive" },
  { id: "microsoft", name: "Microsoft 365", what: "Outlook, Teams" },
  { id: "slack", name: "Slack", what: "A workspace" },
  { id: "whatsapp", name: "WhatsApp", what: "Your chats" },
  { id: "telegram", name: "Telegram", what: "Your chats" },
  { id: "linkedin", name: "LinkedIn", what: "Messages, feed" },
  { id: "discord", name: "Discord", what: "Servers, DMs" },
];
const SUGGESTED = ["Personal", "Work", "Side project"];
const MAX_SPACES = 20;
const MAX_APPS = 12;
const ENGINE_NAME: Record<AssistantEngine, string> = {
  claude: "Claude",
  codex: "Codex",
  openrouter: "OpenRouter",
  off: "",
};
const STAGES = ["Welcome", "Assistant", "Spaces", "Apps", "Ready"];

let seq = 0;
const newKey = (): string => `k${++seq}`;

type Existing = { name: string; color?: string };
const GREY = "#8b8f9b";

/**
 * Each draft space's colour, by the same rule Mission Desk uses when it creates them. `final`: only
 * the spaces that will be created count (empty ones are left out, and shown grey).
 */
function draftColours(
  draft: SetupDraft,
  existing: Existing[],
  final: boolean,
): Map<string, string> {
  const counted = draft.spaces.filter((s) => !final || s.apps.length > 0);
  const cols = spaceColours(
    counted.map((s) => s.name),
    existing,
  );
  return new Map(
    draft.spaces.map((s) => {
      const i = counted.indexOf(s);
      return [s.key, i >= 0 ? cols[i] : GREY];
    }),
  );
}

const EMPTY_DRAFT: SetupDraft = {
  engine: "claude",
  reads: true,
  together: false,
  spaces: [],
  loose: [],
};

/** First-run setup: a full-window walk through the assistant, spaces and apps. */
export function SetupView({
  hasAccounts,
  existing,
  defaultEngine,
}: {
  hasAccounts: boolean;
  /** The spaces the user already has (a second run adds to them), with their colour. */
  existing: Existing[];
  /** The assistant chosen before (a second run starts from it, so it isn't changed by accident). */
  defaultEngine?: AssistantEngine;
}): React.JSX.Element {
  useModal(true);
  const [draft, setDraft] = useState<SetupDraft>(() => ({
    ...EMPTY_DRAFT,
    engine: defaultEngine ?? EMPTY_DRAFT.engine,
  }));
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");
  const steps = useMemo(() => setupSteps(draft), [draft]);
  const step = steps[Math.min(index, steps.length - 1)];
  const headRef = useRef<HTMLHeadingElement>(null);

  const update = useCallback(
    (f: (d: SetupDraft) => SetupDraft) => setDraft((d) => f(d)),
    [],
  );

  // A space name typed but not added yet: Continue adds it (nothing typed is lost).
  const [typing, setTyping] = useState("");
  const typedSpace =
    step.kind === "spaces" &&
    !draft.together &&
    draft.spaces.length < MAX_SPACES &&
    spaceNameProblem(
      typing,
      draft.spaces.map((s) => s.name),
    ) === null;
  const canGo =
    step.kind !== "spaces" ||
    draft.together ||
    draft.spaces.length > 0 ||
    typedSpace;
  const go = useCallback(
    (delta: 1 | -1) => {
      setDir(delta > 0 ? "fwd" : "back");
      setIndex((i) => Math.max(0, Math.min(steps.length - 1, i + delta)));
    },
    [steps.length],
  );

  const plan = planOf(draft);
  const appCount =
    plan.spaces.reduce((n, s) => n + s.apps.length, 0) + plan.apps.length;

  async function finish(): Promise<void> {
    setFinishing(true);
    setError("");
    try {
      await window.missiondesk.finishSetup(plan);
    } catch (e) {
      setFinishing(false);
      setError(
        "Mission Desk couldn't add them. Go back and check the space names and web addresses, then try again.",
      );
    }
  }

  const next = (): void => {
    if (step.kind === "ready") void finish();
    else if (canGo) {
      if (typedSpace) {
        const name = typing.trim();
        update((d) => ({
          ...d,
          spaces: [...d.spaces, { key: newKey(), name, apps: [] }],
        }));
        setTyping("");
      }
      go(1);
    }
  };

  // Move focus to the new screen's first field (if it asks for typing) or its title, so the
  // keyboard and VoiceOver start there.
  useLayoutEffect(() => {
    const field = document.querySelector<HTMLElement>(
      ".su-step [data-autofocus]",
    );
    (field ?? headRef.current)?.focus({ preventScroll: true });
  }, [index]);

  // Return continues, Escape goes back (unless a field is using the key).
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement;
      const inField =
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT";
      const onControl =
        t.tagName === "BUTTON" ||
        t.tagName === "A" ||
        t.getAttribute("role") === "radio";
      // Only from the screen itself (its title has focus), never from <body> after a removal.
      const onScreen = t === headRef.current;
      if (
        e.key === "Enter" &&
        onScreen &&
        !inField &&
        !onControl &&
        !e.isComposing &&
        !finishing
      ) {
        e.preventDefault();
        next();
      } else if (
        e.key === "Escape" &&
        !(inField && (t as HTMLInputElement).value) &&
        index > 0 &&
        !finishing
      ) {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const stage =
    step.kind === "welcome"
      ? 0
      : step.kind === "assistant"
        ? 1
        : step.kind === "spaces"
          ? 2
          : step.kind === "apps"
            ? 3
            : 4;
  const appsSteps = steps.filter((s) => s.kind === "apps").length;
  const appsDone =
    step.kind === "apps"
      ? steps.indexOf(step) - 3 + 1
      : stage > 3
        ? appsSteps
        : 0;

  return (
    <div
      className="su"
      role="dialog"
      aria-modal="true"
      aria-labelledby="su-title"
    >
      <DockPreview draft={draft} step={step} existing={existing} />
      <section className="su-main">
        <header className="su-top">
          <ol
            className="su-progress"
            aria-label={`Step ${stage + 1} of 5: ${STAGES[stage]}`}
          >
            {STAGES.map((s, i) => (
              <li
                key={s}
                className={i < stage ? "done" : i === stage ? "now" : ""}
              >
                <span
                  className="su-bar"
                  style={
                    i === 3 && stage === 3 && appsSteps > 1
                      ? ({
                          "--fill": `${(appsDone / appsSteps) * 100}%`,
                        } as React.CSSProperties)
                      : undefined
                  }
                />
                <span className="su-stage">{s}</span>
              </li>
            ))}
          </ol>
          {step.kind !== "ready" && (
            <button
              className="su-skip"
              onClick={() => window.missiondesk.skipSetup()}
              title="You can run the setup again from Settings → General"
            >
              {hasAccounts ? "Close" : "Skip setup"}
            </button>
          )}
        </header>

        <div className="su-scroll">
          <div className="su-col">
            <div className={`su-step ${dir}`} key={`${index}:${step.kind}`}>
              {step.kind === "welcome" && (
                <Welcome headRef={headRef} again={hasAccounts} />
              )}
              {step.kind === "assistant" && (
                <AssistantStep
                  headRef={headRef}
                  engine={draft.engine}
                  onPick={(engine) => update((d) => ({ ...d, engine }))}
                />
              )}
              {step.kind === "spaces" && (
                <SpacesStep
                  headRef={headRef}
                  draft={draft}
                  update={update}
                  existing={existing}
                  name={typing}
                  setName={setTyping}
                  onContinue={next}
                />
              )}
              {step.kind === "apps" && (
                <AppsStep
                  headRef={headRef}
                  draft={draft}
                  space={step.space}
                  update={update}
                  count={appsSteps}
                />
              )}
              {step.kind === "ready" && (
                <ReadyStep
                  headRef={headRef}
                  existing={existing}
                  draft={draft}
                  update={update}
                  appCount={appCount}
                  error={error}
                />
              )}
            </div>
            <footer className="su-nav">
              {index > 0 ? (
                <button
                  className="su-back"
                  onClick={() => go(-1)}
                  disabled={finishing}
                >
                  Back
                </button>
              ) : (
                <span className="su-note">Takes about a minute.</span>
              )}
              {!canGo && (
                <span className="su-note su-why">
                  Add a space, or keep everything together.
                </span>
              )}
              <button
                className="su-go"
                onClick={next}
                disabled={!canGo || finishing}
              >
                {step.kind === "welcome"
                  ? "Get started"
                  : step.kind === "ready"
                    ? finishing
                      ? "Setting up…"
                      : appCount > 0
                        ? "Start signing in"
                        : "Open Mission Desk"
                    : "Continue"}
              </button>
            </footer>
          </div>
        </div>
      </section>
    </div>
  );
}

type HeadRef = React.RefObject<HTMLHeadingElement | null>;

function Title({
  headRef,
  children,
}: {
  headRef: HeadRef;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <h1 id="su-title" className="su-title" ref={headRef} tabIndex={-1}>
      {children}
    </h1>
  );
}

/* ───────────── Welcome ───────────── */

function Welcome({
  headRef,
  again,
}: {
  headRef: HeadRef;
  again: boolean;
}): React.JSX.Element {
  return (
    <>
      <Title headRef={headRef}>
        {again ? "Set up more of Mission Desk" : "Welcome to Mission Desk"}
      </Title>
      <p className="su-lede">
        {again
          ? "Add spaces and apps the same way as the first time. What you already have stays as it is."
          : "All your apps side by side, organised in spaces, with one Home for your day and an assistant that knows each space."}
      </p>
      {!again && (
        <ul className="su-points">
          <li>
            <Glyph d="M4 5h6v14H4zM14 5h6v14h-6z" />
            <div>
              <strong>Every account signed in on its own</strong>
              <span>
                Two Google accounts, three Slack workspaces: each keeps its own
                login.
              </span>
            </div>
          </li>
          <li>
            <Glyph d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
            <div>
              <strong>Home shows what’s next</strong>
              <span>
                Your meetings, to-dos and unread messages, and one click to join
                a call.
              </span>
            </div>
          </li>
          <li>
            <Glyph d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" />
            <div>
              <strong>An assistant that stays in its space</strong>
              <span>
                It reads only the apps you share with it, and only in that
                space.
              </span>
            </div>
          </li>
        </ul>
      )}
    </>
  );
}

function Glyph({ d }: { d: string }): React.JSX.Element {
  return (
    <svg className="su-glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* ───────────── Assistant ───────────── */

const ENGINE_CHOICES: { id: AssistantEngine; name: string; hint: string }[] = [
  {
    id: "claude",
    name: "Claude",
    hint: "Uses your Claude plan, through Claude Code on this Mac.",
  },
  {
    id: "codex",
    name: "OpenAI Codex",
    hint: "Uses your ChatGPT plan, through Codex on this Mac.",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    hint: "GPT, Gemini, Llama and more, with your own OpenRouter key.",
  },
  { id: "off", name: "Not now", hint: "You can add one later in Settings." },
];

function AssistantStep({
  headRef,
  engine,
  onPick,
}: {
  headRef: HeadRef;
  engine: AssistantEngine;
  onPick(e: AssistantEngine): void;
}): React.JSX.Element {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const at = ENGINE_CHOICES.findIndex((c) => c.id === engine);
  const move = (delta: number): void => {
    const i = (at + delta + ENGINE_CHOICES.length) % ENGINE_CHOICES.length;
    onPick(ENGINE_CHOICES[i].id);
    refs.current[i]?.focus();
  };
  return (
    <>
      <Title headRef={headRef}>Would you like an assistant?</Title>
      <p className="su-lede">
        It briefs you on your day, finds who’s waiting on you and prepares your
        meetings, from the apps you share with it.
      </p>
      <div className="su-choices" role="radiogroup" aria-label="Assistant">
        {ENGINE_CHOICES.map((c, i) => (
          <button
            key={c.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="radio"
            aria-checked={engine === c.id}
            tabIndex={engine === c.id ? 0 : -1}
            className={`su-choice${engine === c.id ? " on" : ""}${c.id === "off" ? " quiet" : ""}`}
            onClick={() => onPick(c.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowRight")
                (e.preventDefault(), move(1));
              if (e.key === "ArrowUp" || e.key === "ArrowLeft")
                (e.preventDefault(), move(-1));
            }}
          >
            <span className="su-radio" aria-hidden="true" />
            <span className="su-choice-text">
              <strong>{c.name}</strong>
              <span>{c.hint}</span>
            </span>
          </button>
        ))}
      </div>
      {engine !== "off" && <EngineConnect key={engine} engine={engine} />}
    </>
  );
}

const INSTALL: Partial<Record<AssistantEngine, string>> = {
  claude: "curl -fsSL https://claude.ai/install.sh | bash",
  codex: "npm install -g @openai/codex",
};

/** Connect the chosen assistant right here (or later, in Settings → Integrations). */
function EngineConnect({
  engine,
}: {
  engine: AssistantEngine;
}): React.JSX.Element {
  const [status, setStatus] = useState<ClaudeStatus | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const live = useRef(true);
  useEffect(
    () => () => {
      live.current = false;
    },
    [],
  );

  const check = useCallback(() => {
    setStatus(null);
    const p: Promise<ClaudeStatus> =
      engine === "claude"
        ? window.missiondesk.claudeIntegrationStatus()
        : engine === "codex"
          ? window.missiondesk.codexStatus()
          : window.missiondesk.openRouterStatus().then(
              (s) =>
                ({
                  state: s.connected ? "ready" : "signed-out",
                }) as ClaudeStatus,
            );
    void p
      .then((s) => live.current && setStatus(s))
      .catch(() => live.current && setStatus({ state: "signed-out" }));
  }, [engine]);
  useEffect(check, [check]);

  // Back from the browser or Terminal: look again.
  useEffect(() => {
    const onFocus = (): void => {
      if (!waiting && status?.state !== "ready") check();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [check, waiting, status]);

  // Leaving the screen while waiting for the browser stops the sign-in.
  const waitingRef = useRef(false);
  waitingRef.current = waiting;
  useEffect(
    () => () => {
      if (waitingRef.current)
        engine === "claude"
          ? window.missiondesk.assistantSignInCancel()
          : window.missiondesk.codexSignInCancel();
    },
    [engine],
  );

  const name = ENGINE_NAME[engine];
  const app = engine === "claude" ? "Claude Code" : "Codex";

  async function signIn(): Promise<void> {
    setWaiting(true);
    const st = await (
      engine === "claude"
        ? window.missiondesk.assistantSignIn()
        : window.missiondesk.codexSignIn()
    ).catch(() => ({ state: "signed-out" }) as ClaudeStatus);
    if (!live.current) return;
    setWaiting(false);
    setStatus(st);
  }

  async function connect(): Promise<void> {
    setBusy(true);
    setError("");
    const r = await window.missiondesk
      .openRouterConnect(key.trim())
      .catch((e: Error) => ({ connected: false, error: e.message }));
    if (!live.current) return;
    setBusy(false);
    if (r.connected) {
      setKey("");
      setStatus({ state: "ready" });
    } else
      setError(
        r.error ?? "OpenRouter refused this key. Check it and try again.",
      );
  }

  return (
    <div className="su-connect" aria-live="polite">
      {status === null ? (
        <p className="su-state">
          <span className="su-spin" aria-hidden="true" /> Checking{" "}
          {engine === "openrouter" ? "OpenRouter" : app}…
        </p>
      ) : status.state === "ready" ? (
        <p className="su-state ok">
          <Check />{" "}
          {engine === "openrouter"
            ? "OpenRouter is connected."
            : `${app} is signed in on this Mac.`}{" "}
          {name} is ready.
        </p>
      ) : engine === "openrouter" ? (
        <>
          <label className="su-label" htmlFor="su-key">
            Your OpenRouter key
          </label>
          <div className="su-row">
            <input
              id="su-key"
              className="su-input"
              type="password"
              placeholder="sk-or-v1-…"
              value={key}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => (setKey(e.target.value), setError(""))}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.nativeEvent.isComposing &&
                  key.trim() &&
                  !busy
                )
                  (e.preventDefault(), void connect());
              }}
            />
            <button
              className="su-btn"
              disabled={!key.trim() || busy}
              onClick={() => void connect()}
            >
              {busy ? "Checking…" : "Connect"}
            </button>
          </div>
          {error && <p className="su-error">{error}</p>}
          <p className="su-fine">
            Create one at{" "}
            <a
              href="https://openrouter.ai/keys"
              onClick={(e) => {
                e.preventDefault();
                window.missiondesk.openExternal("https://openrouter.ai/keys");
              }}
            >
              openrouter.ai/keys
            </a>
            . macOS keeps it encrypted on this Mac; OpenRouter bills what you
            use.
          </p>
        </>
      ) : status.state === "signed-out" ? (
        waiting ? (
          <p className="su-state">
            <span className="su-spin" aria-hidden="true" /> Finish signing in in
            your browser…{" "}
            <button
              className="su-link"
              onClick={() =>
                engine === "claude"
                  ? window.missiondesk.assistantSignInCancel()
                  : window.missiondesk.codexSignInCancel()
              }
            >
              Cancel
            </button>
          </p>
        ) : (
          <div className="su-row spread">
            <p className="su-state">
              {app} is installed. Sign in once, with your{" "}
              {engine === "claude" ? "Claude" : "ChatGPT"} account.
            </p>
            <button className="su-btn" onClick={() => void signIn()}>
              Sign in
            </button>
          </div>
        )
      ) : (
        <>
          <p className="su-state">
            {engine === "claude"
              ? "Claude needs Claude Code on this Mac."
              : "OpenAI Codex needs the Codex command-line tool on this Mac."}{" "}
            Open Terminal, paste this and press Return:
          </p>
          <div className="su-cmd">
            <code>{INSTALL[engine]}</code>
            <button
              className="su-btn small"
              onClick={() =>
                void navigator.clipboard
                  .writeText(INSTALL[engine] ?? "")
                  .then(() => setCopied(true))
              }
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {engine === "codex" && (
            <p className="su-fine su-tight">
              If Terminal says npm isn’t found, install Node.js from nodejs.org
              first.
            </p>
          )}
          <button className="su-link" onClick={check}>
            I’ve installed it
          </button>
        </>
      )}
      {status !== null && status.state !== "ready" && !waiting && (
        <p className="su-fine">
          You can also finish this later, in Settings → Integrations.
        </p>
      )}
    </div>
  );
}

function Check(): React.JSX.Element {
  return (
    <svg className="su-check" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

/* ───────────── Spaces ───────────── */

type Update = (f: (d: SetupDraft) => SetupDraft) => void;

function SpacesStep({
  headRef,
  draft,
  update,
  existing,
  name,
  setName,
  onContinue,
}: {
  headRef: HeadRef;
  draft: SetupDraft;
  update: Update;
  existing: Existing[];
  name: string;
  setName(v: string): void;
  onContinue(): void;
}): React.JSX.Element {
  const [problem, setProblem] = useState("");
  const names = draft.spaces.map((s) => s.name);
  const full = draft.spaces.length >= MAX_SPACES;

  const add = (n: string): boolean => {
    const p = spaceNameProblem(n, names);
    if (p) {
      if (p !== "empty") setProblem(p);
      return false;
    }
    if (full) return false;
    update((d) => ({
      ...d,
      together: false,
      spaces: [...d.spaces, { key: newKey(), name: n.trim(), apps: [] }],
    }));
    setName("");
    setProblem("");
    return true;
  };
  const input = useRef<HTMLInputElement>(null);
  // The removed chip had focus: give it to the name field, not to the page.
  const remove = (key: string): void => {
    update((d) => ({ ...d, spaces: d.spaces.filter((s) => s.key !== key) }));
    input.current?.focus();
  };
  const colours = draftColours(draft, existing, false);
  // A second run offers the user's own spaces first (their apps go into them).
  const suggestions = [...existing.map((e) => e.name), ...SUGGESTED]
    .filter(
      (s, i, all) =>
        all.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i,
    )
    .filter((s) => spaceNameProblem(s, names) === null)
    .slice(0, 6);

  return (
    <>
      <Title headRef={headRef}>How would you like to organise your work?</Title>
      <p className="su-lede">
        A space for each company, project or part of your life, like Personal,
        Acme or Side project.
      </p>

      <div className={`su-spaces${draft.together ? " off" : ""}`}>
        {draft.spaces.length > 0 && (
          <ul className="su-chips" aria-label="Your spaces">
            {draft.spaces.map((s) => (
              <li key={s.key} className="su-chip">
                <span
                  className="su-dot"
                  style={{
                    background: colours.get(s.key),
                  }}
                />
                {s.name}
                <button
                  aria-label={`Remove ${s.name}`}
                  title="Remove"
                  onClick={() => remove(s.key)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="su-row">
          <input
            className="su-input"
            placeholder={
              draft.spaces.length ? "Another space" : "Name a space, like Acme"
            }
            ref={input}
            value={name}
            maxLength={40}
            disabled={full}
            aria-label="Space name"
            data-autofocus
            onChange={(e) => (setName(e.target.value), setProblem(""))}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              e.preventDefault();
              if (name.trim()) add(name);
              else if (draft.spaces.length > 0) onContinue();
            }}
          />
          <button
            className="su-btn"
            disabled={!name.trim() || full}
            onClick={() => add(name)}
          >
            Add
          </button>
        </div>
        {problem && <p className="su-error">{problem}</p>}
        {full && (
          <p className="su-fine">
            That’s {MAX_SPACES} spaces, the most the setup makes. You can add
            more later.
          </p>
        )}
        {suggestions.length > 0 && !full && (
          <div className="su-suggest">
            <span>Ideas:</span>
            {suggestions.map((s) => (
              <button key={s} onClick={() => add(s)}>
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="su-together">
        <input
          type="checkbox"
          checked={draft.together}
          onChange={(e) => {
            const on = e.target.checked;
            // Apps already picked for spaces move to the single list (nothing chosen is lost).
            update((d) => ({
              ...d,
              together: on,
              loose:
                on && d.loose.length === 0
                  ? d.spaces.flatMap((sp) => sp.apps)
                  : d.loose,
            }));
          }}
        />
        <span>
          <strong>Keep everything together</strong>
          <span>
            All your apps in one list, without spaces. You can make spaces
            later.
          </span>
        </span>
      </label>
    </>
  );
}

/* ───────────── Apps ───────────── */

function AppsStep({
  headRef,
  draft,
  space,
  update,
  count,
}: {
  headRef: HeadRef;
  draft: SetupDraft;
  space: number;
  update: Update;
  count: number;
}): React.JSX.Element {
  const s = space >= 0 ? draft.spaces[space] : undefined;
  const apps = s ? s.apps : draft.loose;
  const [site, setSite] = useState("");
  // An address typed but not added is kept when the user moves on.
  const leftOver = useRef<() => void>(() => {});
  useEffect(() => () => leftOver.current(), []);
  const [siteOpen, setSiteOpen] = useState(false);
  const [siteError, setSiteError] = useState("");
  const full = apps.length >= MAX_APPS;

  const setApps = (f: (a: DraftApp[]) => DraftApp[]): void =>
    update((d) =>
      space >= 0
        ? {
            ...d,
            spaces: d.spaces.map((x, i) =>
              i === space ? { ...x, apps: f(x.apps) } : x,
            ),
          }
        : { ...d, loose: f(d.loose) },
    );
  const countOf = (id: ServiceId): number =>
    apps.filter((a) => a.service === id).length;
  // A second account of a kind goes next to the first (the sidebar keeps this order).
  const addOne = (id: ServiceId, url?: string): void =>
    setApps((a) => {
      if (a.length >= MAX_APPS) return a;
      const app = { key: newKey(), service: id, ...(url ? { url } : {}) };
      const at = a.map((x) => x.service).lastIndexOf(id) + 1 || a.length;
      return [...a.slice(0, at), app, ...a.slice(at)];
    });
  const removeLast = (id: ServiceId): void =>
    setApps((a) => {
      const i = a.map((x) => x.service).lastIndexOf(id);
      return i < 0 ? a : [...a.slice(0, i), ...a.slice(i + 1)];
    });
  // After a removal, focus stays on the tile (not lost to the page).
  const focusTile = (id: ServiceId): void => {
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLButtonElement>(`.su-tile-main[data-service="${id}"]`)
        ?.focus(),
    );
  };
  // On: off. With several accounts of a kind, a click takes one away (like −), never all at once.
  const toggle = (id: ServiceId): void =>
    countOf(id) > 0 ? removeLast(id) : addOne(id);

  const sites = apps.filter((a) => a.service === "custom");
  const siteNames = appNames(apps);
  leftOver.current = () => {
    const url = cleanSiteUrl(site.trim());
    if (url && !sites.some((x) => x.url === url) && apps.length < MAX_APPS)
      addOne("custom", url);
  };
  const addSite = (): void => {
    const url = cleanSiteUrl(site.trim());
    if (!url)
      return setSiteError(
        "That doesn’t look like a web address. Try something like notion.so.",
      );
    if (sites.some((x) => x.url === url))
      return setSiteError("It’s already in the list.");
    addOne("custom", url);
    setSite("");
    setSiteError("");
  };

  const title = s ? `Which apps go in ${s.name}?` : "Which apps do you use?";
  return (
    <>
      <Title headRef={headRef}>{title}</Title>
      <p className="su-lede">
        Pick as many as you like
        {s && count > 1 ? `. ${s.name} is space ${space + 1} of ${count}` : ""}.
        You’ll sign in to each one at the end.
      </p>

      <div className="su-tiles">
        {SERVICES.map((svc) => {
          const n = countOf(svc.id);
          return (
            <div key={svc.id} className={`su-tile${n ? " on" : ""}`}>
              <button
                className="su-tile-main"
                data-service={svc.id}
                aria-pressed={n > 0}
                onClick={() => toggle(svc.id)}
                disabled={!n && full}
              >
                <ServiceLogo service={svc.id} className="su-logo" />
                <span className="su-tile-text">
                  <strong>{svc.name}</strong>
                  <span>{n > 1 ? `${n} accounts` : svc.what}</span>
                </span>
                <span className="su-tick" aria-hidden="true">
                  <Check />
                </span>
              </button>
              {n > 0 && (
                <span className="su-stepper">
                  <button
                    aria-label={`One ${svc.name} account fewer`}
                    onClick={() => {
                      const last = n === 1;
                      removeLast(svc.id);
                      if (last) focusTile(svc.id); // the − goes away with the last one
                    }}
                  >
                    −
                  </button>
                  <button
                    aria-label={`Another ${svc.name} account`}
                    title={`Another ${svc.name} account`}
                    onClick={() => addOne(svc.id)}
                    disabled={full}
                  >
                    +
                  </button>
                </span>
              )}
            </div>
          );
        })}
        <div className={`su-tile${sites.length ? " on" : ""}`}>
          <button
            className="su-tile-main"
            data-service="custom"
            aria-expanded={siteOpen}
            onClick={() => setSiteOpen((o) => !o)}
            disabled={full && !sites.length}
          >
            <ServiceLogo service="custom" className="su-logo" />
            <span className="su-tile-text">
              <strong>Any website</strong>
              <span>
                {sites.length
                  ? `${sites.length} added`
                  : "Notion, HubSpot, Jira…"}
              </span>
            </span>
            <span className="su-tick" aria-hidden="true">
              <Check />
            </span>
          </button>
        </div>
      </div>

      {(siteOpen || sites.length > 0) && (
        <div className="su-sites">
          {sites.length > 0 && (
            <ul className="su-chips">
              {apps.map((a, i) =>
                a.service === "custom" ? (
                  <li key={a.key} className="su-chip" title={a.url}>
                    {siteNames[i]}
                    <button
                      aria-label={`Remove ${siteNames[i]}`}
                      onClick={() => {
                        setApps((list) => list.filter((x) => x.key !== a.key));
                        focusTile("custom");
                      }}
                    >
                      ×
                    </button>
                  </li>
                ) : null,
              )}
            </ul>
          )}
          {siteOpen && (
            <>
              <div className="su-row">
                <input
                  className="su-input"
                  placeholder="Web address, like notion.so"
                  value={site}
                  autoFocus
                  spellCheck={false}
                  aria-label="Web address"
                  disabled={full}
                  onChange={(e) => (setSite(e.target.value), setSiteError(""))}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.nativeEvent.isComposing &&
                      site.trim()
                    )
                      (e.preventDefault(), addSite());
                  }}
                />
                <button
                  className="su-btn"
                  disabled={!site.trim() || full}
                  onClick={addSite}
                >
                  Add
                </button>
              </div>
              {siteError && <p className="su-error">{siteError}</p>}
            </>
          )}
        </div>
      )}

      {full && (
        <p className="su-fine">
          That’s {MAX_APPS} apps, the most for one space here. You can add more
          later.
        </p>
      )}
      {s && apps.length === 0 && (
        <p className="su-fine">
          A space needs at least one app. With none, {s.name} is left out; you
          can make it later.
        </p>
      )}
    </>
  );
}

/* ───────────── Ready ───────────── */

function ReadyStep({
  headRef,
  existing,
  draft,
  update,
  appCount,
  error,
}: {
  headRef: HeadRef;
  existing: Existing[];
  draft: SetupDraft;
  update: Update;
  appCount: number;
  error: string;
}): React.JSX.Element {
  const plan = planOf(draft);
  const cols = spaceColours(
    plan.spaces.map((s) => s.name),
    existing,
  );
  const groups = draft.together
    ? [{ name: "", apps: plan.apps, color: "" }]
    : plan.spaces.map((s, i) => ({ ...s, color: cols[i] }));
  const first = groups.find((g) => g.apps.length)?.apps[0];
  const name = ENGINE_NAME[draft.engine];

  if (appCount === 0)
    return (
      <>
        <Title headRef={headRef}>Nothing to add yet</Title>
        <p className="su-lede">
          You haven’t picked any apps. Go back to choose some, or open Mission Desk
          and add them one by one with the + in the sidebar.
        </p>
      </>
    );

  return (
    <>
      <Title headRef={headRef}>Ready to sign in</Title>
      <p className="su-lede">
        Mission Desk adds {appCount === 1 ? "your app" : `your ${appCount} apps`}
        {plan.spaces.length > 1 ? ` in ${plan.spaces.length} spaces` : ""} and
        opens {first?.name} first. Sign in to each one once; it stays signed in
        on this Mac.
      </p>

      <div className="su-summary">
        {groups.map((g) => (
          <div key={g.name || "all"} className="su-sum-row">
            {g.name && (
              <span className="su-sum-name">
                <span className="su-dot" style={{ background: g.color }} />
                <span>
                  {g.name}
                  {existing.some(
                    (e) => e.name.trim().toLowerCase() === g.name.toLowerCase(),
                  ) && <small>Already there: adds to it</small>}
                </span>
              </span>
            )}
            <span className="su-sum-apps">
              {g.apps.map((a) => (
                <span key={a.name} className="su-sum-app" title={a.name}>
                  <ServiceLogo service={a.service} className="su-logo sm" />
                  {a.name}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>

      {draft.engine !== "off" && (
        <label className="su-together">
          <input
            type="checkbox"
            checked={draft.reads}
            onChange={(e) => update((d) => ({ ...d, reads: e.target.checked }))}
          />
          <span>
            <strong>Let {name} read these apps</strong>
            <span>
              So it can brief you and find who’s waiting on you. It can’t type,
              click or send in them. You can change this per app in Settings.
            </span>
          </span>
        </label>
      )}
      {error && <p className="su-error">{error}</p>}
    </>
  );
}

/* ───────────── The dock taking shape ───────────── */

const EXAMPLE: { name: string; apps: ServiceId[] }[] = [
  { name: "Personal", apps: ["google", "whatsapp"] },
  { name: "Acme", apps: ["microsoft", "slack"] },
  { name: "Side project", apps: ["google", "discord"] },
];

/** A miniature of the sidebar, built from the answers as they come. */
function DockPreview({
  draft,
  step,
  existing,
}: {
  draft: SetupDraft;
  step: SetupStep;
  existing: Existing[];
}): React.JSX.Element {
  const example = step.kind === "welcome";
  // On the last step, exactly what gets created (a space left empty is grey: it won't be).
  const colours = draftColours(draft, existing, step.kind === "ready");
  const groups: {
    key: string;
    name: string;
    color: string;
    apps: { key: string; service: ServiceId }[];
    current: boolean;
  }[] = example
    ? EXAMPLE.map((g, i) => ({
        key: g.name,
        name: g.name,
        color: spaceColours(["", "", ""], [])[i],
        apps: g.apps.map((s, j) => ({ key: `${i}${j}`, service: s })),
        current: false,
      }))
    : draft.together
      ? [
          {
            key: "all",
            name: "",
            color: "",
            apps: draft.loose,
            current: step.kind === "apps",
          },
        ]
      : draft.spaces.map((s, i) => ({
          key: s.key,
          name: s.name,
          color: colours.get(s.key) ?? GREY,
          apps: s.apps,
          current: step.kind === "apps" && step.space === i,
        }));
  const empty = groups.every((g) => !g.name && g.apps.length === 0);

  return (
    <aside className={`su-dock${example ? " example" : ""}`} aria-hidden="true">
      <div className="su-dock-col">
        <div className="su-home" title="Home">
          <svg viewBox="0 0 24 24">
            <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
          </svg>
        </div>
        <div className="su-dock-list">
          {groups.map((g) => (
            <div
              key={g.key}
              className={`su-dock-group${g.current ? " current" : ""}`}
            >
              {g.name && (
                <div className="su-dock-label">
                  <span className="su-dot" style={{ background: g.color }} />
                  <span>{g.name}</span>
                </div>
              )}
              <div className="su-dock-apps">
                {g.apps.map((a) => (
                  <span key={a.key} className="su-dock-app">
                    <ServiceLogo service={a.service} />
                  </span>
                ))}
                {g.apps.length === 0 && g.name && (
                  <span className="su-dock-slot" />
                )}
              </div>
            </div>
          ))}
          {empty && (
            <p className="su-dock-empty">
              {draft.together && !example
                ? "Your apps will appear here."
                : "Your spaces will appear here."}
            </p>
          )}
        </div>
        {draft.engine !== "off" && !example && (
          <div className="su-dock-fab" title={ENGINE_NAME[draft.engine]}>
            ✦
          </div>
        )}
      </div>
      <p className="su-dock-caption">
        {example
          ? "An example. Yours takes shape as you answer."
          : "Your Mission Desk"}
      </p>
    </aside>
  );
}
