'use client';

import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';

interface QrScannerProps {
    onScan: (decodedText: string) => void;
    isPaused: boolean;
}

export function QrScanner({ onScan, isPaused }: QrScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    useEffect(() => {
        let scanner: Html5Qrcode | null = null;

        const onScanSuccess = (decodedText: string) => {
            if (!isPaused) {
                onScan(decodedText);
            }
        };

        const onScanFailure = (error: any) => {
            // Ignore errors, or log them if needed for debugging
            // console.warn(error);
        };

        const startScanner = async () => {
            if (scannerRef.current) return; // Only start if not already initialized

            try {
                // Check if mediaDevices is supported
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    setError('Camera access is not supported by this browser. Please use a modern browser (Chrome/Edge/Safari) over HTTPS or localhost.');
                    return;
                }

                scanner = new Html5Qrcode('reader');
                scannerRef.current = scanner; // Store the instance

                // Try to get cameras
                const devices = await Html5Qrcode.getCameras().catch(err => {
                    console.warn('Could not list cameras:', err);
                    return [];
                });

                let config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                // Prefer back camera if available, otherwise just use environment facing mode
                if (devices && devices.length > 0) {
                    // Start with the last camera (usually back on mobile)
                    const cameraId = devices[devices.length - 1].id;
                    await scanner.start(
                        cameraId,
                        config,
                        onScanSuccess,
                        onScanFailure
                    );
                } else {
                    // Fallback to constraint-based start if enumeration fails or no cameras found
                    await scanner.start(
                        { facingMode: "environment" },
                        config,
                        onScanSuccess,
                        onScanFailure
                    );
                }
            } catch (err: any) {
                console.error('Error starting scanner', err);

                let msg = 'Failed to access camera.';
                if (err?.name === 'NotAllowedError') msg = 'Camera permission denied.';
                else if (typeof err === 'string') msg = err; // Pass through library errors

                setError(msg);
            }
        };

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            if (mounted && !isPaused) { // Only start if mounted and not paused initially
                startScanner();
            }
        }, 500);

        // Handle pause/resume based on isPaused prop
        if (scannerRef.current) {
            if (isPaused && scannerRef.current.isScanning) {
                scannerRef.current.pause(true);
            }

            // Generally start/stop is heavy. 
            // pause/resume is better.
            if (!isPaused) {
                try {
                    scannerRef.current.resume();
                } catch (error) {
                    // Scanner might not be paused, which causes resume to throw
                }
            }
        }
    }, [mounted, isPaused, onScan]);

    return (
        <div className="w-full h-full relative overflow-hidden bg-black">
            <div id="reader" className="w-full h-full bg-black object-cover" />

            {/* Helper Frame */}
            <div className="absolute inset-0 border-40 border-black/50 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
                </div>
            </div>

            {error && <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-black">{error}</div>}
        </div>
    );
}
