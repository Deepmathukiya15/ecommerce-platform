import { useState } from 'react';

/**
 * Product image with graceful fallback: if the remote image fails to load
 * (or none was uploaded), render a branded gradient tile with the product initials.
 */
export default function ProductImage({ images, name = '', className = '' }) {
  const [failed, setFailed] = useState(false);
  const url = images?.[0]?.url;
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (!url || failed) {
    return (
      <div
        className={`flex min-h-[120px] h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-fuchsia-100 text-2xl font-extrabold tracking-widest text-indigo-700 ${className}`}
        aria-label={name}
      >
        <span>{initials || '🛍'}</span>
      </div>
    );
  }
  return <img src={url} alt={name} className={className} loading="lazy" onError={() => setFailed(true)} />;
}
