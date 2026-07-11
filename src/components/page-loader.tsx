export function PageLoader() {
  return (
    <div
      className="page-loader"
      role="status"
      aria-label="ページを読み込んでいます"
    >
      <svg
        className="page-loader__logo"
        viewBox="0 0 256 256"
        aria-hidden="true"
      >
        <path
          className="page-loader__outline"
          d="M78 196 L78 74 L126 99 M134 99 L182 74 L182 196"
        />
        <path className="page-loader__outline" d="M78 196 L126 196" />
        <g transform="translate(0,8)">
          <rect
            className="page-loader__pane page-loader__pane--1"
            x="108"
            y="111"
            width="21"
            height="21"
            rx="1.6"
          />
          <rect
            className="page-loader__pane page-loader__pane--2"
            x="133"
            y="111"
            width="21"
            height="21"
            rx="1.6"
          />
          <rect
            className="page-loader__pane page-loader__pane--3"
            x="108"
            y="136"
            width="21"
            height="21"
            rx="1.6"
          />
          <rect
            className="page-loader__pane page-loader__pane--4"
            x="133"
            y="136"
            width="21"
            height="21"
            rx="1.6"
          />
        </g>
      </svg>
    </div>
  );
}
