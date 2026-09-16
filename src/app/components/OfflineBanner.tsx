import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** App-wide banner when the browser reports offline. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine === false,
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[300] flex items-center justify-center gap-2 bg-[#7F1D1D] px-4 py-2 text-[13px] font-medium text-white"
      role="status"
      aria-live="polite"
    >
      <WifiOff size={14} aria-hidden />
      You are offline. Some features will not work until your connection returns.
    </div>
  );
}
