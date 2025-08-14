import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: string;
  sales_count: number;
  revenue: string;
  status: string;
  thumbnail_url?: string;
  unique_permalink: string;
  published: boolean;
}

interface ProductsPageProps {
  currentUser?: any;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    fetchProducts();
  }, [filterStatus, sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        status: filterStatus,
        sort: sortBy,
      });
      
      const response = await fetch(`/products.json?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(`/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      // Remove the product from the list
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product. Please try again.');
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="products-loading">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-error">
        <h2>Error loading products</h2>
        <p>{error}</p>
        <button onClick={fetchProducts} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="products-page-spa">
      <header className="products-header">
        <h1>Products</h1>
        <Link to="/products/new" className="btn btn-primary">
          + New Product
        </Link>
      </header>

      <div className="products-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Products</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="recent">Most Recent</option>
            <option value="sales">Most Sales</option>
            <option value="revenue">Most Revenue</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="no-products">
          <p>No products found</p>
          {searchTerm && (
            <p>Try adjusting your search term</p>
          )}
          <Link to="/products/new" className="btn btn-secondary">
            Create Your First Product
          </Link>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              {product.thumbnail_url && (
                <img 
                  src={product.thumbnail_url} 
                  alt={product.name}
                  className="product-thumbnail"
                />
              )}
              <div className="product-info">
                <h3>{product.name}</h3>
                <div className="product-meta">
                  <span className="price">{product.price}</span>
                  <span className="sales">{product.sales_count} sales</span>
                  <span className="revenue">{product.revenue}</span>
                </div>
                <div className="product-status">
                  <span className={`status-badge ${product.published ? 'published' : 'draft'}`}>
                    {product.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="product-actions">
                <a 
                  href={`/products/${product.unique_permalink}/edit`}
                  className="btn btn-sm btn-secondary"
                  onClick={(e) => {
                    e.preventDefault();
                    // In a full SPA, this would navigate to an edit component
                    window.location.href = `/products/${product.unique_permalink}/edit`;
                  }}
                >
                  Edit
                </a>
                <a 
                  href={`/${product.unique_permalink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-secondary"
                >
                  View
                </a>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="btn btn-sm btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .products-page-spa {
          padding: 20px;
        }
        
        .products-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .products-controls {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .search-box {
          flex: 1;
        }
        
        .search-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .filters {
          display: flex;
          gap: 10px;
        }
        
        .filter-select, .sort-select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .product-card {
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 15px;
          transition: box-shadow 0.3s;
        }
        
        .product-card:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .product-thumbnail {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        
        .product-info h3 {
          margin: 0 0 10px 0;
        }
        
        .product-meta {
          display: flex;
          gap: 15px;
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .status-badge.published {
          background: #d4f4dd;
          color: #2e7d32;
        }
        
        .status-badge.draft {
          background: #fff3cd;
          color: #856404;
        }
        
        .product-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        
        .no-products {
          text-align: center;
          padding: 50px;
        }
      `}</style>
    </div>
  );
};

export default ProductsPage;
