"use client";

import { useEffect, useState } from "react";

type HeroImage = { id: string; url: string | null };

export function HeroCarousel({
  images,
  name,
  headline,
}: {
  images: HeroImage[];
  name: string;
  headline: string;
}) {
  const [active, setActive] = useState(0);
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
      setActive((index) => (index + 1) % count);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [count, reduceMotion]);

  return (
    <section className="hero">
      {images.map((image, index) => (
        <img
          className={`hero__img${index === active ? " is-active" : ""}`}
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
