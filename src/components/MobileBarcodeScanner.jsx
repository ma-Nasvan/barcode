import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const MobileBarcodeScanner = ({ onScanSuccess, onScanError }) => {
    const scannerRef = useRef(null);
    const scannerElementId = "mobile-scanner-region";
    const [isScanning, setIsScanning] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Cleanup scanner
    const cleanupScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                await scannerRef.current.clear();
            } catch (err) {
                console.error("Error cleaning up scanner:", err);
            }
            scannerRef.current = null;
        }

        const scannerDiv = document.getElementById(scannerElementId);
        if (scannerDiv) {
            scannerDiv.innerHTML = '';
        }
        setIsScanning(false);
    };

    const initializeScanner = async () => {
        await cleanupScanner(); // Reset before starting new

        setErrorMessage('');
        const scannerDiv = document.getElementById(scannerElementId);
        if (!scannerDiv) {
            setErrorMessage("Scanner container not found.");
            return;
        }

        const html5QrCode = new Html5Qrcode(scannerElementId);
        scannerRef.current = html5QrCode;

        const config = {
            fps: 15,
            qrbox: { width: 150, height: 150 },
            formatsToSupport: [
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.QR_CODE
            ],
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            }
        };

     
   const cameraConfig = {
  facingMode: "environment"
};
        try {
            await html5QrCode.start(
                cameraConfig,
                config,
                (decodedText, decodedResult) => {
                    console.log("Scan result:", decodedText);
                    if (onScanSuccess) onScanSuccess(decodedText, decodedResult);
                    setIsScanning(false);
                },
                (scanError) => {
                    // Optional: handle scan errors (don't spam)
                }
            );

            setIsScanning(true);
        } catch (err) {
            console.error("Failed to start scanner:", err);
            setErrorMessage("Camera initialization failed. Please check permissions.");
            if (onScanError) onScanError(err.message || err);
        }
    };

    useEffect(() => {
        initializeScanner();
        return cleanupScanner;
    }, []);

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

            <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
                Tip: Bring the QR code closer and use good lighting. Torch support will show if available.
            </p>
        </div>
    );
};

export default MobileBarcodeScanner;
