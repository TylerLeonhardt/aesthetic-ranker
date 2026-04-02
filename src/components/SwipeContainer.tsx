import type { ReactNode } from 'react';
import { useSwipe } from '../hooks/useSwipe';

interface SwipeContainerProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  children: ReactNode;
}

export default function SwipeContainer({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  children,
}: SwipeContainerProps) {
  const { ref, swipeDirection, swipeDelta, handlers } = useSwipe<HTMLDivElement>({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
  });

  const rotation = swipeDelta.x * 0.05;
  const opacity = Math.max(
    0.5,
    1 - Math.abs(swipeDelta.x) / 400 - Math.abs(Math.min(swipeDelta.y, 0)) / 400,
  );

  return (
    <div ref={ref} className="relative" {...handlers}>
      <div
        className="transition-transform duration-75"
        style={{
          transform: `translate(${swipeDelta.x}px, ${Math.min(swipeDelta.y, 0)}px) rotate(${rotation}deg)`,
          opacity,
        }}
      >
        {children}
      </div>

      {/* Swipe hint overlays */}
      {swipeDirection === 'right' && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <span className="rounded-lg bg-green-500/80 px-3 py-1.5 text-sm font-semibold text-white">
            ← Left wins
          </span>
        </div>
      )}
      {swipeDirection === 'left' && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <span className="rounded-lg bg-green-500/80 px-3 py-1.5 text-sm font-semibold text-white">
            Right wins →
          </span>
        </div>
      )}
      {swipeDirection === 'up' && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-4">
          <span className="rounded-lg bg-amber-500/80 px-3 py-1.5 text-sm font-semibold text-white">
            ↑ Skip
          </span>
        </div>
      )}
    </div>
  );
}
