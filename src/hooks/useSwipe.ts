import { useRef, useState, useCallback, useEffect } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | null;

interface SwipeDelta {
  x: number;
  y: number;
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onTap?: () => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Hook for smooth swipe gestures using CSS transforms.
 * Uses refs for tracking delta during swipe to avoid React re-render jitter,
 * and only commits state for the direction indicator display.
 */
export function useSwipe<T extends HTMLElement = HTMLDivElement>({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onTap,
  threshold = 60,
  enabled = true,
}: UseSwipeOptions) {
  const ref = useRef<T>(null);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);

  // Track swipe state in refs to avoid re-render jitter
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const currentDelta = useRef<SwipeDelta>({ x: 0, y: 0 });
  const isSwiping = useRef(false);
  const hasMoved = useRef(false);
  const animFrameId = useRef<number>(0);

  const applyTransform = useCallback((dx: number, dy: number) => {
    const el = ref.current?.querySelector('[data-swipe-card]') as HTMLElement | null;
    if (!el) return;
    const clampedDy = Math.min(dy, 0);
    const rotation = dx * 0.05;
    const opacity = Math.max(0.5, 1 - Math.abs(dx) / 400 - Math.abs(clampedDy) / 400);
    el.style.transform = `translate(${dx}px, ${clampedDy}px) rotate(${rotation}deg)`;
    el.style.opacity = String(opacity);
    el.style.transition = 'none';
  }, []);

  const resetTransform = useCallback((animate: boolean) => {
    const el = ref.current?.querySelector('[data-swipe-card]') as HTMLElement | null;
    if (!el) return;
    if (animate) {
      el.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    } else {
      el.style.transition = 'none';
    }
    el.style.transform = 'translate(0, 0) rotate(0deg)';
    el.style.opacity = '1';
  }, []);

  const flyOut = useCallback((direction: SwipeDirection): Promise<void> => {
    return new Promise((resolve) => {
      const el = ref.current?.querySelector('[data-swipe-card]') as HTMLElement | null;
      if (!el) { resolve(); return; }
      el.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease-in';
      if (direction === 'left') {
        el.style.transform = 'translate(-120vw, 0) rotate(-20deg)';
      } else if (direction === 'right') {
        el.style.transform = 'translate(120vw, 0) rotate(20deg)';
      } else if (direction === 'up') {
        el.style.transform = 'translate(0, -120vh) rotate(0deg)';
      }
      el.style.opacity = '0';
      setTimeout(resolve, 300);
    });
  }, []);

  const computeDirection = useCallback((dx: number, dy: number): SwipeDirection => {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDy > absDx && dy < -threshold) return 'up';
    if (absDx > absDy && dx < -threshold) return 'left';
    if (absDx > absDy && dx > threshold) return 'right';
    return null;
  }, [threshold]);

  const handleStart = useCallback((x: number, y: number) => {
    if (!enabled) return;
    startPos.current = { x, y };
    currentDelta.current = { x: 0, y: 0 };
    isSwiping.current = true;
    hasMoved.current = false;
    setSwipeDirection(null);
  }, [enabled]);

  const handleMove = useCallback((x: number, y: number) => {
    if (!startPos.current || !isSwiping.current) return;
    const dx = x - startPos.current.x;
    const dy = y - startPos.current.y;
    currentDelta.current = { x: dx, y: dy };

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved.current = true;
    }

    cancelAnimationFrame(animFrameId.current);
    animFrameId.current = requestAnimationFrame(() => {
      applyTransform(dx, dy);
      setSwipeDirection(computeDirection(dx, dy));
    });
  }, [applyTransform, computeDirection]);

  const handleEnd = useCallback(async () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    cancelAnimationFrame(animFrameId.current);

    const dir = computeDirection(currentDelta.current.x, currentDelta.current.y);

    if (!hasMoved.current && onTap) {
      resetTransform(false);
      setSwipeDirection(null);
      startPos.current = null;
      onTap();
      return;
    }

    if (dir) {
      await flyOut(dir);
      setSwipeDirection(null);
      startPos.current = null;
      if (dir === 'left') onSwipeLeft?.();
      else if (dir === 'right') onSwipeRight?.();
      else if (dir === 'up') onSwipeUp?.();
    } else {
      // Snap back
      resetTransform(true);
      setSwipeDirection(null);
      startPos.current = null;
    }
  }, [computeDirection, flyOut, resetTransform, onSwipeLeft, onSwipeRight, onSwipeUp, onTap]);

  const handleCancel = useCallback(() => {
    isSwiping.current = false;
    cancelAnimationFrame(animFrameId.current);
    resetTransform(true);
    setSwipeDirection(null);
    startPos.current = null;
  }, [resetTransform]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    handleStart(t.clientX, t.clientY);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    handleMove(t.clientX, t.clientY);
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => handleEnd(), [handleEnd]);
  const handleTouchCancel = useCallback(() => handleCancel(), [handleCancel]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();

    if (enabled) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [enabled, handleMove, handleEnd]);

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    onMouseDown: handleMouseDown,
  };

  return { ref, swipeDirection, resetTransform, handlers };
}

export default useSwipe;
