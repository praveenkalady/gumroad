import React from "react";

interface DiscoverPageProps {
  currentUser?: any;
}

const DiscoverPage: React.FC<DiscoverPageProps> = ({ currentUser }) => {
  return (
    <div className="discover-page-spa">
      <h1>Discover</h1>
      <p>Discover page will be implemented here</p>
    </div>
  );
};

export default DiscoverPage;
