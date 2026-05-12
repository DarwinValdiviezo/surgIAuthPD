import Link from "next/link";
import { CaseCard } from "@/components/case-card";
import { findPolicyById, getDataSourceMode, listCases } from "@/lib/case-service";
import { extractCaseData } from "@/lib/extraction";
import { evaluateCoverage } from "@/rules/coverage";

export default async function DashboardPage() {
  const cases = await listCases();
  const policies = await Promise.all(cases.map((surgicalCase) => findPolicyById(surgicalCase.policyId)));
  const decisions = cases.map((surgicalCase, index) =>
    evaluateCoverage(
      surgicalCase,
      policies[index],
      extractCaseData(surgicalCase),
    ),
  );

  const metrics = [
    { label: "Casos totales", value: String(cases.length).padStart(2, "0") },
    {
      label: "Preaprobados",
      value: String(decisions.filter((item) => item.status === "Preaprobado").length).padStart(2, "0"),
    },
    {
      label: "Pendientes",
      value: String(decisions.filter((item) => item.status === "Pendiente por documentos").length).padStart(2, "0"),
    },
    {
      label: "Revision manual",
      value: String(decisions.filter((item) => item.status === "Revision manual").length).padStart(2, "0"),
    },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-10 flex flex-col gap-4 rounded-[2rem] bg-[var(--foreground)] px-8 py-10 text-white shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-teal-200">
              SurgiAuth · {getDataSourceMode() === "notion" ? "Notion" : "Mocks"}
            </p>
            <h1 className="mt-3 text-4xl font-semibold">Panel operativo de pre-autorizacion quirurgica</h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
          >
            Ver resumen
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
          >
            <p className="text-sm text-[var(--muted)]">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
              {getDataSourceMode() === "notion" ? "Casos de Notion" : "Casos simulados"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Cola inicial para el MVP</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {cases.map((surgicalCase) => (
            <CaseCard key={surgicalCase.caseId} surgicalCase={surgicalCase} />
          ))}
        </div>
      </section>
    </main>
  );
}
