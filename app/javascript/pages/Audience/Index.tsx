import { usePage } from "@inertiajs/react";
import React from "react";

import { AudiencePage } from "$app/components/server-components/AudiencePage";

interface AudienceIndexProps {
  total_follower_count: number;
  [key: string]: unknown;
}

const Index = () => {
  const { total_follower_count } = usePage<AudienceIndexProps>().props;

  return <AudiencePage total_follower_count={total_follower_count} />;
};

export default Index;
