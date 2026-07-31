"use client";

import { useEffect, useState } from "react";
import { Download, WifiOff, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaRuntime() {
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setOnline(window.navigator.onLine));

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleInstall);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstall);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  };

  if (!online) {
    return (
      <div className="network-banner" role="status">
        <WifiOff size={16} />
        <span>Modo sin conexión · tus cambios permanecen en este dispositivo</span>
      </div>
    );
  }

  if (!installPrompt || dismissed) return null;

  return (
    <div className="install-banner" role="status">
      <span className="install-banner-icon">
        <Download size={17} />
      </span>
      <span>
        <strong>Instala Project Horseshoe</strong>
        <small>Ábrela como app desde tu pantalla de inicio.</small>
      </span>
      <button className="button button-light button-small" onClick={install}>
        Instalar
      </button>
      <button className="install-dismiss" onClick={() => setDismissed(true)} aria-label="Cerrar invitación">
        <X size={16} />
      </button>
    </div>
  );
}
