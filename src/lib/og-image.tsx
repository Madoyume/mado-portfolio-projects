import { ImageResponse } from "next/og";
import {
  OG_IMAGE_COLORS,
  OG_IMAGE_LOGO_SIZE,
  OG_IMAGE_SIZE,
} from "@/lib/constants";

const PANES = [
  { x: 108, y: 119 },
  { x: 133, y: 119 },
  { x: 108, y: 144 },
  { x: 133, y: 144 },
];

export function renderOgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: OG_IMAGE_COLORS.background,
      }}
    >
      <svg
        width={OG_IMAGE_LOGO_SIZE}
        height={OG_IMAGE_LOGO_SIZE}
        viewBox="54 60 152 152"
        aria-hidden="true"
      >
        <path
          d="M78 196 L78 74 L126 99 M134 99 L182 74 L182 196 M78 196 L126 196"
          fill="none"
          stroke={OG_IMAGE_COLORS.stroke}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {PANES.map((pane, i) => (
          <rect
            key={`${pane.x}-${pane.y}`}
            x={pane.x}
            y={pane.y}
            width={21}
            height={21}
            rx={1.6}
            fill={OG_IMAGE_COLORS.panes[i]}
          />
        ))}
      </svg>
    </div>,
    OG_IMAGE_SIZE,
  );
}
