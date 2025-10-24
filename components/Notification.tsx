import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';

interface NotificationProps {
  id: number;
  title: string;
  message: string;
  emoji: string;
  onDismiss: (id: number) => void;
}

export const Notification: React.FC<NotificationProps> = ({ id, title, message, emoji, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 7000); // Auto-dismiss after 7 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300); // Wait for animation to finish
  };

  const animationClass = isExiting ? 'animate-fadeOutLeft' : 'animate-fadeInLeft';

  return (
    <div className={`relative w-full max-w-sm p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 mb-4 ${animationClass}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 text-3xl mt-1">{emoji}</div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={handleDismiss} className="inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none">
            <span className="sr-only">Close</span>
            <Icons.Clear className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};