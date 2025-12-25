import { router, usePage } from "@inertiajs/react";
import React from "react";

import { AudienceDataByDate } from "$app/data/audience";

import { InertiaAnalyticsLayout } from "$app/components/Analytics/InertiaAnalyticsLayout";
import { AudienceChart } from "$app/components/Audience/AudienceChart";
import { AudienceQuickStats } from "$app/components/Audience/AudienceQuickStats";
import { Button } from "$app/components/Button";
import { DateRangePicker } from "$app/components/DateRangePicker";
import { ExportSubscribersPopover } from "$app/components/Followers/ExportSubscribersPopover";
import { Icon } from "$app/components/Icons";
import { Popover } from "$app/components/Popover";
import Placeholder from "$app/components/ui/Placeholder";
import { WithTooltip } from "$app/components/WithTooltip";

import placeholder from "$assets/images/placeholders/audience.png";

interface AudienceIndexProps {
  total_follower_count: number;
  audience_data: AudienceDataByDate;
  start_date: string;
  end_date: string;
  [key: string]: unknown;
}

const Index = () => {
  const { total_follower_count, audience_data, start_date, end_date } = usePage<AudienceIndexProps>().props;
  const hasContent = total_follower_count > 0;

  const [from, setFrom] = React.useState(new Date(start_date));
  const [to, setTo] = React.useState(new Date(end_date));

  // Use refs to track the latest dates to avoid stale closures
  const latestDatesRef = React.useRef({ from, to });
  const reloadTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setFrom(new Date(start_date));
    setTo(new Date(end_date));
    latestDatesRef.current = { from: new Date(start_date), to: new Date(end_date) };
  }, [start_date, end_date]);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('from') && !urlParams.has('to')) {
      const url = new URL(window.location.href);
      url.searchParams.set('from', start_date);
      url.searchParams.set('to', end_date);
      router.replace({ url: url.pathname + url.search, preserveState: true, preserveScroll: true });
    }
  }, []);

  const handleDateChange = () => {
    const { from: currentFrom, to: currentTo } = latestDatesRef.current;
    if (!currentFrom || !currentTo || isNaN(currentFrom.getTime()) || isNaN(currentTo.getTime())) {
      return;
    }
    const fromStr = currentFrom.toISOString().split('T')[0];
    const toStr = currentTo.toISOString().split('T')[0];
    if (!fromStr || !toStr || fromStr.length !== 10 || toStr.length !== 10) {
      return;
    }
    if (fromStr !== start_date || toStr !== end_date) {
      router.reload({
        data: {
          from: fromStr,
          to: toStr,
        },
      });
    }
  };

  const handleFromChange = (newFrom: Date) => {
    setFrom(newFrom);
    latestDatesRef.current.from = newFrom;

    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }
    reloadTimeoutRef.current = setTimeout(handleDateChange, 300) as unknown as number;
  };

  const handleToChange = (newTo: Date) => {
    setTo(newTo);
    latestDatesRef.current.to = newTo;

    if (reloadTimeoutRef.current) {
      clearTimeout(reloadTimeoutRef.current);
    }
    reloadTimeoutRef.current = setTimeout(handleDateChange, 300) as unknown as number;
  };

  return (
    <InertiaAnalyticsLayout
      selectedTab="following"
      actions={
        hasContent ? (
          <>
            <Popover
              aria-label="Export"
              trigger={
                <WithTooltip tip="Export" position="bottom">
                  <Button aria-label="Export">
                    <Icon aria-label="Download" name="download" />
                  </Button>
                </WithTooltip>
              }
            >
              {(close) => <ExportSubscribersPopover closePopover={close} />}
            </Popover>
            <DateRangePicker
              from={from}
              to={to}
              setFrom={handleFromChange}
              setTo={handleToChange}
            />
          </>
        ) : null
      }
    >
      {hasContent ? (
        <div className="space-y-8 p-4 md:p-8">
          <AudienceQuickStats totalFollowers={total_follower_count} newFollowers={audience_data?.new_followers ?? null} />
          <AudienceChart data={audience_data} />
        </div>
      ) : (
        <div className="p-4 md:p-8">
          <Placeholder>
            <figure>
              <img src={placeholder} />
            </figure>
            <h2>It's quiet. Too quiet.</h2>
            <p>
              You don't have any followers yet. Once you do, you'll see them here, along with powerful data that can
              help you keep your growing audience engaged.
            </p>
            <a href="/help/article/170-audience" target="_blank" rel="noreferrer">
              Learn more
            </a>
          </Placeholder>
        </div>
      )}
    </InertiaAnalyticsLayout>
  );
};

export default Index;
