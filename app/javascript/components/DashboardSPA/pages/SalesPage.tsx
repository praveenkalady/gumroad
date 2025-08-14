import React, { useState, useEffect, useCallback } from "react";
import { Chart } from "../../Chart";
import { LoadingSpinner } from "../../LoadingSpinner";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface Sale {
  id: string;
  product_name: string;
  customer_email: string;
  price: string;
  created_at: string;
  status: string;
  refunded: boolean;
  country: string;
}

interface SalesStats {
  total_revenue: number;
  total_sales: number;
  average_order_value: number;
  conversion_rate: number;
  refund_rate: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

interface SalesPageProps {
  currentUser?: any;
}

const SalesPage: React.FC<SalesPageProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [dateRange, setDateRange] = useState("last_30_days");
  const [productFilter, setProductFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchSalesData();
  }, [dateRange, productFilter, currentPage]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        date_range: dateRange,
        product_filter: productFilter,
        page: currentPage.toString(),
        per_page: "50"
      });

      // Fetch sales data
      const salesResponse = await fetch(`/analytics/data/by_date?${params}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        credentials: 'same-origin'
      });

      if (!salesResponse.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const salesData = await salesResponse.json();
      setSales(salesData.sales || []);
      setStats(salesData.stats || null);
      setTotalPages(salesData.total_pages || 1);

      // Process chart data
      if (salesData.chart_data) {
        setChartData({
          labels: salesData.chart_data.dates,
          datasets: [
            {
              label: 'Revenue',
              data: salesData.chart_data.revenue,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)'
            },
            {
              label: 'Sales Count',
              data: salesData.chart_data.sales_count,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)'
            }
          ]
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      
      const params = new URLSearchParams({
        date_range: dateRange,
        product_filter: productFilter,
        format: 'csv'
      });

      const response = await fetch(`/purchases/export?${params}`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download the CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export sales data');
    } finally {
      setExportLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => 
    sale.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !stats) {
    return (
      <div className="sales-loading">
        <LoadingSpinner />
        <p>Loading sales data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sales-error">
        <h2>Error loading sales</h2>
        <p>{error}</p>
        <button onClick={fetchSalesData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="sales-page-spa">
      <header className="sales-header">
        <h1>Sales Dashboard</h1>
        <button 
          onClick={handleExport} 
          className="btn btn-secondary"
          disabled={exportLoading}
        >
          {exportLoading ? 'Exporting...' : 'Export CSV'}
        </button>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="sales-stats-grid">
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-value">${(stats.total_revenue / 100).toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Total Sales</h3>
            <p className="stat-value">{stats.total_sales}</p>
          </div>
          <div className="stat-card">
            <h3>Average Order Value</h3>
            <p className="stat-value">${(stats.average_order_value / 100).toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Conversion Rate</h3>
            <p className="stat-value">{stats.conversion_rate.toFixed(2)}%</p>
          </div>
          <div className="stat-card">
            <h3>Refund Rate</h3>
            <p className="stat-value">{stats.refund_rate.toFixed(2)}%</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="sales-filters">
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          className="filter-select"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="last_30_days">Last 30 Days</option>
          <option value="last_90_days">Last 90 Days</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_year">This Year</option>
          <option value="all_time">All Time</option>
        </select>

        <select 
          value={productFilter} 
          onChange={(e) => setProductFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Products</option>
          <option value="digital">Digital Products</option>
          <option value="physical">Physical Products</option>
          <option value="memberships">Memberships</option>
          <option value="bundles">Bundles</option>
        </select>

        <input
          type="text"
          placeholder="Search sales..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Chart */}
      {chartData && (
        <div className="sales-chart-container">
          <h2>Sales Trend</h2>
          <Chart 
            type="line"
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Revenue & Sales Over Time'
                }
              }
            }}
          />
        </div>
      )}

      {/* Sales Table */}
      <div className="sales-table-container">
        <h2>Recent Sales</h2>
        {filteredSales.length === 0 ? (
          <p className="no-sales">No sales found for the selected period</p>
        ) : (
          <>
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td>{format(new Date(sale.created_at), 'MMM dd, yyyy')}</td>
                    <td>{sale.product_name}</td>
                    <td>{sale.customer_email}</td>
                    <td>{sale.price}</td>
                    <td>{sale.country}</td>
                    <td>
                      <span className={`status-badge ${sale.refunded ? 'refunded' : sale.status}`}>
                        {sale.refunded ? 'Refunded' : sale.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm"
                        onClick={() => window.location.href = `/purchases/${sale.id}/receipt`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-sm"
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SalesPage;
