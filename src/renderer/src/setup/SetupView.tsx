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
import {
  BUILTIN,
  CONNECTION_KINDS,
  type ConnectionInfo,
  type ConnectionKind,
  type ConnectionState,
} from "../../../shared/connections";
import { cleanSiteUrl } from "../../../shared/custom-site";
import {
  appNames,
  assistantsInPlan,
  hasMeetingApps,
  planOf,
  setupSteps,
  spaceColours,
  spaceNameProblem,
  type DraftApp,
  type SetupAssistant,
  type SetupDraft,
  type SetupPlan,
  type SetupStep,
} from "../../../shared/setup";
import type { ServiceId } from "../../../shared/types";
import { isLocale, LOCALE_NAMES, LOCALES } from "../../../shared/i18n/locales";
import { locale, rich, t } from "../i18n";
import { useModal } from "../modal";
import { ServiceLogo } from "../service-glyph";
import { meetingsAvailable } from "../settings/MeetingsSettings";
import {
  connectionLabel,
  KIND_NAME,
  NewConnectionWizard,
} from "../settings/ConnectionsSettings";
import "./setup.css";

const SERVICES: {
  id: Exclude<ServiceId, "custom">;
  name: string;
  what: string;
}[] = [
  { id: "google", name: "Google", what: t("setup.service.googleWhat") },
  { id: "microsoft", name: "Microsoft 365", what: "Outlook, Teams" },
  { id: "slack", name: "Slack", what: t("setup.service.slackWhat") },
  { id: "whatsapp", name: "WhatsApp", what: t("setup.service.whatsappWhat") },
  { id: "telegram", name: "Telegram", what: t("setup.service.telegramWhat") },
  { id: "linkedin", name: "LinkedIn", what: t("setup.service.linkedinWhat") },
  { id: "discord", name: "Discord", what: t("setup.service.discordWhat") },
  { id: "zoom", name: "Zoom", what: t("setup.service.zoomWhat") },
  { id: "notion", name: "Notion", what: t("setup.service.notionWhat") },
  { id: "proton", name: "Proton Mail", what: t("setup.service.protonWhat") },
  { id: "icloud", name: "iCloud Mail", what: t("setup.service.icloudWhat") },
  { id: "fastmail", name: "Fastmail", what: t("setup.service.fastmailWhat") },
];
const SUGGESTED = [
  t("setup.spaceName.personal"),
  t("setup.spaceName.work"),
  t("setup.spaceName.sideProject"),
];
const MAX_SPACES = 20;
const MAX_APPS = 12;
const ENGINE_NAME: Record<AssistantEngine, string> = {
  claude: "Claude",
  codex: "Codex",
  openrouter: "OpenRouter",
  off: "",
};
const STAGES = [
  t("setup.stage.welcome"),
  t("setup.stage.spaces"),
  t("setup.stage.apps"),
  t("setup.stage.assistant"),
  t("setup.stage.ready"),
];
const STAGE_OF: Record<SetupStep["kind"], number> = {
  welcome: 0,
  spaces: 1,
  apps: 2,
  assistant: 3,
  ready: 4,
};
/** Meetings are transcribed on macOS only. */
const isMac = meetingsAvailable(window.missiondesk?.platform ?? "darwin");

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
  connection: "",
  perSpace: false,
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
  // The assistant connections (Settings → Integrations), looked up once and again after a change.
  const [conns, setConns] = useState<ConnectionInfo[] | null>(null);
  const refreshConns = useCallback(async (): Promise<ConnectionInfo[]> => {
    const l = await window.missiondesk.connectionsInfo().catch(() => []);
    setConns(l);
    return l;
  }, []);
  useEffect(() => {
    void refreshConns();
  }, [refreshConns]);
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
      setError(t("setup.finishError"));
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
      const el = e.target as HTMLElement;
      const inField =
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.tagName === "SELECT";
      const onControl =
        el.tagName === "BUTTON" ||
        el.tagName === "A" ||
        el.getAttribute("role") === "radio";
      // Only from the screen itself (its title has focus), never from <body> after a removal.
      const onScreen = el === headRef.current;
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
        !(inField && (el as HTMLInputElement).value) &&
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

  const stage = STAGE_OF[step.kind];
  const appsSteps = steps.filter((s) => s.kind === "apps").length;
  const appsDone =
    step.kind === "apps"
      ? steps.indexOf(step) - steps.findIndex((s) => s.kind === "apps") + 1
      : stage > STAGE_OF.apps
        ? appsSteps
        : 0;

  return (
    <div
      className="su"
      role="dialog"
      aria-modal="true"
      aria-labelledby="su-title"
    >
      <DockPreview
        draft={draft}
        step={step}
        existing={existing}
        conns={conns}
      />
      <section className="su-main">
        <header className="su-top">
          <ol
            className="su-progress"
            aria-label={t("setup.progressLabel", {
              step: stage + 1,
              total: STAGES.length,
              stage: STAGES[stage],
            })}
          >
            {STAGES.map((s, i) => (
              <li
                key={s}
                className={i < stage ? "done" : i === stage ? "now" : ""}
              >
                <span
                  className="su-bar"
                  style={
                    i === STAGE_OF.apps &&
                    stage === STAGE_OF.apps &&
                    appsSteps > 1
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
              title={t("setup.skipTitle")}
            >
              {hasAccounts ? t("common.close") : t("setup.skip")}
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
                  draft={draft}
                  update={update}
                  existing={existing}
                  conns={conns}
                  refresh={refreshConns}
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
                  conns={conns}
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
                  {t("common.back")}
                </button>
              ) : (
                <span className="su-note">{t("setup.nav.aboutAMinute")}</span>
              )}
              {!canGo && (
                <span className="su-note su-why">
                  {t("setup.nav.needSpace")}
                </span>
              )}
              <button
                className="su-go"
                onClick={next}
                disabled={!canGo || finishing}
              >
                {step.kind === "welcome"
                  ? t("setup.nav.getStarted")
                  : step.kind === "ready"
                    ? finishing
                      ? t("setup.nav.settingUp")
                      : appCount > 0
                        ? t("setup.nav.startSigningIn")
                        : t("setup.nav.openMissionDesk")
                    : t("setup.nav.continue")}
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
      {!again && <LanguagePicker />}
      <Title headRef={headRef}>
        {again ? t("setup.welcome.titleAgain") : t("setup.welcome.title")}
      </Title>
      <p className="su-lede">
        {again ? t("setup.welcome.ledeAgain") : t("setup.welcome.lede")}
      </p>
      {!again && (
        <ul className="su-points">
          <li>
            <Glyph d="M4 5h6v14H4zM14 5h6v14h-6z" />
            <div>
              <strong>{t("setup.welcome.accountsTitle")}</strong>
              <span>{t("setup.welcome.accountsText")}</span>
            </div>
          </li>
          <li>
            <Glyph d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
            <div>
              <strong>{t("setup.welcome.homeTitle")}</strong>
              <span>{t("setup.welcome.homeText")}</span>
            </div>
          </li>
          <li>
            <Glyph d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" />
            <div>
              <strong>{t("setup.welcome.assistantTitle")}</strong>
              <span>{t("setup.welcome.assistantText")}</span>
            </div>
          </li>
          {isMac && (
            <li>
              <Glyph d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />
              <div>
                <strong>{t("setup.welcome.meetingsTitle")}</strong>
                <span>{t("setup.welcome.meetingsText")}</span>
              </div>
            </li>
          )}
        </ul>
      )}
    </>
  );
}

/**
 * The interface language, asked before anything else. It starts on the Mac's language; choosing
 * another switches at once (every page reloads, and the setup opens again here, with nothing lost
 * since nothing has been chosen yet). Choosing the Mac's language keeps following the Mac.
 */
function LanguagePicker(): React.JSX.Element {
  const system = window.missiondesk.locale?.system ?? "en";
  return (
    <label className="su-lang">
      <Glyph d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
      <span className="su-lang-name">{t("settings.language.title")}</span>
      <select
        value={locale()}
        onChange={(e) => {
          const v = e.target.value;
          if (!isLocale(v) || v === locale()) return;
          window.missiondesk.setLanguage(v === system ? "system" : v);
        }}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
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

/** One choice on the assistant screen: a connection (or none), as Settings → Integrations names it. */
type Choice = SetupAssistant & {
  name: string;
  hint: string;
  state?: ConnectionState;
};

const BUILTIN_HINT: Record<ConnectionKind, string> = {
  claude: t("setup.assistant.claudeHint"),
  codex: t("setup.assistant.codexHint"),
  openrouter: t("setup.assistant.openrouterHint"),
};

const choiceValue = (a: SetupAssistant): string =>
  a.engine === "off" ? "off" : `${a.engine}|${a.connection}`;
const sameChoice = (a: SetupAssistant, b: SetupAssistant): boolean =>
  choiceValue(a) === choiceValue(b);

/**
 * Every type's own connection on this Mac first (always there: the setup can install or connect it),
 * then the connections added in Settings, then none.
 */
function choicesOf(conns: ConnectionInfo[] | null): Choice[] {
  const out: Choice[] = [];
  for (const kind of CONNECTION_KINDS) {
    const own = conns?.find((c) => c.id === BUILTIN[kind]);
    out.push({
      engine: kind,
      connection: "",
      name: connectionLabel(own ?? { kind, name: "", builtin: true }),
      hint: BUILTIN_HINT[kind],
      state: own?.state,
    });
    for (const c of conns?.filter((x) => x.kind === kind && !x.builtin) ??
      []) {
      const state =
        c.state === "ready"
          ? ""
          : c.state === "signed-out"
            ? kind === "openrouter"
              ? t("settings.integrations.notConnected")
              : t("settings.integrations.signedOut")
            : t("settings.integrations.notInstalled");
      out.push({
        engine: kind,
        connection: c.id,
        name: connectionLabel(c),
        hint: [t(KIND_NAME[kind]), c.email, state].filter(Boolean).join(" · "),
        state: c.state,
      });
    }
  }
  out.push({
    engine: "off",
    connection: "",
    name: t("setup.assistant.offName"),
    hint: t("setup.assistant.offHint"),
  });
  return out;
}

/** What an assistant is called on the summary ("Claude Acme"), or no assistant. */
function assistantName(
  a: SetupAssistant,
  conns: ConnectionInfo[] | null,
): string {
  if (a.engine === "off") return t("setup.ready.noAssistant");
  return (
    choicesOf(conns).find((c) => sameChoice(c, a))?.name ??
    t(KIND_NAME[a.engine])
  );
}

function AssistantStep({
  headRef,
  draft,
  update,
  existing,
  conns,
  refresh,
}: {
  headRef: HeadRef;
  draft: SetupDraft;
  update: Update;
  existing: Existing[];
  conns: ConnectionInfo[] | null;
  refresh(): Promise<ConnectionInfo[]>;
}): React.JSX.Element {
  const [adding, setAdding] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const choices = choicesOf(conns);
  const picked: SetupAssistant = {
    engine: draft.engine,
    connection: draft.connection,
  };
  const at = Math.max(
    0,
    choices.findIndex((c) => sameChoice(c, picked)),
  );
  const pick = (a: SetupAssistant): void =>
    update((d) => ({ ...d, engine: a.engine, connection: a.connection }));
  const move = (delta: number): void => {
    const i = (at + delta + choices.length) % choices.length;
    pick(choices[i]);
    refs.current[i]?.focus();
  };
  const current = choices[at];
  const plan = planOf(draft);
  // Spaces this run creates (one already there keeps the assistant it has).
  const isExisting = (name: string): boolean =>
    existing.some(
      (e) => e.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
  const spaces = draft.together
    ? []
    : draft.spaces.filter((s) => s.apps.length > 0);
  const newSpaces = spaces.filter((s) => !isExisting(s.name));
  // Back to one new space (or none): the choice per space is gone from the screen, so it no longer applies.
  const canPerSpace = newSpaces.length > 1;
  useEffect(() => {
    if (!canPerSpace && draft.perSpace)
      update((d) => ({ ...d, perSpace: false }));
  }, [canPerSpace, draft.perSpace, update]);
  const setOwn =(key: string, value: string): void =>
    update((d) => ({
      ...d,
      spaces: d.spaces.map((s) => {
        if (s.key !== key) return s;
        if (!value) return { ...s, assistant: undefined };
        const c = choices.find((x) => choiceValue(x) === value);
        return c
          ? { ...s, assistant: { engine: c.engine, connection: c.connection } }
          : s;
      }),
    }));

  async function created(): Promise<void> {
    const before = new Set((conns ?? []).map((c) => c.id));
    const after = await refresh();
    const added = after.find((c) => !before.has(c.id) && !c.builtin);
    if (added) pick({ engine: added.kind, connection: added.id });
  }

  return (
    <>
      <Title headRef={headRef}>{t("setup.assistant.title")}</Title>
      <p className="su-lede">{t("setup.assistant.lede")}</p>
      <div
        className="su-choices"
        role="radiogroup"
        aria-label={t("setup.assistant.groupLabel")}
      >
        {choices.map((c, i) => {
          const on = i === at;
          return (
            <button
              key={choiceValue(c)}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              className={`su-choice${on ? " on" : ""}${c.engine === "off" ? " quiet" : ""}`}
              onClick={() => pick(c)}
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
          );
        })}
      </div>
      {current.engine !== "off" &&
        (current.connection === "" ? (
          <EngineConnect
            key={current.engine}
            engine={current.engine}
            onChange={() => void refresh()}
          />
        ) : (
          current.state !== "ready" && (
            <AddedConnect
              key={current.connection}
              choice={current}
              onDone={() => void refresh()}
            />
          )
        ))}

      {adding ? (
        <div className="su-wizard">
          <NewConnectionWizard
            list={conns ?? []}
            onRefresh={() => void refresh()}
            onClose={(ok) => {
              setAdding(false);
              if (ok) void created();
            }}
          />
        </div>
      ) : (
        <button className="su-link su-add" onClick={() => setAdding(true)}>
          {t("setup.assistant.addAnother")}
        </button>
      )}

      {newSpaces.length > 1 && (
        <label className="su-together">
          <input
            type="checkbox"
            checked={draft.perSpace}
            onChange={(e) =>
              update((d) => ({ ...d, perSpace: e.target.checked }))
            }
          />
          <span>
            <strong>{t("setup.assistant.perSpaceTitle")}</strong>
            <span>{t("setup.assistant.perSpaceText")}</span>
          </span>
        </label>
      )}
      {draft.perSpace && newSpaces.length > 1 && (
        <ul className="su-per-space">
          {spaces.map((s) => (
            <li key={s.key}>
              <span className="su-sum-name">{s.name}</span>
              {isExisting(s.name) ? (
                <span className="su-fine su-tight">
                  {t("setup.ready.keepsAssistant")}
                </span>
              ) : (
                <select
                  className="su-select"
                  aria-label={t("setup.assistant.spaceLabel", {
                    name: s.name,
                  })}
                  value={s.assistant ? choiceValue(s.assistant) : ""}
                  onChange={(e) => setOwn(s.key, e.target.value)}
                >
                  <option value="">
                    {t("setup.assistant.sameAsAbove", { name: current.name })}
                  </option>
                  {choices.map((c) => (
                    <option key={choiceValue(c)} value={choiceValue(c)}>
                      {c.engine === "off" ? t("setup.ready.noAssistant") : c.name}
                    </option>
                  ))}
                </select>
              )}
            </li>
          ))}
        </ul>
      )}

      {assistantsInPlan(plan) && (
        <>
          {isMac && hasMeetingApps(draft) && (
            <p className="su-fine">{t("setup.assistant.meetings")}</p>
          )}
          <label className="su-together">
            <input
              type="checkbox"
              checked={draft.reads}
              onChange={(e) =>
                update((d) => ({ ...d, reads: e.target.checked }))
              }
            />
            <span>
              <strong>{t("setup.assistant.readsTitle")}</strong>
              <span>{t("setup.ready.readsText")}</span>
            </span>
          </label>
        </>
      )}
    </>
  );
}

/** An added connection that isn't ready: sign in again (the browser), or a new OpenRouter key. */
function AddedConnect({
  choice,
  onDone,
}: {
  choice: Choice;
  onDone(): void;
}): React.JSX.Element {
  const md = window.missiondesk;
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const live = useRef(true);
  const busyRef = useRef(false);
  busyRef.current = busy;
  // Leaving the screen while the browser sign-in waits stops it.
  useEffect(
    () => () => {
      live.current = false;
      if (busyRef.current) md.connectionCancel();
    },
    [md],
  );
  async function signIn(k?: string): Promise<void> {
    setBusy(true);
    setError("");
    const r = await md.connectionSignIn(choice.connection, k);
    if (!live.current) return;
    setBusy(false);
    if (r.ok) onDone();
    else setError(r.error);
  }
  if (choice.state === "not-installed")
    return (
      <div className="su-connect">
        <p className="su-state">
          {choice.engine === "claude"
            ? t("setup.engine.installClaude")
            : t("setup.engine.installCodex")}
        </p>
        <div className="su-cmd">
          <code>{INSTALL[choice.engine]}</code>
        </div>
        <button className="su-link" onClick={onDone}>
          {t("setup.engine.installedIt")}
        </button>
      </div>
    );
  return (
    <div className="su-connect" aria-live="polite">
      {choice.engine === "openrouter" ? (
        <>
          <label className="su-label" htmlFor="su-key">
            {t("setup.engine.keyLabel")}
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
                  (e.preventDefault(), void signIn(key.trim()));
              }}
            />
            <button
              className="su-btn"
              disabled={!key.trim() || busy}
              onClick={() => void signIn(key.trim())}
            >
              {busy ? t("setup.engine.checkingKey") : t("setup.engine.connect")}
            </button>
          </div>
        </>
      ) : busy ? (
        <p className="su-state">
          <span className="su-spin" aria-hidden="true" />{" "}
          {t("setup.engine.finishInBrowser")}{" "}
          <button className="su-link" onClick={() => md.connectionCancel()}>
            {t("common.cancel")}
          </button>
        </p>
      ) : (
        <div className="su-row spread">
          <p className="su-state">
            {t("setup.assistant.signInAgain", { name: choice.name })}
          </p>
          <button className="su-btn" onClick={() => void signIn()}>
            {t("setup.engine.signIn")}
          </button>
        </div>
      )}
      {error && <p className="su-error">{error}</p>}
    </div>
  );
}

const INSTALL: Partial<Record<AssistantEngine, string>> = {
  claude: "curl -fsSL https://claude.ai/install.sh | bash",
  codex: "npm install -g @openai/codex",
};

/** Connect the chosen assistant right here (or later, in Settings → Integrations). */
function EngineConnect({
  engine,
  onChange,
}: {
  engine: AssistantEngine;
  /** Its state changed (signed in, key saved, installed): the choices' labels follow. */
  onChange?(): void;
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
  // The latest callback, without making `check` change (and look again) on every render.
  const changed = useRef(onChange);
  changed.current = onChange;

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
      .then((s) => {
        if (!live.current) return;
        setStatus(s);
        changed.current?.();
      })
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
    changed.current?.();
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
      changed.current?.();
    } else setError(r.error ?? t("setup.engine.keyRefused"));
  }

  return (
    <div className="su-connect" aria-live="polite">
      {status === null ? (
        <p className="su-state">
          <span className="su-spin" aria-hidden="true" />{" "}
          {t("setup.engine.checking", {
            name: engine === "openrouter" ? "OpenRouter" : app,
          })}
        </p>
      ) : status.state === "ready" ? (
        <p className="su-state ok">
          <Check />{" "}
          {engine === "openrouter"
            ? t("setup.engine.readyOpenRouter", { name })
            : t("setup.engine.readySignedIn", { app, name })}
        </p>
      ) : engine === "openrouter" ? (
        <>
          <label className="su-label" htmlFor="su-key">
            {t("setup.engine.keyLabel")}
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
              {busy ? t("setup.engine.checkingKey") : t("setup.engine.connect")}
            </button>
          </div>
          {error && <p className="su-error">{error}</p>}
          <p className="su-fine">
            {rich("setup.engine.keyHelp", {
              link: (s) => (
                <a
                  href="https://openrouter.ai/keys"
                  onClick={(e) => {
                    e.preventDefault();
                    window.missiondesk.openExternal(
                      "https://openrouter.ai/keys",
                    );
                  }}
                >
                  {s}
                </a>
              ),
            })}
          </p>
        </>
      ) : status.state === "signed-out" ? (
        waiting ? (
          <p className="su-state">
            <span className="su-spin" aria-hidden="true" />{" "}
            {t("setup.engine.finishInBrowser")}{" "}
            <button
              className="su-link"
              onClick={() =>
                engine === "claude"
                  ? window.missiondesk.assistantSignInCancel()
                  : window.missiondesk.codexSignInCancel()
              }
            >
              {t("common.cancel")}
            </button>
          </p>
        ) : (
          <div className="su-row spread">
            <p className="su-state">
              {t("setup.engine.installed", {
                app,
                account: engine === "claude" ? "Claude" : "ChatGPT",
              })}
            </p>
            <button className="su-btn" onClick={() => void signIn()}>
              {t("setup.engine.signIn")}
            </button>
          </div>
        )
      ) : (
        <>
          <p className="su-state">
            {engine === "claude"
              ? t("setup.engine.installClaude")
              : t("setup.engine.installCodex")}
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
              {copied ? t("setup.engine.copied") : t("setup.engine.copy")}
            </button>
          </div>
          {engine === "codex" && (
            <p className="su-fine su-tight">{t("setup.engine.npmMissing")}</p>
          )}
          <button className="su-link" onClick={check}>
            {t("setup.engine.installedIt")}
          </button>
        </>
      )}
      {status !== null && status.state !== "ready" && !waiting && (
        <p className="su-fine">{t("setup.engine.later")}</p>
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
      <Title headRef={headRef}>{t("setup.spaces.title")}</Title>
      <p className="su-lede">{t("setup.spaces.lede")}</p>

      <div className={`su-spaces${draft.together ? " off" : ""}`}>
        {draft.spaces.length > 0 && (
          <ul className="su-chips" aria-label={t("setup.spaces.listLabel")}>
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
                  aria-label={t("setup.remove", { name: s.name })}
                  title={t("common.remove")}
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
              draft.spaces.length
                ? t("setup.spaces.placeholderMore")
                : t("setup.spaces.placeholderFirst")
            }
            ref={input}
            value={name}
            maxLength={40}
            disabled={full}
            aria-label={t("setup.spaces.nameLabel")}
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
            {t("common.add")}
          </button>
        </div>
        {problem && <p className="su-error">{problem}</p>}
        {full && (
          <p className="su-fine">
            {t("setup.spaces.full", { count: MAX_SPACES })}
          </p>
        )}
        {suggestions.length > 0 && !full && (
          <div className="su-suggest">
            <span>{t("setup.spaces.ideas")}</span>
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
          <strong>{t("setup.spaces.togetherTitle")}</strong>
          <span>{t("setup.spaces.togetherText")}</span>
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
    if (!url) return setSiteError(t("setup.apps.badAddress"));
    if (sites.some((x) => x.url === url))
      return setSiteError(t("setup.apps.alreadyListed"));
    addOne("custom", url);
    setSite("");
    setSiteError("");
  };

  const title = s
    ? t("setup.apps.titleSpace", { name: s.name })
    : t("setup.apps.title");
  return (
    <>
      <Title headRef={headRef}>{title}</Title>
      <p className="su-lede">
        {s && count > 1
          ? t("setup.apps.ledeSpace", {
              name: s.name,
              n: space + 1,
              total: count,
            })
          : t("setup.apps.lede")}
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
                  <span>
                    {n > 1 ? t("setup.apps.accounts", { count: n }) : svc.what}
                  </span>
                </span>
                <span className="su-tick" aria-hidden="true">
                  <Check />
                </span>
              </button>
              {n > 0 && (
                <span className="su-stepper">
                  <button
                    aria-label={t("setup.apps.oneFewer", { name: svc.name })}
                    onClick={() => {
                      const last = n === 1;
                      removeLast(svc.id);
                      if (last) focusTile(svc.id); // the − goes away with the last one
                    }}
                  >
                    −
                  </button>
                  <button
                    aria-label={t("setup.apps.another", { name: svc.name })}
                    title={t("setup.apps.another", { name: svc.name })}
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
              <strong>{t("setup.apps.anyWebsite")}</strong>
              <span>
                {sites.length
                  ? t("setup.apps.sitesAdded", { count: sites.length })
                  : "HubSpot, Jira, Linear…"}
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
                      aria-label={t("setup.remove", { name: siteNames[i] })}
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
                  placeholder={t("setup.apps.addressPlaceholder")}
                  value={site}
                  autoFocus
                  spellCheck={false}
                  aria-label={t("setup.apps.addressLabel")}
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
                  {t("common.add")}
                </button>
              </div>
              {siteError && <p className="su-error">{siteError}</p>}
            </>
          )}
        </div>
      )}

      {full && (
        <p className="su-fine">{t("setup.apps.full", { count: MAX_APPS })}</p>
      )}
      {s && apps.length === 0 && (
        <p className="su-fine">{t("setup.apps.needsOne", { name: s.name })}</p>
      )}
    </>
  );
}

/* ───────────── Ready ───────────── */

function ReadyStep({
  headRef,
  existing,
  draft,
  conns,
  appCount,
  error,
}: {
  headRef: HeadRef;
  existing: Existing[];
  draft: SetupDraft;
  conns: ConnectionInfo[] | null;
  appCount: number;
  error: string;
}): React.JSX.Element {
  const plan = planOf(draft);
  const cols = spaceColours(
    plan.spaces.map((s) => s.name),
    existing,
  );
  const groups: {
    name: string;
    apps: SetupPlan["apps"];
    color: string;
    assistant?: SetupAssistant;
  }[] = draft.together
    ? [{ name: "", apps: plan.apps, color: "" }]
    : plan.spaces.map((s, i) => ({ ...s, color: cols[i] }));
  const first = groups.find((g) => g.apps.length)?.apps[0];
  const isExisting = (name: string): boolean =>
    !!name &&
    existing.some((e) => e.name.trim().toLowerCase() === name.toLowerCase());
  // Each place's assistant, as it will be (a space already there keeps its own).
  const assistantOf = (g: (typeof groups)[number]): string =>
    isExisting(g.name)
      ? t("setup.ready.keepsAssistant")
      : assistantName(g.assistant ?? plan, conns);

  if (appCount === 0)
    return (
      <>
        <Title headRef={headRef}>{t("setup.ready.nothingTitle")}</Title>
        <p className="su-lede">{t("setup.ready.nothingText")}</p>
      </>
    );

  return (
    <>
      <Title headRef={headRef}>{t("setup.ready.title")}</Title>
      <p className="su-lede">
        {plan.spaces.length > 1
          ? t("setup.ready.ledeSpaces", {
              count: appCount,
              spaces: plan.spaces.length,
              first: first?.name ?? "",
            })
          : t("setup.ready.lede", {
              count: appCount,
              first: first?.name ?? "",
            })}
      </p>

      <div className="su-summary">
        {groups.map((g) => (
          <div key={g.name || "all"} className="su-sum-row">
            {g.name && (
              <span className="su-sum-name">
                <span className="su-dot" style={{ background: g.color }} />
                <span>
                  {g.name}
                  {isExisting(g.name) && (
                    <small>{t("setup.ready.alreadyThere")}</small>
                  )}
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
            <span className="su-sum-ai">
              {(g.assistant ?? plan).engine !== "off" &&
                !isExisting(g.name) && <span aria-hidden="true">✦ </span>}
              {assistantOf(g)}
            </span>
          </div>
        ))}
      </div>
      {error && <p className="su-error">{error}</p>}
    </>
  );
}

/* ───────────── The dock taking shape ───────────── */

const EXAMPLE: { name: string; apps: ServiceId[] }[] = [
  { name: t("setup.spaceName.personal"), apps: ["google", "whatsapp"] },
  { name: "Acme", apps: ["microsoft", "slack"] },
  { name: t("setup.spaceName.sideProject"), apps: ["google", "discord"] },
];

/** A miniature of the sidebar, built from the answers as they come. */
function DockPreview({
  draft,
  step,
  existing,
  conns,
}: {
  draft: SetupDraft;
  step: SetupStep;
  existing: Existing[];
  conns: ConnectionInfo[] | null;
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
        <div className="su-home" title={t("setup.dock.home")}>
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
                ? t("setup.dock.appsHere")
                : t("setup.dock.spacesHere")}
            </p>
          )}
        </div>
        {assistantsInPlan(planOf(draft)) && !example && (
          <div
            className="su-dock-fab"
            title={assistantName(
              { engine: draft.engine, connection: draft.connection },
              conns,
            )}
          >
            ✦
          </div>
        )}
      </div>
      <p className="su-dock-caption">
        {example ? t("setup.dock.example") : t("setup.dock.yours")}
      </p>
    </aside>
  );
}
