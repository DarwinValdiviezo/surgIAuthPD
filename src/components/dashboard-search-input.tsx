"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./app-shell.module.css";

type DashboardSearchInputProps = {
  placeholder: string;
  targetPath?: string;
  queryKey?: string;
};

export function DashboardSearchInput({
  placeholder,
  targetPath,
  queryKey = "q",
}: DashboardSearchInputProps) {
  const searchParams = useSearchParams();
  const currentValue = searchParams.get(queryKey) ?? "";
  const pathname = usePathname();

  return (
    <DashboardSearchField
      key={`${pathname}-${queryKey}-${currentValue}`}
      currentValue={currentValue}
      placeholder={placeholder}
      queryKey={queryKey}
      targetPath={targetPath}
    />
  );
}

type DashboardSearchFieldProps = {
  currentValue: string;
  placeholder: string;
  queryKey: string;
  targetPath?: string;
};

function DashboardSearchField({
  currentValue,
  placeholder,
  queryKey,
  targetPath,
}: DashboardSearchFieldProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(currentValue);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value === currentValue) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set(queryKey, value.trim());
      } else {
        params.delete(queryKey);
      }

      params.delete("page");
      const destination = targetPath ?? pathname;
      const query = params.toString();
      router.replace(query ? `${destination}?${query}` : destination);
    }, 350);

    return () => clearTimeout(timeout);
  }, [value, currentValue, pathname, queryKey, router, searchParams, targetPath]);

  return (
    <input
      className={styles.dashboardSearchInput}
      placeholder={placeholder}
      type="text"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}
