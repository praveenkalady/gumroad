import { usePage } from "@inertiajs/react";
import React from "react";
import { cast } from "ts-safe-cast";

import { AudiencePage } from "$app/components/server-components/AudiencePage";

interface AudienceIndexProps {
  total_follower_count: number;
  [key: string]: unknown;
}

const Index = () => {
  const { total_follower_count, profile_url } = usePage<AudienceIndexProps>().props;

  return <AudiencePage total_follower_count={total_follower_count} profile_url={cast<string>(profile_url)} />;
};

export default Index;
