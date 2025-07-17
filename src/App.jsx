// src/App.jsx
import React, { useState } from 'react'; // Removed useEffect for getAllProducts as it's static for demo
import './App.css'; // Import the CSS file
import HardwareScanInput from './components/HardwareScanInput';
import MobileBarcodeScanner from './components/MobileBarcodeScanner';
import { fetchProductBySkuAPI, receiveStockAPI, getAllProducts } from './data/dummyProducts';

function App() {
  const [currentProducts, setCurrentProducts] = useState(getAllProducts());
  const [scannedProduct, setScannedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showMobileScanner, setShowMobileScanner] = useState(false);
  const [scannerKey, setScannerKey] = useState(0); 
  const [sku,setSku] = useState('');
  // Removed useEffect for getAllProducts as it's static for demo
  const resetMessages = () => {
    setMessage('');
    setError('');
  };

  const handleSkuScanned = async (sku) => {
    setSku(sku);
    console.log("Handling SKU Scanned:", sku);
    resetMessages();
    setScannedProduct(null);
    if (showMobileScanner) {
       // setShowMobileScanner(false); // Consider user experience, maybe keep it open if they want to scan more
    }


    try {
      const product = await fetchProductBySkuAPI(sku);
      setScannedProduct(product);
      setMessage(`Product Found: ${product.name} (SKU: ${product.sku})`);
    } catch (err) {
      setError(err.message || "Error finding product.");
    }
  };

  const handleMobileScanSuccess = (decodedText, decodedResult) => {
    console.log("Mobile scan success:", decodedText);
    handleSkuScanned(decodedText);
    // You might want to automatically hide the scanner after a successful scan
    // or provide a button to scan again.
    // For now, let's hide it to simplify:
    setShowMobileScanner(false);
  };

  const handleMobileScanError = (errorMessage) => {
    setError(`Mobile Scan Error: ${errorMessage}. Try hardware input or check camera permissions.`);
    // setShowMobileScanner(false); // Optionally hide on major errors
  };

  const handleReceiveStock = async () => {
    resetMessages();
    if (!scannedProduct || quantity <= 0) {
      setError("Please scan a product and enter a valid quantity.");
      return;
    }
    try {
      const updatedProduct = await receiveStockAPI(scannedProduct.sku, parseInt(quantity, 10));
      setScannedProduct(updatedProduct);
      setCurrentProducts(getAllProducts());
      setMessage(`${quantity} of ${updatedProduct.name} received. New stock: ${updatedProduct.current_stock}.`);
    } catch (err) {
      setError(err.message || "Error receiving stock.");
    }
  };

  const toggleMobileScanner = () => {
    resetMessages();
    if (!showMobileScanner) {
        setScannedProduct(null);
        setScannerKey(prevKey => prevKey + 1); // Change key to force remount when opening
    }
    setShowMobileScanner(prev => !prev);
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Barcode Stock Management Demo (Vite)</h1>
      </header>
      <main className="container">
        <div className="scan-section">
          <h2>Scan Product SKU</h2>
          <HardwareScanInput onScan={handleSkuScanned} />
          {sku.length>0 && (
            <p className="message scanned-sku">Scanned SKU: {sku}</p>
          )}
          <button
            onClick={toggleMobileScanner}
            className="toggle-scanner-btn"
          >
            {showMobileScanner ? "Close Camera Scanner" : "Open Camera Scanner"}
          </button>
          {/* Conditionally render the scanner.
              Keying it can help ensure it fully unmounts/remounts if needed,
              but html5-qrcode is stateful with the DOM element it attaches to.
              Careful management in its own useEffect cleanup is key.
          */}
         {showMobileScanner && (
      <MobileBarcodeScanner
        key={`scanner-${scannerKey}`} // Key changes when scanner is re-opened
        onScanSuccess={handleMobileScanSuccess}
        onScanError={handleMobileScanError}
      />
    )}
        </div>
        {sku && <p className="message scanned-sku">Scanned SKU: {sku}</p>}
        {error && <p className="message error-message">{error}</p>}
        {message && <p className="message success-message">{message}</p>}

        {scannedProduct && (
          <div className="product-details">
            <h3>Scanned Product Details:</h3>
            <p><strong>Name:</strong> {scannedProduct.name}</p>
            <p><strong>SKU:</strong> {scannedProduct.sku}</p>
            <p><strong>Description:</strong> {scannedProduct.description}</p>
            <p><strong>Current Stock:</strong> {scannedProduct.current_stock}</p>
            <div className="receive-stock-section">
              <label htmlFor="quantity">Quantity to Receive:</label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
              />
              <button onClick={handleReceiveStock}>Receive Stock</button>
            </div>
          </div>
        )}

        <div className="product-list-section">
          <h2>Current Product Inventory</h2>
          <ul>
            {currentProducts.map(p => (
              <li key={p.id}>
                {p.name} (SKU: {p.sku}) - Stock: {p.current_stock}
              </li>
            ))}
          </ul>
        </div>
         <div className="instructions">
          <h3>How to Test:</h3>
          <p>1. <strong>Hardware Scan:</strong> Focus the input field and type a SKU (e.g., SKU001, SKU002) then press Enter. Or use a USB barcode scanner.</p>
          <p>2. <strong>Mobile Scan:</strong> Click "Open Camera Scanner". Allow camera permissions. Scan a barcode of one of the SKUs.</p>
          <p>Supported SKUs for demo: SKU001, SKU002, SKU003, SKU004</p>
          <p>To generate a test barcode for SKU001 (Code128): <a href="https://barcode.tec-it.com/en/Code128?data=SKU001" target="_blank" rel="noopener noreferrer">Generate SKU001 Barcode</a></p>
        </div>
      </main>
    </div>
  );
}

export default App;