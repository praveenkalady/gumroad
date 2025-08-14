import React from "react";

interface ProductNewProps {
  currentUser?: any;
}

const ProductNew: React.FC<ProductNewProps> = ({ currentUser }) => {
  return (
    <div className="product-new-spa">
      <h1>Create New Product</h1>
      <p>New product form will be implemented here</p>
    </div>
  );
};

export default ProductNew;
