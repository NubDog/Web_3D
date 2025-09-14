import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}

const useIntersectionObserver = (options: UseIntersectionObserverOptions = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const {
    threshold = 0.1, // Kích hoạt khi 10% element hiện ra
    triggerOnce = true, // Chỉ kích hoạt 1 lần
    rootMargin = '0px'
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          // Nếu triggerOnce = true, ngắt kết nối observer sau lần đầu
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          // Nếu triggerOnce = false, cho phép ẩn/hiện lại
          setIsVisible(false);
        }
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
  }, [threshold, triggerOnce, rootMargin]);

  return [elementRef, isVisible] as const;
};

export default useIntersectionObserver;
