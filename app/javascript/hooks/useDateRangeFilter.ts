import { router, useForm, usePage } from "@inertiajs/react";
import * as React from "react";

export const useDateRangeFilter = (initialStart: string, initialEnd: string, options?: { only?: string[] }) => {
  const { data, setData } = useForm({
    from: new Date(initialStart),
    to: new Date(initialEnd),
  });

  const pageUrl = usePage().url;
  const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());

  // Sync state with props if they change (e.g. invalid date corrected by backend, or navigation)
  React.useEffect(() => {
    setData({
      from: new Date(initialStart),
      to: new Date(initialEnd),
    });
  }, [initialStart, initialEnd]);

  // Auto-Submit on change (Inertia handles cancellation)
  React.useEffect(() => {
    const fromStr = isValidDate(data.from) ? data.from.toISOString().split("T")[0] : "";
    const toStr = isValidDate(data.to) ? data.to.toISOString().split("T")[0] : "";

    // Skip if invalid or unchanged from initial props
    if (!fromStr || !toStr || (fromStr === initialStart && toStr === initialEnd)) {
      return;
    }

    router.get(pageUrl.split("?")[0], {
      from: fromStr,
      to: toStr,
    }, {
      preserveState: true,
      preserveScroll: true,
      ...(options?.only ? { only: options.only } : {}),
    });
  }, [data.from, data.to]);

  return {
    from: data.from,
    to: data.to,
    handleFromChange: (date: Date) => setData("from", date),
    handleToChange: (date: Date) => setData("to", date),
  };
};
