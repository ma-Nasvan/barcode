import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';


const MobileBarcodeScanner = ({ onScanSuccess, onScanError }) => {
    const scannerRef = useRef(null);
    const videoRef = useRef(null);
    const [isScanning, setIsScanning] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const supportedFormats = [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_128,
        BarcodeFormat.EAN_13,
        BarcodeFormat.UPC_A
    ];

    const initializeScanner = async () => {
        setErrorMessage('');
        setIsScanning(false);
        
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, supportedFormats);

        const codeReader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 200 });
        scannerRef.current = codeReader;

        try {
            const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
            const backCamera = videoInputDevices.find(device => device.label.toLowerCase().includes('back')) || videoInputDevices[0];

            if (!backCamera) {
                throw new Error("No camera found");
            }

            await codeReader.decodeFromVideoDevice(
                backCamera.deviceId,
                videoRef.current,
                (result, err) => {
                    if (result) {
                        codeReader.reset(); // Stop scanning after first result
                        setIsScanning(false);
                        if (onScanSuccess) onScanSuccess(result.getText(), result);
                    }
                    // (Optional) You can handle scan errors or continue silently
                },
                {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                }
            );

            setIsScanning(true);
        } catch (err) {
            console.error("Scanner error:", err);
            setErrorMessage("Failed to initialize camera. Please check permissions or try a different device.");
            if (onScanError) onScanError(err.message || err);
        }
    };

    const cleanupScanner = async () => {
        if (scannerRef.current) {
            await scannerRef.current.reset();
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    useEffect(() => {
        initializeScanner();
        return () => {
            cleanupScanner();
        };
    }, []);

    return (
        <div style={{ maxWidth: '400px', margin: '20px auto' }}>
            <div
                style={{
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    minHeight: '200px',
                    backgroundColor: '#000',
                    position: 'relative'
                }}
            >
                <video
                    ref={videoRef}
                    style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '5px'
                    }}
                    muted
                    autoPlay
                    playsInline
                />
            </div>

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
                Tip: Hold the QR or barcode steady and ensure good lighting.
            </p>
        </div>
    );
};

export default MobileBarcodeScanner;
