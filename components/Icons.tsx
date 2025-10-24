import React from 'react';

const createIcon = (path: React.ReactNode) => (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {path}
  </svg>
);

export const Icons = {
  Sun: createIcon(<><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></>),
  Moon: createIcon(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>),
  Clear: createIcon(<><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></>),
  Search: createIcon(<><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></>),
  Time: createIcon(<><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>),
  Sort: createIcon(<path d="M3 6h18M3 12h18M3 18h18"></path>),
  Emoji: createIcon(<><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></>),
  Trash: createIcon(<><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></>),
  ArrowUp: createIcon(<path d="m5 12 7-7 7 7" />),
  Undo: createIcon(<><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" /></>),
  Redo: createIcon(<><path d="m15 14 5-5-5-5" /><path d="M19.5 9H9a5.5 5.5 0 0 0-5.5 5.5v0A5.5 5.5 0 0 0 9 20h2" /></>),
  Check: createIcon(<path d="M20 6 9 17l-5-5" />),
};
