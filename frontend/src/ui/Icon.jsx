// ไอคอนเส้นบางชุดเดียวทั้งแอป (แทนอีโมจิ ซึ่งหน้าตาต่างกันไปตามเครื่อง)
// ใช้: <Icon name="plus" className="size-4" />  สีตาม currentColor
const PATHS = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  bag: 'M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 016 0v2',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6M9 16h3',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  chart: 'M4 20h16M7 16V10M12 16V5M17 16v-4',
  print: 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z',
  note: 'M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  bell: 'M6 16V11a6 6 0 0112 0v5l1.5 2h-15L6 16zM10 21h4',
  bellOff: 'M6 16V11a6 6 0 0110-4.5M18 11v5l1.5 2H8M10 21h4M4 4l16 16',
  sun: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
  monitor: 'M3 5h18v11H3zM9 20h6M12 16v4',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  alert: 'M12 3l10 18H2L12 3zM12 10v5M12 18h.01',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  table: 'M4 9h16M6 9v10M18 9v10M8 5h8l2 4H6l2-4z',
  takeaway: 'M5 8h14l-1.5 12h-11L5 8zM8 8l1-4h6l1 4'
};

export default function Icon({ name, className = 'size-5', strokeWidth = 1.75, title }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name]} />
    </svg>
  );
}
