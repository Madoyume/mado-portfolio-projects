"use client";

import { useEffect, useState } from "react";

type HeroImage = { id: string; url: string | null };
const heroMotions = [
  "zoom-in",
  "zoom-out",
  "pan-left",
  "pan-right",
  "pan-up",
  "pan-down",
] as const;
type HeroMotion = (typeof heroMotions)[number];

function nextHeroMotion(current: HeroMotion): HeroMotion {
  const candidates = heroMotions.filter((motion) => motion !== current);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function HeroCarousel({
  images,
  name,
  headline,
}: {
  images: HeroImage[];
  name: string;
  headline: string;
}) {
  const [slide, setSlide] = useState<{ index: number; motion: HeroMotion }>({
    index: 0,
    motion: "zoom-in",
  });
  const [reduceMotion, setReduceMotion] = useState(false);
  const count = images.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (count < 2 || reduceMotion) return;
    const timer = window.setInterval(() => {
      setSlide((current) => ({
        index: (current.index + 1) % count,
        motion: nextHeroMotion(current.motion),
      }));
    }, 10000);
    return () => window.clearInterval(timer);
  }, [count, reduceMotion]);

  return (
    <section className="hero">
      {images.map((image, index) => (
        <img
          className={`hero__img${
            index === slide.index ? ` is-active hero__img--${slide.motion}` : ""
          }`}
          src={image.url ?? ""}
          alt=""
          key={image.id}
        />
      ))}
      <div className="hero__inner fade">
        <div className="hero__caption">
          <h1 className="hero__name">{name}</h1>
          <p className="hero__role">{headline}</p>
        </div>
      </div>
    </section>
  );
}
