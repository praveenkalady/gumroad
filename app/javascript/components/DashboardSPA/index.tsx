import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { LoadingSpinner } from "../LoadingSpinner";
import { ErrorBoundary } from "react-error-boundary";
import "./styles.scss";

// Lazy load dashboard components for code splitting
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const ProductNew = lazy(() => import("./pages/ProductNew"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));

// Navigation component with active state
const DashboardNav: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="dashboard-spa-nav">
      <ul className="nav-list">
        <li className={isActive("/dashboard") ? "active" : ""}>
          <Link to="/dashboard" className="nav-link">
            <span className="icon">📊</span>
            Dashboard
          </Link>
        </li>
        <li className={isActive("/products") ? "active" : ""}>
          <Link to="/products" className="nav-link">
            <span className="icon">📦</span>
            Products
          </Link>
        </li>
        <li className={isActive("/dashboard/sales") ? "active" : ""}>
          <Link to="/dashboard/sales" className="nav-link">
            <span className="icon">💰</span>
            Sales
          </Link>
        </li>
        <li className={isActive("/products/new") ? "active" : ""}>
          <Link to="/products/new" className="nav-link">
            <span className="icon">➕</span>
            New Product
          </Link>
        </li>
        <li className={isActive("/discover") ? "active" : ""}>
          <Link to="/discover" className="nav-link">
            <span className="icon">🔍</span>
            Discover
          </Link>
        </li>
        <li className={isActive("/library") ? "active" : ""}>
          <Link to="/library" className="nav-link">
            <span className="icon">📚</span>
            Library
          </Link>
        </li>
      </ul>
    </nav>
  );
};

// Error fallback component
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="error-container" role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
};

// Loading component
const PageLoader: React.FC = () => {
  return (
    <div className="page-loader">
      <LoadingSpinner />
      <p>Loading...</p>
    </div>
  );
};

interface DashboardSPAProps {
  initialData?: any;
  currentUser?: any;
}

export const DashboardSPA: React.FC<DashboardSPAProps> = ({ initialData, currentUser }) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <Router>
        <div className="dashboard-spa-container">
          <DashboardNav />
          <main className="dashboard-spa-content">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/dashboard" element={<DashboardHome initialData={initialData} currentUser={currentUser} />} />
                <Route path="/products" element={<ProductsPage currentUser={currentUser} />} />
                <Route path="/dashboard/sales" element={<SalesPage currentUser={currentUser} />} />
                <Route path="/products/new" element={<ProductNew currentUser={currentUser} />} />
                <Route path="/discover" element={<DiscoverPage currentUser={currentUser} />} />
                <Route path="/library" element={<LibraryPage currentUser={currentUser} />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default DashboardSPA;
