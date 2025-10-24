import React, { useRef, useLayoutEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  position: { x: number; y: number };
}

export const Tooltip: React.FC<TooltipProps> = ({ content, position }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    opacity: 0, // Initially hidden to prevent flickering
    transition: 'opacity 0.2s ease-in-out',
  });

  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const { width, height } = tooltipRef.current.getBoundingClientRect();
      const { innerWidth, innerHeight } = window;
      const offset = 15;

      let top = position.y + offset;
      let left = position.x + offset;

      if (left + width > innerWidth) {
        left = position.x - width - offset;
      }
      if (top + height > innerHeight) {
        top = position.y - height - offset;
      }
      if (left < 0) {
        left = offset;
      }
      if (top < 0) {
        top = offset;
      }

      setStyle(prev => ({
        ...prev,
        transform: `translate(${left}px, ${top}px)`,
        opacity: 1,
      }));
    }
  }, [content, position]);

  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      className="max-w-xs p-3 bg-gray-900/90 dark:bg-black/80 text-white text-sm rounded-lg shadow-xl z-50 pointer-events-none backdrop-blur-sm"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        ...style,
      }}
    >
      {content}
    </div>,
    document.body
  );
};

export const TooltipContent: React.FC<{ element: { emoji: string; text: string; description: string } }> = ({ element }) => (
    <div>
        <h3 className="font-bold text-lg flex items-center mb-1 text-gray-100">
            <span className="text-2xl mr-2">{element.emoji}</span>
            {element.text}
        </h3>
        <p className="text-gray-300">{element.description}</p>
    </div>
);