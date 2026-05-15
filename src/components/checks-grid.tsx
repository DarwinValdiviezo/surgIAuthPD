import { DecisionResult } from "@/types/domain";

const checkLabels: Record<keyof DecisionResult["checks"], string> = {
  policyFound: "Poliza encontrada",
  confidenceAccepted: "Confianza aceptada",
  waitingPeriodMet: "Carencia cumplida",
  covered: "Cobertura valida",
  excluded: "Sin exclusion aplicable",
  documentsComplete: "Documentacion completa",
};

export function ChecksGrid({ checks }: { checks: DecisionResult["checks"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(checks).map(([key, value]) => (
        <article
          key={key}
          className={`rounded-2xl border px-4 py-4 text-sm shadow-sm ${
            value
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          <p className="font-semibold">{checkLabels[key as keyof DecisionResult["checks"]]}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em]">
            {value ? "Cumplido" : "Pendiente"}
          </p>
        </article>
      ))}
    </div>
  );
}
