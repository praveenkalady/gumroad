import { useForm, usePage } from "@inertiajs/react";
import * as React from "react";

export const useDateRangeFilter = (initialStart: string, initialEnd: string) => {
  const { data, setData, get, transform } = useForm({
    from: new Date(initialStart),
    to: new Date(initialEnd),
  });

  const pageUrl = usePage().url;
  const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());

  React.useEffect(() => {
    transform((data) => ({
      from: isValidDate(data.from) ? data.from.toISOString().split("T")[0] : "",
      to: isValidDate(data.to) ? data.to.toISOString().split("T")[0] : "",
    }));
  }, []);

  React.useEffect(() => {
    setData({
      from: new Date(initialStart),
      to: new Date(initialEnd),
    });
  }, [initialStart, initialEnd]);

  React.useEffect(() => {
    const fromStr = isValidDate(data.from) ? data.from.toISOString().split("T")[0] : "";
    const toStr = isValidDate(data.to) ? data.to.toISOString().split("T")[0] : "";

    if (!fromStr || !toStr || (fromStr === initialStart && toStr === initialEnd)) {
      return;
    }

    get(pageUrl.split("?")[0], {
      preserveState: true,
      preserveScroll: true,
    });
  }, [data.from, data.to]);

  return {
    from: data.from,
    to: data.to,
    handleFromChange: (date: Date) => setData("from", date),
    handleToChange: (date: Date) => setData("to", date),
  };
};
