import { usePage } from "@inertiajs/react";
import React from "react";

import { AudienceDataByDate } from "$app/data/audience";
import { useDateRangeFilter } from "$app/hooks/useDateRangeFilter";

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

  const { from, to, handleFromChange, handleToChange } = useDateRangeFilter(start_date, end_date);

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
            <DateRangePicker from={from} to={to} setFrom={handleFromChange} setTo={handleToChange} />
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
