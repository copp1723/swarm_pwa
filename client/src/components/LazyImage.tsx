
import React, { useState } from 'react';
import { useLazyLoad } from '@/hooks/useLazyLoad';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  placeholder?: React.ReactNode;
}

export const LazyImage = memo(function LazyImage({ 
  src, 
  alt, 
  fallback, 
  placeholder,
  className,
  ...props 
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { ref, hasLoaded } = useLazyLoad({ threshold: 0.1 });

  const defaultPlaceholder = (
    <Skeleton className={`w-full h-full ${className}`} />
  );

  const defaultFallback = (
    <div className={`flex items-center justify-center bg-muted rounded ${className}`}>
      <span className="text-muted-foreground text-sm">Failed to load</span>
    </div>
  );

  if (error) {
    return fallback || defaultFallback;
  }

  return (
    <div ref={ref} className={className}>
      {!loaded && (placeholder || defaultPlaceholder)}
      {hasLoaded && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={loaded ? {} : { position: 'absolute', visibility: 'hidden' }}
          {...props}
        />
      )}
    </div>
  );
});
