
export type AnalyticsDataByReferral = {
  dates_and_months: {
    date: string;
    month: string;
    month_index: number;
  }[];
  start_date: string;
  end_date: string;
  by_referral: {
    views: Record<string, Record<string, number[]>>;
    sales: Record<string, Record<string, number[]>>;
    totals: Record<string, Record<string, number[]>>;
  };
};

// CountryData values can be int (country total), int[] (breakdown by states in country)
// or undefined (ex: when country has views but no sales)
export type LocationDataValue = number | number[] | undefined;
export type LocationData = Record<string, Record<string, LocationDataValue>>;
export type AnalyticsDataByState = {
  by_state: {
    sales: LocationData;
    totals: LocationData;
    views: LocationData;
  };
};
