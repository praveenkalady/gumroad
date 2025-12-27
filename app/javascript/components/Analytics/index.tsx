import pickBy from "lodash/pickBy";
import * as React from "react";

import {
  AnalyticsDataByReferral,
  AnalyticsDataByState,
} from "$app/data/analytics";
import { useDateRangeFilter } from "$app/hooks/useDateRangeFilter";
import { assertDefined } from "$app/utils/assert";

import { InertiaAnalyticsLayout } from "$app/components/Analytics/InertiaAnalyticsLayout";
import { LocationsTable } from "$app/components/Analytics/LocationsTable";
import { ProductsPopover } from "$app/components/Analytics/ProductsPopover";
import { ReferrersTable } from "$app/components/Analytics/ReferrersTable";
import { SalesChart } from "$app/components/Analytics/SalesChart";
import { SalesQuickStats } from "$app/components/Analytics/SalesQuickStats";
import { DateRangePicker } from "$app/components/DateRangePicker";
import Placeholder from "$app/components/ui/Placeholder";

import placeholder from "$assets/images/placeholders/sales.png";

export type Product = {
  name: string;
  id: string;
  alive: boolean;
  unique_permalink: string;
};

export type AnalyticsTotal = {
  sales: number;
  views: number;
  totals: number;
};

export type AnalyticsDailyTotal = {
  date: string;
  month: string;
  monthIndex: number;
  sales: number;
  views: number;
  totals: number;
};

export type AnalyticsReferrerTotals = Record<string, AnalyticsTotal>;

export type AnalyticsData = {
  total: AnalyticsTotal;
  startDate: string;
  endDate: string;
  dailyTotal: AnalyticsDailyTotal[];
  referrerTotal: AnalyticsReferrerTotals;
};

const formatData = (data: AnalyticsDataByReferral, selectedPermalinks: string[]) => {
  const result: AnalyticsData = {
    total: { sales: 0, views: 0, totals: 0 },
    startDate: data.start_date,
    endDate: data.end_date,
    dailyTotal: data.dates_and_months.map(({ date, month, month_index }) => ({
      date,
      month,
      monthIndex: month_index,
      sales: 0,
      views: 0,
      totals: 0,
    })),
    referrerTotal: {},
  };

  const addData = (field: "sales" | "views" | "totals") => {
    const relevantData = pickBy(data.by_referral[field], (_, permalink) => selectedPermalinks.includes(permalink));
    for (const byReferrer of Object.values(relevantData)) {
      for (const [referrer, values] of Object.entries(byReferrer)) {
        for (const [index, value] of values.entries()) {
          result.total[field] += value;
          assertDefined(result.dailyTotal[index])[field] += value;
          result.referrerTotal[referrer] ??= { sales: 0, views: 0, totals: 0 };
          assertDefined(result.referrerTotal[referrer])[field] += value;
        }
      }
    }
  };

  addData("sales");
  addData("views");
  addData("totals");

  return result;
};

export type AnalyticsProps = {
  products: Product[];
  country_codes: Record<string, string>;
  state_names: Record<string, string>;
  by_referral_data: AnalyticsDataByReferral;
  by_state_data: AnalyticsDataByState;
  start_date: string;
  end_date: string;
};


const Analytics = ({
  products: initialProducts,
  country_codes,
  state_names,
  by_referral_data,
  by_state_data,
  start_date,
  end_date
}: AnalyticsProps) => {
  const [products, setProducts] = React.useState(
    initialProducts.map((product) => ({ ...product, selected: product.alive })),
  );
  const [aggregateBy, setAggregateBy] = React.useState<"daily" | "monthly">("daily");

  const hasContent = products.length > 0;

  // Use local state for the date picker
  const { from, to, handleFromChange, handleToChange } = useDateRangeFilter(start_date, end_date, {
    only: ["analytics_props"],
  });

  const selectedProducts = products.filter((product) => product.selected).map((product) => product.unique_permalink);

  const mainData = React.useMemo(
    () => (by_referral_data ? formatData(by_referral_data, selectedProducts) : null),
    [by_referral_data, products],
  );

  return (
    <InertiaAnalyticsLayout
      selectedTab="sales"
      actions={
        hasContent ? (
          <>
            <select
              aria-label="Aggregate by"
              onChange={(e) => setAggregateBy(e.target.value === "daily" ? "daily" : "monthly")}
              className="w-auto"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
            <ProductsPopover products={products} setProducts={setProducts} />
            <DateRangePicker from={from} to={to} setFrom={handleFromChange} setTo={handleToChange} />
          </>
        ) : null
      }
    >
      {hasContent ? (
        <div className="space-y-8 p-4 md:p-8">
          <SalesQuickStats total={mainData?.total} />
          {mainData ? (
            <>
              <SalesChart
                data={mainData.dailyTotal}
                startDate={mainData.startDate}
                endDate={mainData.endDate}
                aggregateBy={aggregateBy}
              />
              <ReferrersTable data={mainData.referrerTotal} />
            </>
          ) : null}
          {by_state_data ? (
            <LocationsTable
              data={by_state_data}
              selectedProducts={selectedProducts}
              countryCodes={country_codes}
              stateNames={state_names}
            />
          ) : null}
        </div>
      ) : (
        <div className="p-4 md:p-8">
          <Placeholder>
            <figure>
              <img src={placeholder} />
            </figure>
            <h2>You're just getting started.</h2>
            <p>
              You don't have any sales yet. Once you do, you'll see them here, along with powerful data that can help
              you see what's working, and what could be working better.
            </p>
            <a href="/help/article/74-the-analytics-dashboard" target="_blank" rel="noreferrer">
              Learn more about the analytics dashboard
            </a>
          </Placeholder>
        </div>
      )}
    </InertiaAnalyticsLayout>
  );
};

export default Analytics;
