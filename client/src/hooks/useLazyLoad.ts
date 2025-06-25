
import { useEffect, useRef, useState } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useLazyLoad(options: UseLazyLoadOptions = {}) {
  const { threshold = 0.1, rootMargin = '50px', triggerOnce = true } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && !hasLoaded) {
          setHasLoaded(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasLoaded]);

  return { ref, isIntersecting, hasLoaded };
}

export function useLazyComponent<T>(
  componentLoader: () => Promise<{ default: T }>,
  shouldLoad: boolean = true
) {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!shouldLoad || Component) return;

    setLoading(true);
    setError(null);

    componentLoader()
      .then((module) => {
        setComponent(module.default);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error('Failed to load component'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [shouldLoad, Component, componentLoader]);

  return { Component, loading, error };
}
