import { RefreshCcw, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

export function ConnectivityStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [updateReady, setUpdateReady] = useState(false);
  const update = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const applyUpdate = registerSW({
      immediate: true,
      onNeedRefresh() { setUpdateReady(true); },
      onRegisteredSW(_url, registration) { if (registration) void registration.update(); },
    });
    update.current = applyUpdate;
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online && !updateReady) return null;
  return <div className={`connectivity-banner ${online ? "has-update" : "is-offline"}`} role="status">
    {online ? <RefreshCcw size={16} /> : <WifiOff size={16} />}
    <span>{online ? "A new LinguaFlow version is ready." : "Offline: installed topics and self-paced practice remain available. Live rooms need a connection."}</span>
    {updateReady ? <button type="button" onClick={() => void update.current?.(true)}>Update now</button> : null}
  </div>;
}
