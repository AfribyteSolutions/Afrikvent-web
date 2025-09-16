// src/components/QRCodeComponent.tsx
import React from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  style?: React.CSSProperties;
}

// Simple QR code placeholder component (you'll need to install qrcode.js or similar)
export const QRCode: React.FC<QRCodeProps> = ({ 
  value, 
  size = 128, 
  level = 'M',
  style 
}) => {
  return (
    <div 
      style={{
        width: size,
        height: size,
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        textAlign: 'center',
        padding: '8px',
        ...style
      }}
    >
      QR: {value.substring(0, 8)}...
    </div>
  );
};