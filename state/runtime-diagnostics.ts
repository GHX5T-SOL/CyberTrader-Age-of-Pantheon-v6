export type RuntimeDiagnosticKind =
  | "exception"
  | "unhandled-rejection"
  | "console-error"
  | "manual";

export interface RuntimeDiagnosticContext {
  route: string;
  platform: string;
  phase: string;
  activeView: string;
  tick: number;
  heat: number;
  balanceBand: string;
  selectedTicker: string;
  handlePresent: boolean;
  playerIdPresent: boolean;
  hydrated: boolean;
}

export interface RuntimeDiagnosticEntry {
  id: string;
  capturedAt: string;
  kind: RuntimeDiagnosticKind;
  message: string;
  stack?: string;
  fatal?: boolean;
  context: RuntimeDiagnosticContext;
}

export interface RuntimeDiagnosticsSnapshot {
  generatedAt: string;
  currentContext: RuntimeDiagnosticContext;
  entries: RuntimeDiagnosticEntry[];
}

interface RuntimeDiagnosticOptions {
  fatal?: boolean;
  context?: Partial<RuntimeDiagnosticContext>;
}

interface RuntimeDiagnosticsBridge {
  getSnapshot: () => RuntimeDiagnosticsSnapshot;
  formatReport: () => string;
  record: (message: string) => RuntimeDiagnosticEntry;
  clear: () => void;
}

interface ErrorUtilsLike {
  getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
  setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
}

interface RuntimeGlobal {
  ErrorUtils?: ErrorUtilsLike;
  __CYBERTRADER_QA_DIAGNOSTICS__?: RuntimeDiagnosticsBridge;
}

const MAX_DIAGNOSTIC_ENTRIES = 20;
const MAX_MESSAGE_LENGTH = 600;
const MAX_STACK_LENGTH = 2400;

const DEFAULT_CONTEXT: RuntimeDiagnosticContext = {
  route: "unknown",
  platform: "unknown",
  phase: "unknown",
  activeView: "unknown",
  tick: 0,
  heat: 0,
  balanceBand: "unknown",
  selectedTicker: "unknown",
  handlePresent: false,
  playerIdPresent: false,
  hydrated: false,
};

const entries: RuntimeDiagnosticEntry[] = [];

let nextDiagnosticId = 1;
let contextProvider: () => RuntimeDiagnosticContext = () => DEFAULT_CONTEXT;
let installed = false;
let cleanupFns: Array<() => void> = [];
let previousConsoleError: typeof console.error | null = null;

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

export function redactSensitiveText(value: string): string {
  return value
    .replace(
      /\b(api[_-]?key|access[_-]?token|auth[_-]?token|id[_-]?token|refresh[_-]?token|password|secret|service[_-]?role)\s*[:=]\s*["']?[^"'\s,;&?#})]+/gi,
      "$1=[REDACTED]",
    )
    .replace(/\bauthorization\s*[:=]\s*bearer\s+[^"'\s,;})]+/gi, "authorization=[REDACTED]")
    .replace(/\bbearer\s+[a-z0-9._-]{12,}/gi, "bearer [REDACTED]")
    .replace(
      /([?&](?:api[_-]?key|access[_-]?token|auth[_-]?token|id[_-]?token|refresh[_-]?token|secret)=)[^&#\s]+/gi,
      "$1[REDACTED]",
    )
    .replace(/\b[a-z0-9_-]{40,}\b/gi, "[REDACTED_LONG_VALUE]");
}

function stringifyUnknown(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function stackFromUnknown(value: unknown): string | undefined {
  if (value instanceof Error && value.stack) {
    return value.stack;
  }
  return undefined;
}

function normalizeContext(
  override: Partial<RuntimeDiagnosticContext> | undefined,
): RuntimeDiagnosticContext {
  const provided = contextProvider();
  const context = {
    ...DEFAULT_CONTEXT,
    ...provided,
    ...(override ?? {}),
  };

  return {
    route: redactSensitiveText(String(context.route || DEFAULT_CONTEXT.route)),
    platform: redactSensitiveText(String(context.platform || DEFAULT_CONTEXT.platform)),
    phase: redactSensitiveText(String(context.phase || DEFAULT_CONTEXT.phase)),
    activeView: redactSensitiveText(String(context.activeView || DEFAULT_CONTEXT.activeView)),
    tick: Number.isFinite(context.tick) ? context.tick : DEFAULT_CONTEXT.tick,
    heat: Number.isFinite(context.heat) ? context.heat : DEFAULT_CONTEXT.heat,
    balanceBand: redactSensitiveText(String(context.balanceBand || DEFAULT_CONTEXT.balanceBand)),
    selectedTicker: redactSensitiveText(String(context.selectedTicker || DEFAULT_CONTEXT.selectedTicker)),
    handlePresent: Boolean(context.handlePresent),
    playerIdPresent: Boolean(context.playerIdPresent),
    hydrated: Boolean(context.hydrated),
  };
}

export function recordRuntimeDiagnostic(
  kind: RuntimeDiagnosticKind,
  value: unknown,
  options: RuntimeDiagnosticOptions = {},
): RuntimeDiagnosticEntry {
  const message = truncate(
    redactSensitiveText(stringifyUnknown(value) || "Runtime diagnostic captured."),
    MAX_MESSAGE_LENGTH,
  );
  const rawStack = stackFromUnknown(value);
  const entry: RuntimeDiagnosticEntry = {
    id: `diag_${Date.now()}_${nextDiagnosticId}`,
    capturedAt: new Date().toISOString(),
    kind,
    message,
    context: normalizeContext(options.context),
    ...(rawStack
      ? { stack: truncate(redactSensitiveText(rawStack), MAX_STACK_LENGTH) }
      : {}),
    ...(options.fatal === undefined ? {} : { fatal: options.fatal }),
  };

  nextDiagnosticId += 1;
  entries.unshift(entry);
  entries.splice(MAX_DIAGNOSTIC_ENTRIES);
  return entry;
}

export function getRuntimeDiagnosticsSnapshot(): RuntimeDiagnosticsSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    currentContext: normalizeContext(undefined),
    entries: entries.slice(),
  };
}

export function formatRuntimeDiagnosticsForQa(): string {
  return JSON.stringify(getRuntimeDiagnosticsSnapshot(), null, 2);
}

export function clearRuntimeDiagnostics(): void {
  entries.splice(0, entries.length);
}

function exposeBridge(): void {
  const runtimeGlobal = globalThis as typeof globalThis & RuntimeGlobal;
  runtimeGlobal.__CYBERTRADER_QA_DIAGNOSTICS__ = {
    getSnapshot: getRuntimeDiagnosticsSnapshot,
    formatReport: formatRuntimeDiagnosticsForQa,
    record: (message: string) => recordRuntimeDiagnostic("manual", message),
    clear: clearRuntimeDiagnostics,
  };
}

export function installRuntimeDiagnostics(
  getContext: () => RuntimeDiagnosticContext,
): () => void {
  contextProvider = getContext;
  exposeBridge();

  if (installed) {
    return () => undefined;
  }

  installed = true;
  cleanupFns = [];

  previousConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    recordRuntimeDiagnostic("console-error", args.map(stringifyUnknown).join(" "));
    previousConsoleError?.(...args);
  };
  cleanupFns.push(() => {
    if (previousConsoleError) {
      console.error = previousConsoleError;
      previousConsoleError = null;
    }
  });

  if (typeof window !== "undefined" && window.addEventListener) {
    const onError = (event: ErrorEvent) => {
      recordRuntimeDiagnostic("exception", event.error ?? event.message, { fatal: true });
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      recordRuntimeDiagnostic("unhandled-rejection", event.reason, { fatal: false });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    cleanupFns.push(() => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    });
  }

  const runtimeGlobal = globalThis as typeof globalThis & RuntimeGlobal;
  const errorUtils = runtimeGlobal.ErrorUtils;
  const previousGlobalHandler = errorUtils?.getGlobalHandler?.();
  if (errorUtils?.setGlobalHandler) {
    errorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      recordRuntimeDiagnostic("exception", error, { fatal: Boolean(isFatal) });
      previousGlobalHandler?.(error, isFatal);
    });
    cleanupFns.push(() => {
      if (previousGlobalHandler) {
        errorUtils.setGlobalHandler?.(previousGlobalHandler);
      }
    });
  }

  return () => {
    cleanupFns.forEach((cleanup) => cleanup());
    cleanupFns = [];
    installed = false;
  };
}
