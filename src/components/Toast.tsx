"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type TType = "success" | "error" | "info";
interface Toast { id: string; message: string; type: TType; }
interface Ctx { toast: (msg: string, type?: TType) => void; }
const Ctx = createContext<Ctx>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: TType = "success") => {
    const id = crypto.randomUUID();
    setList(p => [...p, { id, message, type }]);
    setTimeout(() => setList(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  const remove = (id: string) => setList(p => p.filter(t => t.id !== id));
  const icons = { success: <CheckCircle style={{ width: 14, height: 14, flexShrink: 0 }} />, error: <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />, info: <Info style={{ width: 14, height: 14, flexShrink: 0 }} /> };

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="toast-wrap">
        {list.map(t => (
          <div key={t.id} className={`toast ${t.type}`} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {icons[t.type]}
            <span style={{ flex: 1, fontSize: 13 }}>{t.message}</span>
            <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5, display: "flex" }}>
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export function useToast() { return useContext(Ctx); }
