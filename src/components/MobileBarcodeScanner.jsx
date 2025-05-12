import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const MobileBarcodeScanner = ({ onScanSuccess, onScanError }) => {
    const scannerRef = useRef(null);
    const scannerElementId = "mobile-scanner-region";
    const [isScanning, setIsScanning] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Function to properly cleanup and reset scanner
    const cleanupScanner = async () => {
        console.log("Cleaning up scanner resources");
        if (scannerRef.current) {
            try {
                // Properly stop scanning before cleanup
                await scannerRef.current.pause(true);
                await scannerRef.current.clear();
                console.log("Scanner cleared successfully");
            } catch (e) {
                console.error("Error during scanner cleanup:", e);
            }
            scannerRef.current = null;
        }
        
        // Ensure DOM element is cleared
        const scannerDiv = document.getElementById(scannerElementId);
        if (scannerDiv) {
            scannerDiv.innerHTML = '';
        }
    };

    // Function to initialize the scanner
    const initializeScanner = async () => {
        // First ensure any previous scanner is cleaned up
        await cleanupScanner();
        
        setIsScanning(false);
        setErrorMessage('');
        
        const scannerDiv = document.getElementById(scannerElementId);
        if (!scannerDiv) {
            setErrorMessage("Scanner element not found in DOM");
            return;
        }

        scannerDiv.innerHTML = '<p style="padding: 10px; color: #555; text-align: center;">Initializing Camera...</p>';

        try {
            const scanner = new Html5QrcodeScanner(
                scannerElementId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 150 },
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.UPC_A,
                        Html5QrcodeSupportedFormats.QR_CODE,
                    ],
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true
                    },
                    // Force camera selection dialog to appear each time
                    showTorchButtonIfSupported: true
                },
                false // verbose
            );

            const handleSuccess = (decodedText, decodedResult) => {
                console.log("Scan success:", decodedText);
                setIsScanning(false);
                
                // Call success callback
                if (onScanSuccess) {
                    onScanSuccess(decodedText, decodedResult);
                }
            };

            const handleError = (errorMessage) => {
                // Log serious errors
                if (errorMessage && errorMessage.includes("Unable to start scanning")) {
                    console.error("Camera access error:", errorMessage);
                    setErrorMessage(`Camera error: ${errorMessage}`);
                    if (onScanError) onScanError(errorMessage);
                }
            };

            // Render the scanner
            await scanner.render(handleSuccess, handleError);
            scannerRef.current = scanner;
            setIsScanning(true);
            console.log("Scanner initialized successfully");
            
        } catch (error) {
            console.error("Scanner initialization error:", error);
            setErrorMessage(`Failed to initialize: ${error.message || error}`);
            if (onScanError) onScanError(error.message || error);
            
            // Display user-friendly error message
            const scannerDiv = document.getElementById(scannerElementId);
            if (scannerDiv) {
                scannerDiv.innerHTML = `<p style="padding: 10px; color: #c00; text-align: center;">
                    Camera access failed. Please check your permissions and try again.
                </p>`;
            }
        }
    };

    useEffect(() => {
        // Initialize scanner when component mounts
        initializeScanner();
        
        // Clean up when component unmounts
        return cleanupScanner;
    }, []); // Only run once on mount

    return (
        <div style={{ maxWidth: '400px', margin: '20px auto' }}>
            <div 
                id={scannerElementId} 
                style={{ 
                    border: '1px solid #ccc', 
                    borderRadius: '5px', 
                    minHeight: '200px', 
                    backgroundColor: '#f0f0f0' 
                }}
            />
            
            {errorMessage && (
                <div style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>
                    {errorMessage}
                </div>
            )}
            
            {!isScanning && !errorMessage && (
                <button 
                    onClick={initializeScanner}
                    style={{
                        display: 'block',
                        margin: '10px auto',
                        padding: '8px 16px',
                        backgroundColor: '#4285f4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Restart Scanner
                </button>
            )}
        </div>
    );
};

export default MobileBarcodeScanner;