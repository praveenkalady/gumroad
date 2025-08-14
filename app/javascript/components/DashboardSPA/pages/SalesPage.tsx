import React from "react";

interface SalesPageProps {
  currentUser?: any;
}

const SalesPage: React.FC<SalesPageProps> = ({ currentUser }) => {
  return (
    <div className="sales-page-spa">
      <h1>Sales Dashboard</h1>
      <p>Sales page will be implemented here</p>
    </div>
  );
};

export default SalesPage;
