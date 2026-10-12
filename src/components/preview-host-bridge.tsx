import { useEffect } from "react";

export function PreviewHostBridge() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "preview:ready") {
        document.body.dataset.previewReady = "true";
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}
