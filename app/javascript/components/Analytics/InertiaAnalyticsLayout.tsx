import { Link } from "@inertiajs/react";
import * as React from "react";

import { assertDefined } from "$app/utils/assert";

import { useLoggedInUser } from "$app/components/LoggedInUser";
import { PageHeader } from "$app/components/ui/PageHeader";
import { Tabs, Tab } from "$app/components/ui/Tabs";

export const InertiaAnalyticsLayout = ({
  selectedTab,
  children,
  actions,
}: {
  selectedTab: "following" | "sales" | "utm_links";
  children: React.ReactNode;
  actions?: React.ReactNode;
}) => {
  const user = assertDefined(useLoggedInUser());

  return (
    <div>
      <PageHeader title="Analytics" actions={actions}>
        <Tabs>
          <Tab isSelected={selectedTab === "following"} asChild>
            <Link href={Routes.audience_dashboard_path()} className="no-underline">
              Following
            </Link>
          </Tab>
          <Tab href={Routes.sales_dashboard_path()} isSelected={selectedTab === "sales"}>
            Sales
          </Tab>
          {user.policies.utm_link.index ? (
            <Tab href={Routes.utm_links_dashboard_path()} isSelected={selectedTab === "utm_links"}>
              Links
            </Tab>
          ) : null}
        </Tabs>
      </PageHeader>
      {children}
    </div>
  );
};
