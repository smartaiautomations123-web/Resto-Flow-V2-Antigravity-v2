/**
 * Barcode Scanner Service
 * Supports both USB hardware scanners (keyboard input) and web camera scanning
 */

export interface BarcodeResult {
  code: string;
  type: 'ean' | 'upca' | 'code128' | 'qr' | 'unknown';
  timestamp: Date;
}

export type BarcodeScannerCallback = (result: BarcodeResult) => void;

class BarcodeScanner {
  private listeners: BarcodeScannerCallback[] = [];
  private buffer: string = '';
  private bufferTimeout: NodeJS.Timeout | null = null;
  private isListening: boolean = false;
  private readonly BUFFER_TIMEOUT = 100; // ms to wait for complete barcode

  /**
   * Start listening for barcode input (hardware scanner via keyboard)
   */
  public startListening(): void {
    if (this.isListening) return;

    this.isListening = true;
    window.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Stop listening for barcode input
   */
  public stopListening(): void {
    this.isListening = false;
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Register callback for barcode scans
   */
  public onScan(callback: BarcodeScannerCallback): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Handle keyboard input from hardware scanner
   * Hardware scanners typically send all characters rapidly followed by Enter
   */
  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.isListening) return;

    // Ignore if user is typing in an input field (unless it's our scanner input)
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' &&
      (target as HTMLInputElement).id !== 'barcode-scanner-input'
    ) {
      return;
    }

    // Enter key signals end of barcode
    if (event.key === 'Enter') {
      if (this.buffer.length > 0) {
        this.processBarcode(this.buffer);
        this.buffer = '';
      }
      event.preventDefault();
      return;
    }

    // Accumulate characters
    if (event.key.length === 1) {
      this.buffer += event.key;

      // Reset timeout
      if (this.bufferTimeout) clearTimeout(this.bufferTimeout);

      // Auto-process if buffer gets too long (in case scanner doesn't send Enter)
      this.bufferTimeout = setTimeout(() => {
        if (this.buffer.length > 0) {
          this.processBarcode(this.buffer);
          this.buffer = '';
        }
      }, this.BUFFER_TIMEOUT);
    }
  };

  /**
   * Process and emit barcode
   */
  private processBarcode(code: string): void {
    const type = this.detectBarcodeType(code);
    const result: BarcodeResult = {
      code,
      type,
      timestamp: new Date(),
    };

    this.listeners.forEach((callback) => callback(result));
  }

  /**
   * Detect barcode type based on format
   */
  private detectBarcodeType(code: string): BarcodeResult['type'] {
    // QR code (45+ characters, starts with specific patterns)
    if (code.length > 45) return 'qr';

    // EAN-13 (13 digits)
    if (/^\d{13}$/.test(code)) return 'ean';

    // UPC-A (12 digits)
    if (/^\d{12}$/.test(code)) return 'upca';

    // Code128 (mixed alphanumeric)
    if (/^[A-Z0-9\-\.]{8,}$/i.test(code)) return 'code128';

    return 'unknown';
  }
}

// Export singleton instance
export const barcodeScanner = new BarcodeScanner();

/**
 * Hook for React components to use barcode scanner
 */
export function useBarcodeScanner(
  onScan: (result: BarcodeResult) => void,
  enabled: boolean = true
) {
  React.useEffect(() => {
    if (!enabled) return;

    barcodeScanner.startListening();
    const unsubscribe = barcodeScanner.onScan(onScan);

    return () => {
      unsubscribe();
      barcodeScanner.stopListening();
    };
  }, [onScan, enabled]);
}

// Import React for the hook
import React from 'react';
