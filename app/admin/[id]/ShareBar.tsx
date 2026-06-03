"use client";

import { useState } from "react";

export function ShareBar({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div className="share">
      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--g-700)" }}>
        🔗 Link do cliente:
      </span>
      <code>{url}</code>
      <button className="btn btn-soft" onClick={copy} type="button">
        {copied ? "Copiado ✓" : "Copiar"}
      </button>
      <a className="btn btn-ghost" href={url} target="_blank" rel="noopener noreferrer">
        Abrir
      </a>
    </div>
  );
}
