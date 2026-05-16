"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type CasesFiltersProps = {
  insurerOptions: string[];
  procedureOptions: string[];
  initialValues: {
    q: string;
    insurer: string;
    status: string;
    procedure: string;
    range: string;
  };
  classNames: {
    filtersCard: string;
    filterItem: string;
    filterInput: string;
    filterActions: string;
    clearFilters: string;
  };
};

export function CasesFilters({ insurerOptions, procedureOptions, initialValues, classNames }: CasesFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialValues.q);

  const baseParams = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  function updateParam(name: string, value: string) {
    const params = new URLSearchParams(baseParams.toString());

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    params.delete("page");
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query !== initialValues.q) {
        updateParam("q", query.trim());
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, initialValues.q]); // eslint-disable-line react-hooks/exhaustive-deps

  function clearAll() {
    router.replace(pathname);
  }

  return (
    <section className={classNames.filtersCard}>
      <div className={classNames.filterItem}>
        <label htmlFor="cases-q">Busqueda</label>
        <input
          id="cases-q"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Caso, paciente, poliza o diagnostico"
          className={classNames.filterInput}
        />
      </div>

      <div className={classNames.filterItem}>
        <label htmlFor="cases-insurer">Aseguradora</label>
        <select
          id="cases-insurer"
          value={initialValues.insurer}
          onChange={(event) => updateParam("insurer", event.target.value)}
        >
          <option value="">Todas</option>
          {insurerOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className={classNames.filterItem}>
        <label htmlFor="cases-range">Rango</label>
        <select id="cases-range" value={initialValues.range} onChange={(event) => updateParam("range", event.target.value)}>
          <option value="">Todos</option>
          <option value="30">Ultimos 30 dias</option>
          <option value="90">Ultimos 90 dias</option>
          <option value="180">Ultimos 180 dias</option>
        </select>
      </div>

      <div className={classNames.filterItem}>
        <label htmlFor="cases-status">Estado</label>
        <select
          id="cases-status"
          value={initialValues.status}
          onChange={(event) => updateParam("status", event.target.value)}
        >
          <option value="">Todos</option>
          <option value="Nuevo">Nuevo</option>
          <option value="En analisis">En analisis</option>
          <option value="Preaprobado">Preaprobado</option>
          <option value="Pendiente por documentos">Pendiente por documentos</option>
          <option value="Revision manual">Revision manual</option>
          <option value="Rechazado por exclusion">Rechazado por exclusion</option>
        </select>
      </div>

      <div className={classNames.filterItem}>
        <label htmlFor="cases-procedure">Procedimiento</label>
        <select
          id="cases-procedure"
          value={initialValues.procedure}
          onChange={(event) => updateParam("procedure", event.target.value)}
        >
          <option value="">Todos</option>
          {procedureOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className={classNames.filterActions}>
        <button type="button" onClick={clearAll} className={classNames.clearFilters}>
          Limpiar filtros
        </button>
      </div>
    </section>
  );
}
