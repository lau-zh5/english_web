import { assetUrl } from '../lib/api';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Logo({ size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
    '2xl': 'w-48 h-48',
  };

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center`}>
      <img
        src={assetUrl('brand/001.png')}
        alt="Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
}