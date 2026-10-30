// Pure setup-gate logic (unit-tested): the app may only proceed when every key is saved.
import { hasAllKeys, missingProviders, type KeyProvider, type Keys } from "./keyStore";

export type GateState = { status: "loading" } | { status: "setup"; missing: KeyProvider[] } | { status: "ready" };

export function gateState(loaded: boolean, keys: Keys): GateState {
  if (!loaded) return { status: "loading" };
  return hasAllKeys(keys) ? { status: "ready" } : { status: "setup", missing: missingProviders(keys) };
}
