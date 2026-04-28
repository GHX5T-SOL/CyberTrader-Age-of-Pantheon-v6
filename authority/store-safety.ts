export type StoreSafetyFinding = {
  ruleId: string;
  label: string;
};

type StoreSafetyRule = StoreSafetyFinding & {
  pattern: RegExp;
};

export const STORE_SAFE_BOUNDARY_POLICY = {
  taskId: "kite-p1-004",
  owner: "Kite",
  launchScope: "LocalAuthority-only demo",
  softCurrency: "0BOL has no cash value and never leaves local gameplay.",
  tokenScope: "$OBOL and wallet functionality are future optional scope only.",
  walletScope:
    "Wallet functionality must remain optional, feature-flagged, and separated from first-session play.",
  custodyScope:
    "The current build never asks players for private signing material and does not custody assets.",
  reviewerScope:
    "Reviewers can complete the playable loop without a wallet, payment method, backend account, or Supabase credentials.",
} as const;

export const STORE_SAFE_REVIEWER_COPY = {
  localDemo:
    "CyberTrader v6 is playable as a local simulated-market strategy game.",
  softCurrency:
    "0BOL is a soft in-game currency for progression and local demo trading. It has no cash value and never leaves local gameplay.",
  futureToken:
    "$OBOL and wallet features are disabled for launch unless a future reviewed build enables them with the required regional, store, and legal evidence.",
  noWallet:
    "No wallet, payment method, backend account, or Supabase credentials are required for first-session play.",
  nonCustodial:
    "If a future wallet layer is enabled, it must be optional and non-custodial; the app must not request private signing material.",
  simulation:
    "Trades use fictional commodities and deterministic local simulation, not real-world market access.",
  noPrize:
    "The launch build has no prize-redemption mechanics, paid random rewards, outside-of-app rewards, or regulated financial products.",
} as const;

const STORE_SAFETY_RULES: StoreSafetyRule[] = [
  {
    ruleId: "real-money-redemption",
    label: "real-money redemption or withdrawal claim",
    pattern:
      /\b(?:cash\s*out|withdraw(?:al|able)?|redeem(?:able)?|convert\s+to\s+(?:cash|money|fiat|crypto)|real\s+money\s+payout)\b/i,
  },
  {
    ruleId: "investment-return",
    label: "investment or guaranteed-return claim",
    pattern:
      /\b(?:investment|investor|guaranteed\s+returns?|passive\s+income|yield|staking|apy|apr|dividend|portfolio\s+returns?)\b/i,
  },
  {
    ruleId: "play-to-earn",
    label: "earn-money or play-to-earn claim",
    pattern: /\b(?:earn\s+(?:cash|money|income|crypto)|play[-\s]?to[-\s]?earn|profit\s+from\s+real\s+markets?)\b/i,
  },
  {
    ruleId: "regulated-market",
    label: "regulated market or financial product claim",
    pattern:
      /\b(?:securities?|forex|foreign\s+exchange|binary\s+options?|cfds?|derivatives?|loans?|credit\s+product|financial\s+advice)\b/i,
  },
  {
    ruleId: "gambling-prize",
    label: "gambling, paid-chance, or prize claim",
    pattern:
      /\b(?:real[-\s]?money\s+gambling|cash\s+prizes?|gift\s+cards?|sweepstakes|wager(?:ing)?|paid\s+chance|loot\s+boxes?)\b/i,
  },
  {
    ruleId: "sensitive-wallet-material",
    label: "private wallet or credential material",
    pattern:
      /\b(?:private\s+key|seed\s+phrase|recovery\s+phrase|mnemonic|service[_\s-]?role|signing\s+secret)\b/i,
  },
];

export function findStoreSafetyFindings(copy: string): StoreSafetyFinding[] {
  return STORE_SAFETY_RULES.filter((rule) => rule.pattern.test(copy)).map(
    ({ ruleId, label }) => ({ ruleId, label }),
  );
}

export function isStoreSafeCopy(copy: string): boolean {
  return findStoreSafetyFindings(copy).length === 0;
}

export function assertStoreSafeCopy(copyBySurface: Record<string, string>): void {
  const findings = Object.entries(copyBySurface).flatMap(([surface, copy]) =>
    findStoreSafetyFindings(copy).map((finding) => ({ surface, ...finding })),
  );

  if (findings.length > 0) {
    throw new Error(
      `Store-unsafe copy detected: ${findings
        .map((finding) => `${finding.surface}:${finding.ruleId}`)
        .join(", ")}`,
    );
  }
}
