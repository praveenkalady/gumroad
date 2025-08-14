import React, { useState, useEffect } from "react";
import { DashboardPage } from "../../server-components/DashboardPage";

interface DashboardHomeProps {
  initialData?: any;
  currentUser?: any;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ initialData, currentUser }) => {
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState(initialData || null);
  const [additionalStats, setAdditionalStats] = useState({
    customersCount: null,
    totalRevenue: null,
    activeMembersCount: null,
    monthlyRecurringRevenue: null
  });

  useEffect(() => {
    if (!initialData) {
      fetchDashboardData();
    }
    // Always fetch additional stats
    fetchAdditionalStats();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/dashboard.json', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdditionalStats = async () => {
    try {
      // Fetch customers count
      const customersResponse = await fetch('/dashboard/customers_count', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        credentials: 'same-origin'
      });
      
      // Fetch total revenue
      const revenueResponse = await fetch('/dashboard/total_revenue', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        credentials: 'same-origin'
      });

      // Fetch active members count
      const activeMembersResponse = await fetch('/dashboard/active_members_count', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        credentials: 'same-origin'
      });

      // Fetch monthly recurring revenue
      const mrrResponse = await fetch('/dashboard/monthly_recurring_revenue', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        credentials: 'same-origin'
      });

      const [customers, revenue, activeMembers, mrr] = await Promise.all([
        customersResponse.json(),
        revenueResponse.json(),
        activeMembersResponse.json(),
        mrrResponse.json()
      ]);

      setAdditionalStats({
        customersCount: customers.value,
        totalRevenue: revenue.value,
        activeMembersCount: activeMembers.value,
        monthlyRecurringRevenue: mrr.value
      });
    } catch (err) {
      console.error('Error fetching additional stats:', err);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    fetchAdditionalStats();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error loading dashboard</h2>
        <p>{error}</p>
        <button onClick={handleRefresh} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-no-data">
        <p>No dashboard data available</p>
        <button onClick={handleRefresh} className="btn btn-primary">
          Refresh
        </button>
      </div>
    );
  }

  // Merge additional stats with dashboard data
  const enhancedData = {
    ...dashboardData,
    additionalStats
  };

  return (
    <div className="dashboard-home-spa">
      <div className="dashboard-stats-bar">
        {additionalStats.customersCount && (
          <div className="stat-item">
            <span className="stat-label">Total Customers</span>
            <span className="stat-value">{additionalStats.customersCount}</span>
          </div>
        )}
        {additionalStats.totalRevenue && (
          <div className="stat-item">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">{additionalStats.totalRevenue}</span>
          </div>
        )}
        {additionalStats.activeMembersCount && (
          <div className="stat-item">
            <span className="stat-label">Active Members</span>
            <span className="stat-value">{additionalStats.activeMembersCount}</span>
          </div>
        )}
        {additionalStats.monthlyRecurringRevenue && (
          <div className="stat-item">
            <span className="stat-label">MRR</span>
            <span className="stat-value">{additionalStats.monthlyRecurringRevenue}</span>
          </div>
        )}
      </div>
      
      <DashboardPage {...dashboardData} />
      
      <button 
        onClick={handleRefresh} 
        className="refresh-button"
        aria-label="Refresh dashboard data"
      >
        🔄 Refresh Data
      </button>
    </div>
  );
};

export default DashboardHome;
