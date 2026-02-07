'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import {
    Camera,
    X,
    SwitchCamera,
    Loader2,
    AlertCircle,
    Flashlight,
    ScanLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onScan }: BarcodeScannerProps) {
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
    const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const mounterRef = useRef(false);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
                    await scannerRef.current.stop();
                    scannerRef.current.clear();
                }
            } catch (e) {
                console.error('Error stopping scanner:', e);
            }
        }
    }, []);

    const startScanner = useCallback(async (cameraId: string) => {
        if (!scannerRef.current) return;

        setError(null);
        setIsInitializing(true);

        try {
            await scannerRef.current.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 280, height: 150 },
                    aspectRatio: 1.777778,
                },
                (decodedText) => {
                    // Check if component is still active/mounted
                    if (!mounterRef.current) return;

                    // Prevent duplicate scans
                    if (decodedText !== lastScanned) {
                        setLastScanned(decodedText);

                        // Immediately disable further processing
                        mounterRef.current = false;

                        // Vibrate on successful scan (mobile)
                        if (navigator.vibrate) {
                            navigator.vibrate(100);
                        }

                        // Stop scanner immediately to prevent background scanning
                        stopScanner().then(() => {
                            onScan(decodedText);
                        });
                    }
                },
                () => {
                    // QR code not found - this is normal, just ignore
                }
            );
            setIsInitializing(false);
        } catch (err: any) {
            console.error('Scanner start error:', err);
            // Only set error if we are still mounted
            if (mounterRef.current) {
                setError(err.message || 'Failed to start camera');
                setIsInitializing(false);
            }
        }
    }, [lastScanned, onScan, stopScanner]);

    useEffect(() => {
        if (!isOpen) {
            // Ensure cleanup if isOpen becomes false
            mounterRef.current = false;
            return;
        }

        mounterRef.current = true;

        const initScanner = async () => {
            if (!mounterRef.current) return;

            setIsInitializing(true);
            setError(null);
            setLastScanned(null);

            try {
                // Get available cameras
                const devices = await Html5Qrcode.getCameras();

                if (devices.length === 0) {
                    setError('No cameras found on this device');
                    setIsInitializing(false);
                    return;
                }

                setCameras(devices);

                // Prefer back camera on mobile
                const backCamIndex = devices.findIndex(d =>
                    d.label.toLowerCase().includes('back') ||
                    d.label.toLowerCase().includes('rear')
                );
                const initialIndex = backCamIndex >= 0 ? backCamIndex : 0;
                setCurrentCameraIndex(initialIndex);

                // Create scanner instance
                scannerRef.current = new Html5Qrcode('barcode-scanner-container');

                // Start with selected camera
                await startScanner(devices[initialIndex].id);

            } catch (err: any) {
                console.error('Scanner init error:', err);
                if (err.name === 'NotAllowedError') {
                    setError('Camera permission denied. Please allow camera access to scan barcodes.');
                } else {
                    setError(err.message || 'Failed to initialize scanner');
                }
                setIsInitializing(false);
            }
        };

        initScanner();

        return () => {
            stopScanner();
            scannerRef.current = null;
        };
    }, [isOpen, startScanner, stopScanner]);

    const switchCamera = async () => {
        if (cameras.length <= 1) return;

        await stopScanner();

        const nextIndex = (currentCameraIndex + 1) % cameras.length;
        setCurrentCameraIndex(nextIndex);

        await startScanner(cameras[nextIndex].id);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <ScanLine size={20} />
                    </div>
                    <div>
                        <h2 className="text-white font-bold">Scan Barcode</h2>
                        <p className="text-white/60 text-xs">Point camera at product barcode</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {cameras.length > 1 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={switchCamera}
                            className="text-white/80 hover:text-white hover:bg-white/10"
                        >
                            <SwitchCamera size={20} />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                        <X size={24} />
                    </Button>
                </div>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div
                    ref={containerRef}
                    className="relative w-full max-w-md aspect-[16/10] bg-black rounded-2xl overflow-hidden"
                >
                    {/* Scanner container - html5-qrcode will render here */}
                    <div
                        id="barcode-scanner-container"
                        className="w-full h-full"
                        style={{ position: 'relative' }}
                    />

                    {/* Scan guide overlay */}
                    {!error && !isInitializing && (
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Corner markers */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-emerald-500 rounded-tl-lg" />
                            <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-emerald-500 rounded-tr-lg" />
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-emerald-500 rounded-bl-lg" />
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-emerald-500 rounded-br-lg" />

                            {/* Animated scan line */}
                            <div className="absolute left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse"
                                style={{ top: '50%' }}
                            />
                        </div>
                    )}

                    {/* Loading state */}
                    {isInitializing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                            <Loader2 className="animate-spin text-emerald-500 mb-3" size={40} />
                            <p className="text-white/80 text-sm">Starting camera...</p>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-6">
                            <AlertCircle className="text-rose-500 mb-3" size={48} />
                            <p className="text-white text-center font-medium mb-2">Camera Error</p>
                            <p className="text-white/60 text-sm text-center mb-4">{error}</p>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="text-white border-white/30 hover:bg-white/10"
                            >
                                Retry
                            </Button>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="mt-6 text-center">
                    <p className="text-white/60 text-sm">
                        Position the barcode within the frame
                    </p>
                    <p className="text-white/40 text-xs mt-1">
                        Works with EAN-13, UPC-A, and other formats
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-black/50 backdrop-blur-sm">
                <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full h-14 rounded-2xl text-white border-white/20 hover:bg-white/10 font-bold uppercase tracking-wider"
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}
