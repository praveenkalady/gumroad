import * as React from "react";

import {
  CurrencyCode,
  formatPriceCentsWithCurrencySymbol,
  formatPriceCentsWithoutCurrencySymbolAndComma,
} from "$app/utils/currency";
import { formatRecurrenceWithDuration, RecurrenceId } from "$app/utils/recurringPricing";

type Props = {
  url?: string;
  currencyCode: CurrencyCode;
  price: number;
  oldPrice?: number | undefined;
  recurrence?:
    | {
        id: RecurrenceId;
        duration_in_months: number | null;
      }
    | undefined;
  isPayWhatYouWant: boolean;
  isSalesLimited: boolean;
  creatorName?: string | undefined;
  tooltipPosition?: "top" | "right";
};

export const PriceTag = ({
  url,
  currencyCode,
  oldPrice,
  price,
  recurrence,
  isPayWhatYouWant,
  isSalesLimited,
  creatorName,
  tooltipPosition = "right",
}: Props) => {
  const formattedAmount = formatPriceCentsWithCurrencySymbol(currencyCode, price, { symbolFormat: "long" });

  const recurrenceLabel = recurrence
    ? formatRecurrenceWithDuration(recurrence.id, recurrence.duration_in_months)
    : null;

  // Should match CurrencyHelper#product_card_formatted_price
  const priceTag = (
    <>
      {oldPrice != null ? (
        <>
          <s>{formatPriceCentsWithCurrencySymbol(currencyCode, oldPrice, { symbolFormat: "long" })}</s>{" "}
        </>
      ) : null}
      {formattedAmount}
      {isPayWhatYouWant ? "+" : null}
      {recurrenceLabel ? ` ${recurrenceLabel}` : null}
    </>
  );
  const tooltipUid = React.useId();

  return (
    <div itemScope itemProp="offers" itemType="https://schema.org/Offer" className="flex items-center">
      <div className={`has-tooltip ${tooltipPosition}`} aria-describedby={tooltipUid}>
        <div
          className="relative block overflow-hidden text-ellipsis whitespace-nowrap border border-r-0 border-border bg-gradient-to-l from-transparent from-[1em] to-accent to-[1em] bg-no-repeat py-1 pl-2 pr-[calc(0.5rem+1em)] text-[rgb(var(--contrast-accent))] before:pointer-events-none before:absolute before:bottom-0 before:right-0 before:top-0 before:border-[length:calc(0.25rem+0.5lh)_0_calc(0.25rem+0.5lh)_calc(0.0625rem)] before:border-solid before:border-border before:border-r-[length:1em] before:border-r-transparent before:content-[''] after:pointer-events-none after:absolute after:bottom-0 after:right-[0.0625rem] after:top-0 after:border-[length:calc(0.25rem+0.5lh)_0] after:border-l-0 after:border-r-[length:1em] after:border-solid after:border-accent after:border-r-transparent after:content-['']"
          itemProp="price"
          content={formatPriceCentsWithoutCurrencySymbolAndComma(currencyCode, price)}
        >
          {priceTag}
        </div>
        <div role="tooltip" id={tooltipUid}>
          {priceTag}
        </div>
      </div>
      <link itemProp="url" href={url} />
      <div itemProp="availability" hidden>
        {`https://schema.org/${isSalesLimited ? "LimitedAvailability" : "InStock"}`}
      </div>
      <div itemProp="priceCurrency" hidden>
        {currencyCode}
      </div>
      {creatorName ? (
        <div itemProp="seller" itemType="https://schema.org/Person" hidden>
          <div itemProp="name" hidden>
            {creatorName}
          </div>
        </div>
      ) : null}
    </div>
  );
};
