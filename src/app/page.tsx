import Link from "next/link";

const foundations = [
  "Base de proyecto con Next.js, TypeScript y Tailwind",
  "Modelo inicial del dominio para casos, polizas y decisiones",
  "Motor de reglas con salida auditable",
  "API interna para procesar un caso usando datos mock",
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] bg-[var(--foreground)] px-8 py-10 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-teal-200">SurgiAuth</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight">
            Agente de pre-autorizacion quirurgica en tiempo real
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200">
            Esta base deja lista la columna vertebral del MVP para evaluar cobertura, carencia y
            documentos faltantes antes de integrar Notion y OpenAI.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-slate-100"
            >
              Abrir dashboard
            </Link>
            <a
              href="/api/process-case"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Endpoint base
            </a>
          </div>
        </article>

        <article className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">Base lista</p>
          <h2 className="mt-3 text-2xl font-semibold">Lo que ya queda resuelto</h2>
          <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
            {foundations.map((item) => (
              <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
