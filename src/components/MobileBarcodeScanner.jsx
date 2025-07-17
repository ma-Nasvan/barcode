import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const MobileBarcodeScanner = ({ onScanSuccess, onScanError }) => {
    const scannerRef = useRef(null);
    const scannerElementId = "mobile-scanner-region";
    const [isScanning, setIsScanning] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [hasFlash, setHasFlash] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);

    // Cleanup scanner
    const cleanupScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.getState() === 2) {
                    await scannerRef.current.stop();
                }
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
        setIsInitializing(false);
        setHasFlash(false);
        setIsFlashOn(false);
    };

    const toggleFlash = async () => {
        if (scannerRef.current && hasFlash && isScanning) {
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
        if (isInitializing) return;

        setIsInitializing(true);
        await cleanupScanner();

        setErrorMessage('');
        const scannerDiv = document.getElementById(scannerElementId);
        if (!scannerDiv) {
            setErrorMessage("Scanner container not found.");
            setIsInitializing(false);
            return;
        }

        const html5QrCode = new Html5Qrcode(scannerElementId);
        scannerRef.current = html5QrCode;

        const config = {
            fps: 20,
            qrbox: function (viewfinderWidth, viewfinderHeight) {
                const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdgeSize * 0.6);
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
                Html5QrcodeSupportedFormats.CODE_39
            ],
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
            },
            supportTorch: true
        };

        try {
            const devices = await Html5Qrcode.getCameras();
            if (!devices || devices.length === 0) {
                setErrorMessage("No camera devices found.");
                setIsInitializing(false);
                return;
            }

            // Try to find rear-facing camera
            const rearCamera = devices.find(device =>
                device.label.toLowerCase().includes("back") ||
                device.label.toLowerCase().includes("rear")
            );

            const selectedCameraId = rearCamera ? rearCamera.id : devices[0].id;

            await html5QrCode.start(
                {
                    deviceId: { exact: selectedCameraId },
                    advanced: [
                        { focusMode: "continuous" }, // may be ignored if not supported
                        { zoom: 2 } // small zoom helps focus on small codes
                    ]
                },
                config,
                (decodedText, decodedResult) => {
                    console.log("Scan result:", decodedText);
                    if (onScanSuccess) onScanSuccess(decodedText, decodedResult);
                    setIsScanning(false);
                },
                (scanError) => {
                    // Silent scan error
                }
            );

            setIsScanning(true);
            setIsInitializing(false);

            setTimeout(() => {
                try {
                    const capabilities = html5QrCode.getRunningTrackCapabilities();
                    if (capabilities && capabilities.torch) {
                        setHasFlash(true);
                    }
                } catch (capErr) {
                    console.log("Flash capability check failed:", capErr);
                }
            }, 1000);

        } catch (err) {
            console.error("Failed to start scanner:", err);
            setErrorMessage("Camera initialization failed. Please check permissions and try again.");
            setIsInitializing(false);
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
                {!isScanning && !errorMessage && !isInitializing && (
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

                {isInitializing && (
                    <div style={{
                        padding: '10px 20px',
                        backgroundColor: '#f8f9fa',
                        color: '#6c757d',
                        border: '1px solid #dee2e6',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        Initializing Camera...
                    </div>
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
                <strong>Tips for Small QR Codes (1cm):</strong><br />
                • Hold device 8-12cm from the QR code<br />
                • Ensure bright lighting or use flash<br />
                • Keep QR code completely flat<br />
                • Move slowly until code is detected<br />
                • Clean camera lens for better focus
            </div>
        </div>
    );
};

export default MobileBarcodeScanner;
