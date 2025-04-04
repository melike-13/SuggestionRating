import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'default' | 'white' | 'black';
}

export const LavLogo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 40,
  variant = 'default'
}) => {
  // Logo renklerini varyantlara göre ayarla
  let colors = {
    text: '#000000',
    accent: '#ff0099'
  };
  
  if (variant === 'white') {
    colors = {
      text: '#FFFFFF',
      accent: '#FFFFFF'
    };
  } else if (variant === 'black') {
    colors = {
      text: '#000000',
      accent: '#000000'
    };
  }
  
  return (
    <svg 
      width={size} 
      height={size * 0.4} 
      viewBox="0 0 500 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* L harfi */}
      <path 
        d="M10 10H60V160H150V190H10V10Z" 
        fill={colors.text} 
      />
      
      {/* A harfi - sadece bir tane ve üstü pembe/fuşya */}
      <path 
        d="M230 190L280 30L330 190" 
        stroke={colors.text} 
        strokeWidth="40" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* A harfinin üst çizgisi - pembe/fuşya accent */}
      <path 
        d="M270 60L290 10" 
        stroke={colors.accent} 
        strokeWidth="40" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* A harfinin yatay çizgisi */}
      <path 
        d="M250 120H310" 
        stroke={colors.text} 
        strokeWidth="15" 
        strokeLinecap="round" 
      />
      
      {/* V harfi */}
      <path 
        d="M390 10L440 190L490 10" 
        stroke={colors.text} 
        strokeWidth="40" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

export default LavLogo;