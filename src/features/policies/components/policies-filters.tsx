"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PoliciesFiltersProps = {
  insurerOptions: string[];
  procedureOptions: string[];
  initialValues: {
    q: string;
    insurer: string;
    procedure: string;
    waitingBand: string;
  };
  classNames: {
    filtersCard: string;
    filterItem: string;
    filterInput: string;
    filterAction: string;
    clearFilters: string;
  };
};

export function PoliciesFilters({
  insurerOptions,
  procedureOptions,
  initialValues,
  classNames,
}: PoliciesFiltersProps) {
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
        <label htmlFor="policies-q">Busqueda</label>
        <input
          id="policies-q"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Policy ID, aseguradora o cobertura"
          className={classNames.filterInput}
        />
      </div>

      <div className={classNames.filterItem}>
        <label htmlFor="policies-insurer">Aseguradora</label>
        <select
          id="policies-insurer"
          value={initialValues.insurer}
          onChange={(event) => updateParam("insurer", event.target.value)}
        >
          <option value="">Todas las aseguradoras</option>
          {insurerOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className={classNames.filterItem}>
        <label htmlFor="policies-procedure">Cobertura</label>
        <select
          id="policies-procedure"
          value={initialValues.procedure}
          onChange={(event) => updateParam("procedure", event.target.value)}
        >
          <option value="">Todas las coberturas</option>
          {procedureOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className={classNames.filterItem}>
        <label htmlFor="policies-waiting">Carencia</label>
        <select
          id="policies-waiting"
          value={initialValues.waitingBand}
          onChange={(event) => updateParam("waitingBand", event.target.value)}
        >
          <option value="">Todas</option>
          <option value="short">Corta o inmediata</option>
          <option value="medium">Media</option>
          <option value="long">Larga</option>
        </select>
      </div>

      <div className={classNames.filterAction}>
        <button type="button" onClick={clearAll} className={classNames.clearFilters}>
          Limpiar filtros
        </button>
      </div>
    </section>
  );
}
