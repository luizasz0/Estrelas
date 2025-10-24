import React, { useState, useRef, MouseEvent as ReactMouseEvent, Dispatch, SetStateAction } from 'react';
import type { CanvasElement, Position } from '../types';
import { elementDescriptions } from '../data/descriptions';
import { TooltipContent } from './Tooltip';

interface DraggableElementProps {
  element: CanvasElement;
  elementsOnCanvas: Map<string, CanvasElement>;
  updateMultiplePositions: (newPositions: Map<string, Position>) => void;
  combineElements: (el1: CanvasElement, el2: CanvasElement) => void;
  removeElement: (id: string) => void;
  view: { x: number; y: number; zoom: number };
  setIsSidebarTrashActive: (isActive: boolean) => void;
  highlightedElementId: string | null;
  setHighlightedElementId: (id: string | null) => void;
  onDragEnd: () => void;
  selectedElementIds: Set<string>;
  setSelectedElementIds: Dispatch<SetStateAction<Set<string>>>;
  duplicateElement: (id: string) => void;
  showTooltip: (content: React.ReactNode, position: Position) => void;
  hideTooltip: () => void;
}

const getOverlapArea = (rect1: DOMRect, rect2: DOMRect): number => {
    const overlapX = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
    const overlapY = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
    return overlapX * overlapY;
};

export const DraggableElement: React.FC<DraggableElementProps> = ({ 
    element, 
    elementsOnCanvas, 
    updateMultiplePositions, 
    combineElements, 
    removeElement, 
    view,
    setIsSidebarTrashActive,
    highlightedElementId,
    setHighlightedElementId,
    onDragEnd,
    selectedElementIds,
    setSelectedElementIds,
    duplicateElement,
    showTooltip,
    hideTooltip
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const highlightedTargetIdRef = useRef<string | null>(null);
  const initialDragPositions = useRef<Map<string, Position>>(new Map());
  const isSelected = selectedElementIds.has(element.id);

  const onMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.button !== 0) return; // Only allow left-click for dragging/selecting
    
    hideTooltip();
    const dragStartMousePos = { x: e.clientX, y: e.clientY };
    let dragStarted = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const dx = moveEvent.clientX - dragStartMousePos.x;
      const dy = moveEvent.clientY - dragStartMousePos.y;

      if (!dragStarted && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        dragStarted = true;
        setIsDragging(true);

        const currentSelection = new Set(selectedElementIds);
        let selectionForThisDrag = currentSelection;

        if (!currentSelection.has(element.id)) {
            selectionForThisDrag = new Set([element.id]);
            setSelectedElementIds(selectionForThisDrag);
        }

        const positions = new Map<string, Position>();
        elementsOnCanvas.forEach(el => {
            if (selectionForThisDrag.has(el.id)) {
                positions.set(el.id, el.position);
            }
        });
        initialDragPositions.current = positions;
      }
      
      if (dragStarted) {
        const sidebarEl = document.getElementById('sidebar');
        if (sidebarEl) {
            const sidebarRect = sidebarEl.getBoundingClientRect();
            const isOverSidebar = moveEvent.clientX >= sidebarRect.left;
            setIsSidebarTrashActive(isOverSidebar);

            if (isOverSidebar) {
                highlightedTargetIdRef.current = null;
                setHighlightedElementId(null);
            }
        }
        
        // --- Multi-drag logic ---
        const deltaX = moveEvent.clientX - dragStartMousePos.x;
        const deltaY = moveEvent.clientY - dragStartMousePos.y;
        
        const newPositions = new Map<string, Position>();
        initialDragPositions.current.forEach((startPos, id) => {
            newPositions.set(id, {
                x: startPos.x + deltaX / view.zoom,
                y: startPos.y + deltaY / view.zoom,
            });
        });
        updateMultiplePositions(newPositions);

        // --- Combination logic ---
        if (!elementRef.current) return;
        const currentRect = elementRef.current.getBoundingClientRect();
        let bestTargetId: string | null = null;
        let maxOverlap = 0;

        document.querySelectorAll('.draggable-element').forEach(otherEl => {
            const otherId = otherEl.getAttribute('data-id');
            if (otherId === element.id || !otherId) return;
            
            const otherRect = otherEl.getBoundingClientRect();
            const overlap = getOverlapArea(currentRect, otherRect);

            if (overlap > 2500 && overlap > maxOverlap) {
                maxOverlap = overlap;
                bestTargetId = otherId;
            }
        });
      
        highlightedTargetIdRef.current = bestTargetId;
        setHighlightedElementId(bestTargetId);
      }
    };

    const onMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (dragStarted) {
            setIsDragging(false);
            onDragEnd();
        } else { // It's a click, handle selection
            if (upEvent.shiftKey) {
                setSelectedElementIds(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(element.id)) {
                        newSet.delete(element.id);
                    } else {
                        newSet.add(element.id);
                    }
                    return newSet;
                });
            } else {
                setSelectedElementIds(new Set([element.id]));
            }
        }

        // Finalize drag actions (trash or combine)
        const sidebarEl = document.getElementById('sidebar');
        if (sidebarEl) {
            const sidebarRect = sidebarEl.getBoundingClientRect();
            if (upEvent.clientX >= sidebarRect.left) {
                const idsToRemove = selectedElementIds.has(element.id) ? selectedElementIds : new Set([element.id]);
                idsToRemove.forEach(id => removeElement(id));
            }
        }

        const targetId = highlightedTargetIdRef.current;
        if (targetId) {
            const targetElement = elementsOnCanvas.get(targetId);
            if (targetElement) {
                combineElements(element, targetElement);
            }
        }
        
        setIsSidebarTrashActive(false);
        setHighlightedElementId(null);
        highlightedTargetIdRef.current = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  
    const handleContextMenu = (e: ReactMouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        removeElement(element.id);
    };

    const handleDoubleClick = () => {
        duplicateElement(element.id);
    };

    const classes = [
        "draggable-element", "absolute", "flex", "items-center", "p-4", "rounded-xl", "shadow-lg", "cursor-grab", "select-none",
        "transition-all", "duration-150", "ease-out", "bg-gradient-to-br", "from-gray-50", "to-gray-200",
        "dark:from-gray-700", "dark:to-gray-800", "border-2",
        isDragging 
            ? "cursor-grabbing scale-105 z-30 shadow-2xl" 
            : "z-10 hover:z-20 hover:scale-105 hover:shadow-xl",
        element.id === highlightedElementId
            ? "ring-4 ring-green-500 ring-offset-2 dark:ring-offset-gray-900 border-transparent"
            : isSelected
            ? "border-blue-500"
            : "border-gray-300 dark:border-gray-600",
        !isDragging && !highlightedElementId && !isSelected ? "hover:border-blue-400 dark:hover:border-blue-500" : "",
        element.isFirstDiscovery ? "animate-bounceIn" : ""
    ].join(" ");

  return (
    <div
      ref={elementRef}
      className={classes}
      style={{
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
      }}
      onMouseDown={onMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      data-id={element.id}
      draggable="false"
    >
        {element.isFirstDiscovery && (
            <div className="absolute top-1/2 left-1/2 w-[250px] h-[250px] pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.neal.fun/infinite-craft/pinwheel.webp')] bg-contain animate-sparkle" />
            </div>
        )}
      <span className="text-4xl mr-4 pointer-events-none">{element.emoji}</span>
      <span className="text-xl font-bold pointer-events-none">{element.text}</span>
       {element.isFirstDiscovery && (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-bold text-yellow-600 dark:text-yellow-400 whitespace-nowrap bg-yellow-100 dark:bg-yellow-900 px-2 py-0.5 rounded-full">First Discovery</div>
        )}
    </div>
  );
};