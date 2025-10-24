import React, { useMemo, useCallback } from 'react';
import type { ElementData, SortType, SortDirection, Position } from '../types';
import { Icons } from './Icons';
import { TooltipContent } from './Tooltip';
import { elementDescriptions } from '../data/descriptions';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SidebarProps {
  discoveredElements: Map<string, ElementData>;
  addElementToCanvas: (element: ElementData) => void;
  sortType: SortType;
  setSortType: (type: SortType) => void;
  sortDirection: SortDirection;
  setSortDirection: (dir: SortDirection) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  resetAll: () => void;
  isSidebarTrashActive: boolean;
  showTooltip: (content: React.ReactNode, position: Position) => void;
  hideTooltip: () => void;
}

const SidebarElement: React.FC<{ 
  element: ElementData;
  showTooltip: (content: React.ReactNode, position: Position) => void;
  hideTooltip: () => void;
}> = ({ element, showTooltip, hideTooltip }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    hideTooltip();
    e.dataTransfer.setData("application/json", JSON.stringify(element));
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const description = elementDescriptions[element.text] || "Um novo e misterioso elemento cósmico.";
    showTooltip(
        <TooltipContent element={{...element, description}} />,
        { x: e.clientX, y: e.clientY }
    );
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={hideTooltip}
      className="flex items-center bg-white dark:bg-gray-800 p-2 rounded-lg shadow cursor-grab active:cursor-grabbing transition-transform transform hover:scale-105"
    >
      <span className="text-2xl mr-2">{element.emoji}</span>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{element.text}</span>
    </div>
  );
};


export const Sidebar: React.FC<SidebarProps> = ({
  discoveredElements,
  addElementToCanvas,
  sortType,
  setSortType,
  sortDirection,
  setSortDirection,
  searchTerm,
  setSearchTerm,
  resetAll,
  isSidebarTrashActive,
  showTooltip,
  hideTooltip,
}) => {
  const [sidebarWidth, setSidebarWidth] = useLocalStorage('stellar-forge-sidebar-width', 320);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = window.innerWidth - moveEvent.clientX;
      const minWidth = 280;
      const maxWidth = 800;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.body.style.cursor = 'auto';
      document.body.style.userSelect = 'auto';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [setSidebarWidth]);

  const sortedAndFilteredElements = useMemo(() => {
    const elementsArray = Array.from(discoveredElements.values());

    // FIX: Explicitly type `el` as ElementData to fix type inference issue.
    const filtered = elementsArray.filter((el: ElementData) =>
      el.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // FIX: Explicitly type `a` and `b` as ElementData to fix type inference issue.
    const sorted = filtered.sort((a: ElementData, b: ElementData) => {
      if (sortType === 'time') {
        return (a.discoveredAt || 0) - (b.discoveredAt || 0);
      }
      if (sortType === 'name') {
        return a.text.localeCompare(b.text);
      }
      if (sortType === 'emoji') {
        return a.emoji.localeCompare(b.emoji);
      }
      return 0;
    });

    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [discoveredElements, searchTerm, sortType, sortDirection]);

  const handleSortTypeChange = (newSortType: SortType) => {
    if (newSortType === sortType) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortType(newSortType);
      setSortDirection('asc');
    }
  };

  const numColumns = useMemo(() => {
    const containerPadding = 24; // p-3 on each side
    const itemGap = 8; // gap-2
    const itemMinWidth = 130;
    const availableWidth = sidebarWidth - containerPadding;
    const columns = Math.floor((availableWidth + itemGap) / (itemMinWidth + itemGap));
    return Math.max(2, columns);
  }, [sidebarWidth]);

  return (
    <div 
      id="sidebar"
      className={`absolute top-0 right-0 h-full bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md border-l shadow-lg flex flex-col z-20
      ${isSidebarTrashActive ? 'border-red-500 bg-red-50/80 dark:bg-red-900/70' : 'border-gray-200 dark:border-gray-700'}`}
      style={{ width: `${sidebarWidth}px` }}
    >
      <div 
        onMouseDown={handleMouseDown}
        className="absolute top-0 -left-1 h-full w-2 cursor-col-resize group z-30"
      >
        <div className="w-0.5 h-full bg-transparent group-hover:bg-blue-500 transition-colors duration-200 ml-1" />
      </div>

      <div className={`flex-1 flex flex-col min-h-0 transition-opacity duration-300 ${isSidebarTrashActive ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-center mb-2">Stellar Forge</h2>
          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${discoveredElements.size} items...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-8 border rounded-md bg-gray-200 dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
              <Icons.Search />
            </div>
          </div>
          <div className="flex justify-around items-center mt-2">
              <SortButton type="time" current={sortType} direction={sortDirection} onClick={() => handleSortTypeChange('time')}><Icons.Time/></SortButton>
              <SortButton type="name" current={sortType} direction={sortDirection} onClick={() => handleSortTypeChange('name')}><Icons.Sort/></SortButton>
              <SortButton type="emoji" current={sortType} direction={sortDirection} onClick={() => handleSortTypeChange('emoji')}><Icons.Emoji/></SortButton>
              <button onClick={() => {if(confirm('Are you sure you want to reset all progress?')) resetAll()}} className="p-2 rounded-md text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50"><Icons.Trash /></button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto p-3">
          <div 
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))` }}
          >
            {sortedAndFilteredElements.map(el => (
              <SidebarElement 
                key={el.text} 
                element={el} 
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            ))}
          </div>
        </div>
      </div>
      {isSidebarTrashActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-red-500 bg-white/80 dark:bg-black/80 p-4 rounded-full">
            <Icons.Trash className="w-16 h-16" />
          </div>
        </div>
      )}
    </div>
  );
};

interface SortButtonProps {
    type: SortType;
    current: SortType;
    direction: SortDirection;
    onClick: () => void;
    children: React.ReactNode;
}

const SortButton: React.FC<SortButtonProps> = ({ type, current, direction, onClick, children }) => (
    <button onClick={onClick} className={`flex items-center p-2 rounded-md transition-colors ${current === type ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
        {children}
        {current === type && <Icons.ArrowUp className={`w-4 h-4 ml-1 transition-transform ${direction === 'desc' ? 'rotate-180' : ''}`} />}
    </button>
);