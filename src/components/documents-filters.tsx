"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type DocumentsFiltersProps = {
  caseOptions: string[];
  typeOptions: string[];
  initialValues: {
    q: string;
    status: string;
    type: string;
    caseId: string;
  };
  classNames: {
    filtersCard: string;
    filterItem: string;
    filterInput: string;
    filterAction: string;
    clearFilters: string;
  };
};

export function DocumentsFilters({
  caseOptions,
  typeOptions,
  initialValues,
  classNames,
}: DocumentsFiltersProps) {
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
        <label htmlFor="documents-q">Busqueda</label>
        <input
          id="documents-q"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Documento, caso o texto extraido"
          className={classNames.filterInput}
        />
      </div>

      <div className={classNames.filterItem}>
        <label htmlFor="documents-status">Estado</label>
        <select
          id="documents-status"
          value={initialValues.status}
          onChange={(event) => updateParam("status", event.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="Procesado">Procesado</option>
          <option value="Disponible">Disponible</option>
          <option value="Pendiente">Pendiente</option>
        </select>
      </div>

      <div className={classNames.filterItem}>
        <label htmlFor="documents-type">Tipo documental</label>
        <select
          id="documents-type"
          value={initialValues.type}
          onChange={(event) => updateParam("type", event.target.value)}
        >
          <option value="">Todos los tipos</option>
          {typeOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className={classNames.filterItem}>
        <label htmlFor="documents-case">Caso</label>
        <select
          id="documents-case"
          value={initialValues.caseId}
          onChange={(event) => updateParam("caseId", event.target.value)}
        >
          <option value="">Todos los casos</option>
          {caseOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
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
