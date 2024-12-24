import { useState } from 'react';
import QRCode from 'qrcode';

export function useQRCode() {
  const [selectedQR, setSelectedQR] = useState<string | null>(null);

  const generateQRCode = async (id: string) => {
    try {
      const baseUrl = window.location.origin;
      // Fix: Use /checkin/ instead of /check-in/
      const checkInUrl = `${baseUrl}/checkin/${id}`;
      const qrCode = await QRCode.toDataURL(checkInUrl);
      setSelectedQR(qrCode);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const closeQRCode = () => setSelectedQR(null);

  return {
    selectedQR,
    generateQRCode,
    closeQRCode,
  };
}