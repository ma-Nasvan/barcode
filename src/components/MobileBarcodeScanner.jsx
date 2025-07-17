import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const MobileBarcodeScanner = ({ onScanSuccess, onScanError }) => {
    const scannerRef = useRef(null);
    const scannerElementId = "mobile-scanner-region";
    const [isScanning, setIsScanning] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [hasFlash, setHasFlash] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);

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

    const toggleFlash = async () => {
        if (scannerRef.current && hasFlash) {
            try {
                await scannerRef.current.applyVideoConstraints({
                    torch: !isFlashOn
                });
                setIsFlashOn(!isFlashOn);
            } catch (err) {
                console.error("Flash toggle failed:", err);
            }
        }
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

        // Enhanced configuration for small QR codes
        const config = {
            fps: 30, // Increased FPS for better responsiveness
            qrbox: function(viewfinderWidth, viewfinderHeight) {
                // Dynamic QR box sizing - smaller for better small code detection
                const minEdgePercentage = 0.4; // 40% of the smaller dimension
                const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                return {
                    width: qrboxSize,
                    height: qrboxSize
                };
            },
            formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.CODE_93,
                Html5QrcodeSupportedFormats.ITF,
                Html5QrcodeSupportedFormats.DATA_MATRIX
            ],
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            },
            // Additional options for better scanning
            aspectRatio: 1.0,
            disableFlip: false,
            verbose: false
        };

        // Enhanced camera configuration for better focus on small codes
        const cameraConfig = {
            facingMode: "environment",
            // Advanced constraints for better focus and resolution
            advanced: [
                {
                    focusMode: "continuous",
                    exposureMode: "continuous",
                    whiteBalanceMode: "continuous"
                }
            ]
        };

        // Alternative: Use specific video constraints for better quality
        const videoConstraints = {
            facingMode: { exact: "environment" },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 },
            focusMode: "continuous",
            exposureMode: "continuous",
            whiteBalanceMode: "continuous"
        };

        try {
            // Try with enhanced video constraints first
            await html5QrCode.start(
                videoConstraints,
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
            
            // Check if flash is available
            const capabilities = html5QrCode.getRunningTrackCapabilities();
            if (capabilities && capabilities.torch) {
                setHasFlash(true);
            }

        } catch (err) {
            console.error("Failed to start scanner with enhanced constraints:", err);
            
            // Fallback to basic camera config
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
                        // Optional: handle scan errors
                    }
                );
                setIsScanning(true);
                
                // Check if flash is available
                const capabilities = html5QrCode.getRunningTrackCapabilities();
                if (capabilities && capabilities.torch) {
                    setHasFlash(true);
                }
            } catch (fallbackErr) {
                console.error("Fallback scanner failed:", fallbackErr);
                setErrorMessage("Camera initialization failed. Please check permissions and try again.");
                if (onScanError) onScanError(fallbackErr.message || fallbackErr);
            }
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
                    border: '2px solid #4285f4',
                    borderRadius: '8px',
                    minHeight: '300px',
                    backgroundColor: '#f8f9fa',
                    position: 'relative'
                }}
            />

            {errorMessage && (
                <div style={{ 
                    color: '#dc3545', 
                    marginTop: '10px', 
                    textAlign: 'center',
                    backgroundColor: '#f8d7da',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #f5c6cb'
                }}>
                    {errorMessage}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                {!isScanning && !errorMessage && (
                    <button
                        onClick={initializeScanner}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4285f4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Restart Scanner
                    </button>
                )}

                {isScanning && hasFlash && (
                    <button
                        onClick={toggleFlash}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: isFlashOn ? '#ffc107' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        {isFlashOn ? '🔦 Flash ON' : '🔦 Flash OFF'}
                    </button>
                )}
            </div>

            <div style={{ 
                textAlign: 'center', 
                fontSize: '14px', 
                color: '#666', 
                marginTop: '15px',
                backgroundColor: '#e9ecef',
                padding: '10px',
                borderRadius: '4px'
            }}>
                <strong>Tips for Small QR Codes:</strong><br/>
                • Hold device steady and close (5-10cm from code)<br/>
                • Ensure good lighting or use flash<br/>
                • Keep QR code flat and parallel to camera<br/>
                • Clean camera lens if blurry
            </div>
        </div>
    );
};

export default MobileBarcodeScanner;