import { DEFAULT_LOCATION_ID } from "@/data/locations";
import type { PlayerProfile } from "@/engine/types";

export const EIDOLON_HANDLE_MIN_LENGTH = 3;
export const EIDOLON_HANDLE_MAX_LENGTH = 20;
export const EIDOLON_HANDLE_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

export const HANDLE_VALIDATION_COPY =
  "INVALID HANDLE. USE 3-20 LETTERS, NUMBERS, OR UNDERSCORES.";

export const LAUNCH_IDENTITY_POLICY = {
  taskId: "kite-p0-002",
  owner: "Kite",
  launchScope: "LocalAuthority-only demo",
  accountRequirement: "local handle",
  walletRequirement: "not required",
  backendRequirement: "not required",
  paymentRequirement: "not required",
  dataLocation: "on-device storage",
} as const;

export const LAUNCH_ACCOUNT_RECOVERY_COPY = {
  settingsTitle: "LOCAL IDENTITY // RECOVERY",
  settingsMessage:
    "Progress and identity stay on this device while LocalAuthority is active.",
  settingsDetail:
    "CLEAR LOCAL DATA REMOVES HANDLE, PROGRESS, LEDGER, POSITIONS, AND SETTINGS",
  legalDisclosure:
    "LocalAuthority stores your handle, progress, ledger, positions, and settings on this device. Clear Local Data removes local demo state. Cross-device recovery is unavailable unless a future approved online authority is enabled.",
  reviewerNote:
    "No demo account, wallet, payment method, or Supabase credentials are required for first playable launch.",
  privacyNote:
    "LocalAuthority launch builds store gameplay state on device only; SupabaseAuthority changes data handling and needs separate Ghost/Kite approval before store submission.",
} as const;

export function normalizeEidolonHandle(rawHandle: string): string {
  return rawHandle.trim().slice(0, EIDOLON_HANDLE_MAX_LENGTH);
}

export function isValidEidolonHandle(rawHandle: string): boolean {
  return EIDOLON_HANDLE_PATTERN.test(rawHandle.trim());
}

export function toDevIdentity(rawHandle: string): string {
  return normalizeEidolonHandle(rawHandle).toLowerCase();
}

export function createLaunchPlayerProfileInput(
  rawHandle: string,
): Omit<PlayerProfile, "id" | "createdAt"> {
  const eidolonHandle = normalizeEidolonHandle(rawHandle);

  if (!isValidEidolonHandle(rawHandle)) {
    throw new Error(HANDLE_VALIDATION_COPY);
  }

  return {
    walletAddress: null,
    devIdentity: toDevIdentity(eidolonHandle),
    eidolonHandle,
    osTier: "PIRATE",
    rank: 1,
    faction: null,
    currentLocationId: DEFAULT_LOCATION_ID,
    travelDestinationId: null,
    travelEndTime: null,
  };
}

export function isLaunchIdentityCopyStoreSafe(copy: string): boolean {
  return !/(private key|seed phrase|service_role|cash out|withdraw|investment|yield|staking)/i.test(copy);
}
