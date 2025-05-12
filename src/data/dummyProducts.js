// src/data/dummyProducts.js
let products = [
    { id: 1, sku: "SKU001", name: "Red T-Shirt", current_stock: 10, description: "A comfortable red t-shirt." },
    { id: 2, sku: "SKU002", name: "Blue Jeans", current_stock: 5, description: "Stylish blue denim jeans." },
    { id: 3, sku: "SKU003", name: "Green Hat", current_stock: 15, description: "A cool green baseball cap." },
    { id: 4, sku: "SKU004", name: "Black Socks (Pair)", current_stock: 25, description: "Comfortable black cotton socks." },
  ];
  
  // Simulate API call to fetch product by SKU
  export const fetchProductBySkuAPI = (sku) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => { // Simulate network delay
        const product = products.find(p => p.sku === sku);
        if (product) {
          resolve({ ...product }); // Return a copy
        } else {
          reject(new Error("Product not found with this SKU."));
        }
      }, 500);
    });
  };
  
  // Simulate API call to receive stock
  export const receiveStockAPI = (sku, quantity) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const productIndex = products.findIndex(p => p.sku === sku);
        if (productIndex !== -1) {
          products[productIndex].current_stock += quantity;
          resolve({ ...products[productIndex] }); // Return updated product (copy)
        } else {
          reject(new Error("Product not found, cannot update stock."));
        }
      }, 500);
    });
  };
  
  // Function to get all products (for display if needed, or for re-rendering list)
  export const getAllProducts = () => {
      return [...products]; // Return a copy
  }