import { useEffect, useRef, useState } from 'react';

interface UseVisibilityPercentageOptions {
  threshold?: number | number[];
  rootMargin?: string;
  continuous?: boolean;
}

const useVisibilityPercentage = (options: UseVisibilityPercentageOptions = {}) => {
  const [visibilityPercentage, setVisibilityPercentage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const {
    threshold = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    rootMargin = '0px',
    continuous = true
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const percentage = Math.round(entry.intersectionRatio * 100);
        setVisibilityPercentage(percentage);
        setIsVisible(entry.isIntersecting);
        
        // Log để debug
        console.log(`Element hiển thị ${percentage}% trên màn hình`);
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  return [elementRef, visibilityPercentage, isVisible] as const;
};

export default useVisibilityPercentage;
