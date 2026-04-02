import type { Aesthetic } from '../types';

interface AestheticCardProps {
  aesthetic: Aesthetic;
  className?: string;
}

export default function AestheticCard({
  aesthetic,
  className = '',
}: AestheticCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-slate-800 aspect-[3/4] ${className}`}
    >
      <img
        src={aesthetic.displayImageUrl}
        alt={aesthetic.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Dark gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
        <h3 className="text-lg font-bold text-white leading-tight">
          {aesthetic.name}
        </h3>
        <span className="mt-1 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-slate-200 backdrop-blur-sm">
          {aesthetic.startYear} – {aesthetic.endYear}
        </span>
      </div>
    </div>
  );
}
