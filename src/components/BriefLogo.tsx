import React from 'react';

interface BriefLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BriefLogo: React.FC<BriefLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <h1 
      className={`font-semibold tracking-tight text-brief-text-primary ${sizeClasses[size]} ${className}`}
    >
      Brief
    </h1>
  );
};

export default BriefLogo;
