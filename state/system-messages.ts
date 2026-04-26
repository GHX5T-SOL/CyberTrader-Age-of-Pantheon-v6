export type SafeFailureContext =
  | "provision"
  | "trade-buy"
  | "trade-sell"
  | "energy"
  | "heat"
  | "courier"
  | "shipment"
  | "challenge";

const SAFE_FAILURE_MESSAGES: Record<SafeFailureContext, string> = {
  provision: "[sys] local shard could not boot. retry from the handle gate.",
  "trade-buy": "[sys] buy order rejected safely. refresh the quote and retry.",
  "trade-sell": "[sys] sell order rejected safely. check owned lots and retry.",
  energy: "[sys] energy channel refused the packet. retry after the next tick.",
  heat: "[sys] bribe channel refused the packet. try again from black market.",
  courier: "[sys] courier dispatch failed safe. inventory remains local.",
  shipment: "[sys] shipment claim failed safe. cargo manifest is unchanged.",
  challenge: "[sys] challenge reward failed safe. objective state is unchanged.",
};

export function getSafeFailureMessage(context: SafeFailureContext): string {
  return SAFE_FAILURE_MESSAGES[context];
}

export function isPlayerFacingMessageSafe(message: string): boolean {
  return !/(supabase|postgres|sql|rpc|stack|trace|typeerror|syntaxerror|referenceerror|http:\/\/|https:\/\/|api[_-]?key|secret|token|service_role|anon key)/i.test(message);
}
