const PATHS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm9 16-4.35-4.35',
  chat: 'M4 5h16v11H8l-4 4z M8 9h8 M8 12h5',
  check: 'M5 12.5 10 17 19 7',
  x: 'M6 6l12 12M18 6 6 18',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  alert: 'M12 3 2 20h20zM12 10v4M12 17v.5',
  clipboard: 'M9 4h6v3H9zM7 5H5v16h14V5h-2M8 12l2.5 2.5L16 9',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z',
  send: 'M4 12 20 4l-6 16-3-7z',
  plus: 'M12 5v14M5 12h14',
  shield: 'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
};

export default function Icon({ name, size = 18, className = '', title }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
}
