import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface ControlsProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  resetCanvas: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ isDarkMode, toggleDarkMode, resetCanvas, undo, redo, canUndo, canRedo }) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  useEffect(() => {
    if (!isConfirmingClear) return;
    const timer = setTimeout(() => setIsConfirmingClear(false), 3000);
    return () => clearTimeout(timer);
  }, [isConfirmingClear]);

  const handleClearClick = () => {
    if (isConfirmingClear) {
      resetCanvas();
      setIsConfirmingClear(false);
    } else {
      setIsConfirmingClear(true);
    }
  };
  
  const clearButtonClasses = `p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg transition-all duration-200 ${
    isConfirmingClear
      ? 'text-white bg-red-500 hover:bg-red-600 scale-110'
      : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50'
  }`;

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-3 z-30">
      <button 
        onClick={toggleDarkMode}
        className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
      </button>
      <button 
        onClick={undo}
        disabled={!canUndo}
        className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Undo"
      >
        <Icons.Undo />
      </button>
      <button 
        onClick={redo}
        disabled={!canRedo}
        className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Redo"
      >
        <Icons.Redo />
      </button>
      <button 
        onClick={handleClearClick}
        onMouseLeave={() => { if (isConfirmingClear) setIsConfirmingClear(false); }}
        className={clearButtonClasses}
        aria-label={isConfirmingClear ? 'Confirm Clear Canvas' : 'Clear Canvas'}
      >
        {isConfirmingClear ? <Icons.Check /> : <Icons.Clear />}
      </button>
    </div>
  );
};
