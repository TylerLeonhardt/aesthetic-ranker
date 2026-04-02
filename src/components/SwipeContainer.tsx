import type { ReactNode } from 'react';
import { useSwipe } from '../hooks/useSwipe';

interface SwipeContainerProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onTap?: () => void;
  leftHint?: string;
  rightHint?: string;
  upHint?: string;
  enabled?: boolean;
  children: ReactNode;
}

export default function SwipeContainer({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onTap,
  leftHint = '←',
  rightHint = '→',
  upHint = '↑',
  enabled = true,
  children,
}: SwipeContainerProps) {
  const { ref, swipeDirection, handlers } = useSwipe<HTMLDivElement>({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onTap,
    enabled,
  });

  return (
    <div ref={ref} className="relative w-full select-none" {...handlers}>
      <div data-swipe-card className="w-full" style={{ willChange: 'transform, opacity' }}>
        {children}
      </div>

      {/* Swipe hint overlays */}
      {swipeDirection === 'right' && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <span className="rounded-lg bg-green-500/80 px-3 py-1.5 text-sm font-semibold text-white shadow-lg">
            {rightHint}
          </span>
        </div>
      )}
      {swipeDirection === 'left' && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <span className="rounded-lg bg-red-500/80 px-3 py-1.5 text-sm font-semibold text-white shadow-lg">
            {leftHint}
          </span>
        </div>
      )}
      {swipeDirection === 'up' && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-4">
          <span className="rounded-lg bg-amber-500/80 px-3 py-1.5 text-sm font-semibold text-white shadow-lg">
            {upHint}
          </span>
        </div>
      )}
    </div>
  );
}
