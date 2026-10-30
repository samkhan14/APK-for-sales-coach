import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadKeys, onKeysChanged, type Keys } from "@/services/keys/keyStore";
import { gateState, type GateState } from "@/services/keys/gate";

interface KeysCtx { keys: Keys; gate: GateState }
const Ctx = createContext<KeysCtx>({ keys: {}, gate: { status: "loading" } });

export function KeysProvider({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<Keys>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const off = onKeysChanged(setKeys);
    loadKeys().then(k => { setKeys(k); setLoaded(true); }).catch(() => setLoaded(true));
    return off;
  }, []);
  const value = useMemo(() => ({ keys, gate: gateState(loaded, keys) }), [keys, loaded]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useKeys = () => useContext(Ctx);
