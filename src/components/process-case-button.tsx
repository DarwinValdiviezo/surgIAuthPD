"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProcessCaseButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/process-case", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ caseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "No se pudo procesar el caso.");
        return;
      }

      setMessage(`Caso procesado: ${data.decision.status}`);
      router.refresh();
    } catch {
      setMessage("Ocurrio un error al procesar el caso.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Procesando..." : "Procesar caso"}
      </button>
      {message ? <p className="text-xs text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
