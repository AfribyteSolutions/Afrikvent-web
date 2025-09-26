// src/components/QRCodeComponent.tsx - Alternative using qrcode.react
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  style?: React.CSSProperties;
}

export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 128,
  level = 'M',
  style
}) => {
  return (
    <div 
      style={{ 
        display: 'inline-block',
        padding: '8px',
        backgroundColor: '#fff',
        borderRadius: '4px',
        border: '1px solid #ddd',
        ...style 
      }}
    >
      <QRCodeSVG
        value={value}
        size={size - 16} // Account for padding
        level={level}
        bgColor="#ffffff"
        fgColor="#000000"
        includeMargin={true}
      />
    </div>
  );
};