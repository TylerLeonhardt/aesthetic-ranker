import { useRef, useState, useCallback } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | null;

interface SwipeDelta {
  x: number;
  y: number;
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  threshold?: number;
}

export function useSwipe<T extends HTMLElement = HTMLDivElement>({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  threshold = 50,
}: UseSwipeOptions) {
  const ref = useRef<T>(null);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const [swipeDelta, setSwipeDelta] = useState<SwipeDelta>({ x: 0, y: 0 });

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    isSwiping.current = true;
    setSwipeDirection(null);
    setSwipeDelta({ x: 0, y: 0 });
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPos.current || !isSwiping.current) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startPos.current.x;
      const dy = touch.clientY - startPos.current.y;
      setSwipeDelta({ x: dx, y: dy });

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDy > absDx && dy < -threshold) {
        setSwipeDirection('up');
      } else if (absDx > absDy && dx < -threshold) {
        setSwipeDirection('left');
      } else if (absDx > absDy && dx > threshold) {
        setSwipeDirection('right');
      } else {
        setSwipeDirection(null);
      }
    },
    [threshold],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current) return;
    isSwiping.current = false;

    if (swipeDirection === 'left') {
      onSwipeLeft?.();
    } else if (swipeDirection === 'right') {
      onSwipeRight?.();
    } else if (swipeDirection === 'up') {
      onSwipeUp?.();
    }

    setSwipeDirection(null);
    setSwipeDelta({ x: 0, y: 0 });
    startPos.current = null;
  }, [swipeDirection, onSwipeLeft, onSwipeRight, onSwipeUp]);

  const handleTouchCancel = useCallback(() => {
    isSwiping.current = false;
    setSwipeDirection(null);
    setSwipeDelta({ x: 0, y: 0 });
    startPos.current = null;
  }, []);

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };

  return { ref, swipeDirection, swipeDelta, handlers };
}

export default useSwipe;
