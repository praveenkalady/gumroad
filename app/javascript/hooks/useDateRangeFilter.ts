import { router, usePage } from "@inertiajs/react";
import * as React from "react";

export const useDateRangeFilter = (initialStart: string, initialEnd: string) => {
  const [from, setFrom] = React.useState(new Date(initialStart));
  const [to, setTo] = React.useState(new Date(initialEnd));

  // Use refs to track the latest dates to avoid stale closures in timeout
  const latestDatesRef = React.useRef({ from, to });
  const reloadTimeoutRef = React.useRef<number | null>(null);

  // Sync state with props if they change
  React.useEffect(() => {
    setFrom(new Date(initialStart));
    setTo(new Date(initialEnd));
    latestDatesRef.current = { from: new Date(initialStart), to: new Date(initialEnd) };
  }, [initialStart, initialEnd]);

  // Ensure URL params exist on mount (for persistent state)
  const pageUrl = usePage().url;
  React.useEffect(() => {
    const urlParams = new URLSearchParams(pageUrl.split("?")[1] || "");
    if (!urlParams.has("from") && !urlParams.has("to")) {
      const url = new URL(pageUrl, typeof window !== "undefined" ? window.location.origin : "https://gumroad.com");
      url.searchParams.set("from", initialStart);
      url.searchParams.set("to", initialEnd);
      router.replace({ url: url.pathname + url.search, preserveState: true, preserveScroll: true });
    }
  }, []);

  const handleDateChange = () => {
    const { from: currentFrom, to: currentTo } = latestDatesRef.current;

    // Check if dates are valid
    if (
      !currentFrom ||
      !currentTo ||
      isNaN(currentFrom.getTime()) ||
      isNaN(currentTo.getTime())
    ) {
      return;
    }

    const fromStr = currentFrom.toISOString().split("T")[0];
    const toStr = currentTo.toISOString().split("T")[0];

    // Only reload if dates actually changed from props
    if (fromStr !== initialStart || toStr !== initialEnd) {
      router.reload({
        data: {
          from: fromStr,
          to: toStr,
        },
      });
    }
  };

  const scheduleReload = () => {
    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }
    reloadTimeoutRef.current = setTimeout(handleDateChange, 300) as unknown as number;
  };

  const handleFromChange = (newFrom: Date) => {
    setFrom(newFrom);
    latestDatesRef.current.from = newFrom;
    scheduleReload();
  };

  const handleToChange = (newTo: Date) => {
    setTo(newTo);
    latestDatesRef.current.to = newTo;
    scheduleReload();
  };

  return {
    from,
    to,
    handleFromChange,
    handleToChange,
  };
};
