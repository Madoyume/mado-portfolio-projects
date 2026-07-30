"use client";

import Link from "next/link";
import { useState } from "react";

type ArchiveMonth = { month: string; count: number };

export function BlogArchive({
  months,
  active,
}: {
  months: ArchiveMonth[];
  active?: string;
}) {
  const years: [string, ArchiveMonth[]][] = [];
  for (const m of months) {
    const year = m.month.slice(0, 4);
    const last = years.at(-1);
    if (last && last[0] === year) last[1].push(m);
    else years.push([year, [m]]);
  }

  const [openYears, setOpenYears] = useState<string[]>(() =>
    active ? [active.slice(0, 4)] : [],
  );

  if (months.length === 0) return null;

  function toggle(year: string) {
    setOpenYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year],
    );
  }

  return (
    <nav className="archive" aria-label="月別アーカイブ">
      <p className="archive__title">月別アーカイブ</p>
      <ul className="archive__years">
        {years.map(([year, items]) => {
          const open = openYears.includes(year);
          return (
            <li key={year}>
              <button
                type="button"
                className="archive__year"
                aria-expanded={open}
                onClick={() => toggle(year)}
              >
                <span
                  className={`archive__chevron${open ? " is-open" : ""}`}
                  aria-hidden="true"
                >
                  ▸
                </span>
                {year} ({items.reduce((sum, m) => sum + m.count, 0)})
              </button>
              <div className={`archive__panel${open ? " is-open" : ""}`}>
                <ul className="archive__months">
                  {items.map((m) => (
                    <li key={m.month}>
                      <Link
                        href={
                          m.month === active
                            ? "/blog"
                            : `/blog?month=${m.month}`
                        }
                        className="archive__month"
                        aria-current={m.month === active ? "true" : undefined}
                      >
                        {m.month} ({m.count})
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
