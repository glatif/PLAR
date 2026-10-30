import type { ReactNode, SVGProps } from "react";

// Filled icons that pair with the Lucide outline set (same 24px grid). Details are cut out with even-odd fills,
// so they work on any background. Use them for selected navigation, toggles that are on, small status glyphs and
// white glyphs on coloured tiles; everything else stays outline (see the Iconography section of the design system).

export type FilledIcon = (props: SVGProps<SVGSVGElement>) => ReactNode;

function filled(name: string, paths: ReactNode): FilledIcon {
  const Icon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      {paths}
    </svg>
  );
  Icon.displayName = name;
  return Icon;
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" } as const;

export const HomeFilled = filled(
  "HomeFilled",
  <path d="M10.9 2.9a1.75 1.75 0 0 1 2.2 0l7.26 6.02c.4.33.64.83.64 1.35v9.23A2.5 2.5 0 0 1 18.5 22H15v-6.25c0-.69-.56-1.25-1.25-1.25h-3.5c-.69 0-1.25.56-1.25 1.25V22H5.5A2.5 2.5 0 0 1 3 19.5v-9.23c0-.52.23-1.02.64-1.35z" />,
);

export const FolderFilled = filled(
  "FolderFilled",
  <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h4.38a2 2 0 0 1 1.6.8l1.05 1.4a2 2 0 0 0 1.6.8h6.37A2.5 2.5 0 0 1 22 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5z" />,
);

export const FileFilled = filled(
  "FileFilled",
  <path
    fillRule="evenodd"
    d="M6.5 2h7.09c.53 0 1.04.21 1.42.59l4.4 4.4c.38.38.59.89.59 1.42V19.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2zM8 12.25h8v1.5H8zm0 4h6v1.5H8z"
  />,
);

export const BookFilled = filled(
  "BookFilled",
  <>
    <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3H8a4 4 0 0 1 3.25 1.67V20.5A3.5 3.5 0 0 0 8.5 19h-5A1.5 1.5 0 0 1 2 17.5z" />
    <path d="M22 4.5A1.5 1.5 0 0 0 20.5 3H16a4 4 0 0 0-3.25 1.67V20.5A3.5 3.5 0 0 1 15.5 19h5a1.5 1.5 0 0 0 1.5-1.5z" />
  </>,
);

export const CalendarFilled = filled(
  "CalendarFilled",
  <>
    <path
      fillRule="evenodd"
      d="M5.5 4h13A2.5 2.5 0 0 1 21 6.5v13a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19.5v-13A2.5 2.5 0 0 1 5.5 4zM4.75 9.5v9.75c0 .41.34.75.75.75h13c.41 0 .75-.34.75-.75V9.5zM7 12h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2z"
    />
    <path d="M7.25 2h1.5v4h-1.5zm8 0h1.5v4h-1.5z" />
  </>,
);

export const ClockFilled = filled(
  "ClockFilled",
  <path fillRule="evenodd" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-.9 4.5v6.1l4.1 2.37.9-1.56-3.2-1.85V6.5z" />,
);

export const BellFilled = filled(
  "BellFilled",
  <>
    <path d="M12 2.5A6.5 6.5 0 0 0 5.5 9c0 3.6-.9 5.9-1.8 7.2-.5.7 0 1.8.9 1.8h14.8c.9 0 1.4-1.1.9-1.8-.9-1.3-1.8-3.6-1.8-7.2A6.5 6.5 0 0 0 12 2.5z" />
    <path d="M9.5 19.5h5a2.5 2.5 0 0 1-5 0z" />
  </>,
);

export const InboxFilled = filled(
  "InboxFilled",
  <path
    fillRule="evenodd"
    d="M7.24 4h9.52a2 2 0 0 1 1.79 1.11l3.25 6.49c.13.28.2.58.2.89V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.5c0-.31.07-.62.2-.89l3.25-6.5A2 2 0 0 1 7.24 4zm-.12 2.1L4.6 11.25h3.9l1.5 2.5h4l1.5-2.5h3.9L16.88 6.1a.5.5 0 0 0-.45-.35H7.57a.5.5 0 0 0-.45.35z"
  />,
);

export const ClipboardCheckFilled = filled(
  "ClipboardCheckFilled",
  <path
    fillRule="evenodd"
    d="M9.5 2h5A1.5 1.5 0 0 1 16 3.5h1.5A2.5 2.5 0 0 1 20 6v13.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 19.5V6a2.5 2.5 0 0 1 2.5-2.5H8A1.5 1.5 0 0 1 9.5 2zm1.1 14.7 5.5-5.5-1.06-1.06-4.44 4.44-1.94-1.94L7.6 13.7z"
  />,
);

export const MessageFilled = filled(
  "MessageFilled",
  <path d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4.17 3.61A.5.5 0 0 1 3 20.23V5a2 2 0 0 1 2-2z" />,
);

export const UserFilled = filled(
  "UserFilled",
  <>
    <circle cx="12" cy="7.25" r="4.75" />
    <path d="M4 20.25C4 16.8 7.58 14 12 14s8 2.8 8 6.25c0 .97-.78 1.75-1.75 1.75H5.75C4.78 22 4 21.22 4 20.25z" />
  </>,
);

export const UsersFilled = filled(
  "UsersFilled",
  <>
    <circle cx="9" cy="7.5" r="4" />
    <path d="M1.5 19.5c0-3.04 3.36-5.5 7.5-5.5s7.5 2.46 7.5 5.5c0 .83-.67 1.5-1.5 1.5H3c-.83 0-1.5-.67-1.5-1.5z" />
    <circle cx="17" cy="8" r="3" />
    <path d="M17.7 14.1c2.84.37 4.8 2.2 4.8 4.65 0 .69-.56 1.25-1.25 1.25H18.4c.06-.24.1-.49.1-.75 0-1.97-.88-3.79-2.3-5.1.48-.05.98-.06 1.5-.05z" />
  </>,
);

export const GraduationFilled = filled(
  "GraduationFilled",
  <>
    <path d="M11.17 3.68a2 2 0 0 1 1.66 0l8.57 3.9a1 1 0 0 1 0 1.83l-8.57 3.91a2 2 0 0 1-1.66 0L2.6 9.41a1 1 0 0 1 0-1.83z" />
    <path d="M6 12.2l4.55 2.07a3.5 3.5 0 0 0 2.9 0L18 12.2V16c0 1.66-2.69 3-6 3s-6-1.34-6-3z" />
    <path d="M22 8.5v6" {...stroke} />
  </>,
);

export const LandmarkFilled = filled(
  "LandmarkFilled",
  <>
    <path d="M11.4 2.16a1.3 1.3 0 0 1 1.2 0l8.3 4.3c.73.38.46 1.54-.37 1.54H3.47c-.83 0-1.1-1.16-.37-1.54z" />
    <path d="M5 9.5h2.25v8H5zm4 0h2.25v8H9zm3.75 0H15v8h-2.25zm4 0H19v8h-2.25zM3 19h18v2.5H3z" />
  </>,
);

export const VideoFilled = filled(
  "VideoFilled",
  <>
    <path d="M2 8.5A2.5 2.5 0 0 1 4.5 6h9A2.5 2.5 0 0 1 16 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 2 15.5z" />
    <path d="M17 10.2l4.2-2.8a.5.5 0 0 1 .8.42v8.36a.5.5 0 0 1-.8.42L17 13.8z" />
  </>,
);

export const ShieldCheckFilled = filled(
  "ShieldCheckFilled",
  <path
    fillRule="evenodd"
    d="M11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72zM10.6 15.2l5.99-6-1.05-1.06-4.94 4.94-2.14-2.14L7.4 12z"
  />,
);

export const LockFilled = filled(
  "LockFilled",
  <>
    <path d="M7 10V7a5 5 0 0 1 10 0v3" {...stroke} strokeWidth={2} />
    <path
      fillRule="evenodd"
      d="M5.5 10h13A2.5 2.5 0 0 1 21 12.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19.5v-7A2.5 2.5 0 0 1 5.5 10zm5.6 4.5v3.5h1.8v-3.5z"
    />
  </>,
);

export const SlidersFilled = filled(
  "SlidersFilled",
  <path d="M4 3a1 1 0 0 1 1 1v6.17a3 3 0 0 1 0 5.66V20a1 1 0 1 1-2 0v-4.17a3 3 0 0 1 0-5.66V4a1 1 0 0 1 1-1zm8 0a1 1 0 0 1 1 1v1.17a3 3 0 0 1 0 5.66V20a1 1 0 1 1-2 0v-9.17a3 3 0 0 1 0-5.66V4a1 1 0 0 1 1-1zm8 0a1 1 0 0 1 1 1v8.17a3 3 0 0 1 0 5.66V20a1 1 0 1 1-2 0v-2.17a3 3 0 0 1 0-5.66V4a1 1 0 0 1 1-1z" />,
);

export const ChartFilled = filled(
  "ChartFilled",
  <path d="M5.5 3A2.5 2.5 0 0 0 3 5.5v13A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 18.5 3zM7 12.5h2V17H7zm4-5h2V17h-2zm4 3h2V17h-2z" fillRule="evenodd" />,
);

export const CheckCircleFilled = filled(
  "CheckCircleFilled",
  <path fillRule="evenodd" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-1.5 14.1 6.6-6.6-1.2-1.2-5.4 5.4-2.4-2.4-1.2 1.2z" />,
);

export const InfoFilled = filled(
  "InfoFilled",
  <path
    fillRule="evenodd"
    d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm-.9 8.5V17h1.8v-6.5zM12 6.6a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3z"
  />,
);

export const AlertFilled = filled(
  "AlertFilled",
  <path
    fillRule="evenodd"
    d="M10.27 3.5a2 2 0 0 1 3.46 0l8 13.9A2 2 0 0 1 20 20.4H4a2 2 0 0 1-1.73-3zM11.1 8.5v6h1.8v-6zm.9 7.4a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"
  />,
);

/** The AI marker: a filled sparkle with the tangerine → pink → indigo gradient. */
export function AiSparkle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <defs>
        <linearGradient id="ai-sparkle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F5761A" />
          <stop offset=".5" stopColor="#E2477F" />
          <stop offset="1" stopColor="#5E5CE6" />
        </linearGradient>
      </defs>
      <path
        fill="url(#ai-sparkle)"
        d="M12 2.5c.5 4.6 2.9 7 7.5 7.5-4.6.5-7 2.9-7.5 7.5-.5-4.6-2.9-7-7.5-7.5 4.6-.5 7-2.9 7.5-7.5Zm7 13c.2 1.9 1.1 2.8 3 3-1.9.2-2.8 1.1-3 3-.2-1.9-1.1-2.8-3-3 1.9-.2 2.8-1.1 3-3Z"
      />
    </svg>
  );
}
