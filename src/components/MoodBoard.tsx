import { useState } from 'react';
import type { Aesthetic } from '../types';
import { getMoodBoardImages } from '../utils/results';
import AestheticDetail from './AestheticDetail';

interface MoodBoardProps {
  topThree: Aesthetic[];
}

export default function MoodBoard({ topThree }: MoodBoardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (topThree.length < 3) {
    return (
      <div className="text-center text-slate-400">
        Not enough results to display.
      </div>
    );
  }

  const hero = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  const heroImages = getMoodBoardImages(hero, 4);
  const secondImages = getMoodBoardImages(second, 2);
  const thirdImages = getMoodBoardImages(third, 2);

  return (
    <>
      <div className="w-full max-w-md animate-fade-in">
        {/* Hero: #1 Aesthetic */}
        <button
          type="button"
          onClick={() => setSelectedIndex(0)}
          className="group w-full text-left focus:outline-none"
        >
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">
              #1
            </span>
            <h2 className="text-xl font-bold text-white truncate">
              {hero.name}
            </h2>
            <span className="ml-auto text-[10px] text-slate-500 shrink-0">
              {hero.startYear} – {hero.endYear}
            </span>
          </div>

          {/* Hero image grid — asymmetric collage */}
          <div className="grid grid-cols-2 gap-1.5 overflow-hidden rounded-2xl">
            {/* Left column: tall primary image */}
            <div className="row-span-2 aspect-[3/4] overflow-hidden bg-slate-700">
              <img
                src={heroImages[0].url}
                alt={heroImages[0].title}
                loading="eager"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Right column: 2 stacked images */}
            <div className="aspect-square overflow-hidden bg-slate-700">
              {heroImages.length > 1 ? (
                <img
                  src={heroImages[1].url}
                  alt={heroImages[1].title}
                  loading="eager"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-slate-800" />
              )}
            </div>
            <div className="aspect-square overflow-hidden bg-slate-700">
              {heroImages.length > 2 ? (
                <img
                  src={heroImages[2].url}
                  alt={heroImages[2].title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-slate-800" />
              )}
            </div>
          </div>

          {/* Bottom accent image (4th image, spans full width) */}
          {heroImages.length > 3 && (
            <div className="mt-1.5 aspect-[16/5] overflow-hidden rounded-xl bg-slate-700">
              <img
                src={heroImages[3].url}
                alt={heroImages[3].title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
        </button>

        {/* Runners up: #2 and #3 side by side */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { aesthetic: second, images: secondImages, rank: 2 },
            { aesthetic: third, images: thirdImages, rank: 3 },
          ].map(({ aesthetic, images, rank }) => (
            <button
              key={aesthetic.urlSlug}
              type="button"
              onClick={() => setSelectedIndex(rank - 1)}
              className="group text-left focus:outline-none"
            >
              <div className="mb-1.5 flex items-baseline gap-1.5">
                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  #{rank}
                </span>
                <span className="text-sm font-semibold text-white truncate">
                  {aesthetic.name}
                </span>
              </div>

              {/* 2-image mini collage */}
              <div className="grid grid-rows-2 gap-1 overflow-hidden rounded-xl">
                <div className="aspect-[4/3] overflow-hidden bg-slate-700">
                  <img
                    src={images[0].url}
                    alt={images[0].title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                {images.length > 1 && (
                  <div className="aspect-[4/3] overflow-hidden bg-slate-700">
                    <img
                      src={images[1].url}
                      alt={images[1].title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
              </div>

              <p className="mt-1 text-[10px] text-slate-500">
                {aesthetic.startYear} – {aesthetic.endYear}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {selectedIndex !== null && (
        <AestheticDetail
          aesthetic={topThree[selectedIndex]}
          rank={selectedIndex + 1}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
