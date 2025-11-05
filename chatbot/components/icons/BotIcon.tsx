
import React from 'react';

export const BotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 18c-2.5 1.5-5 2-8.5 1s-6.5-1.5-8.5-4 1-6.5 4-8.5 5.5-3.5 8.5-1 4.5 3.5 4.5 8.5Z" />
    <path d="M14.5 7.5L3 19" />
    <path d="M15 12c-3.5 3.5-3.5 9 0 11s8.5-1.5 11-5" />
  </svg>
);
