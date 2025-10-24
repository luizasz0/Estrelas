import React, { useRef, useState, MouseEvent as ReactMouseEvent, Dispatch, SetStateAction } from 'react';
import type { CanvasElement, Position, ElementData, ExplosionData } from '../types';
import { DraggableElement } from './DraggableElement';
import { Explosion } from './Explosion';

interface CanvasProps {
  elements: Map<string, CanvasElement>;
  updateMultiplePositions: (newPositions: Map<string, Position>) => void;
  combineElements: (el1: CanvasElement, el2: CanvasElement) => void;
  removeElementFromCanvas: (id: string) => void;
  addElementToCanvas: (element: ElementData, position: Position) => void;
  setIsSidebarTrashActive: (isActive: boolean) => void;
  highlightedElementId: string | null;
  setHighlightedElementId: (id: string | null) => void;
  savePositionToHistory: () => void;
  selectedElementIds: Set<string>;
  setSelectedElementIds: Dispatch<SetStateAction<Set<string>>>;
  duplicateElement: (id: string) => void;
  explosions: ExplosionData[];
  removeExplosion: (id: number) => void;
  showTooltip: (content: React.ReactNode, position: Position) => void;
  hideTooltip: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  elements, 
  updateMultiplePositions, 
  combineElements, 
  removeElementFromCanvas, 
  addElementToCanvas,
  setIsSidebarTrashActive,
  highlightedElementId,
  setHighlightedElementId,
  savePositionToHistory,
  selectedElementIds,
  setSelectedElementIds,
  duplicateElement,
  explosions,
  removeExplosion,
  showTooltip,
  hideTooltip,
}) => {
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ start: Position, end: Position } | null>(null);
  
  const lastMousePosition = useRef({ x: 0, y: 0 });
  const selectionStartPos = useRef<Position | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    // Panning with middle or right mouse button
    if (e.button === 1 || e.button === 2) { 
      e.preventDefault();
      setIsPanning(true);
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      document.body.style.cursor = 'grabbing';
      return;
    }

    // Handle selection box only on canvas background click
    if (e.target === canvasRef.current && e.button === 0) {
        e.preventDefault();
        setSelectedElementIds(new Set()); // Clear previous selection
        const startPos = { x: e.clientX, y: e.clientY };
        selectionStartPos.current = startPos;
        setSelectionBox({ start: startPos, end: startPos });
    }
  };

  const handleMouseUp = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (isPanning) {
        setIsPanning(false);
        document.body.style.cursor = 'default';
    }

    if (selectionStartPos.current && selectionBox) {
        const selectedIds = new Set<string>();
        document.querySelectorAll('.draggable-element').forEach(elNode => {
            const id = elNode.getAttribute('data-id');
            if (!id) return;

            const elRect = elNode.getBoundingClientRect();
            
            const selectionRectClient = {
                left: Math.min(selectionBox.start.x, selectionBox.end.x),
                top: Math.min(selectionBox.start.y, selectionBox.end.y),
                right: Math.max(selectionBox.start.x, selectionBox.end.x),
                bottom: Math.max(selectionBox.start.y, selectionBox.end.y),
            };

            const overlap = !(elRect.right < selectionRectClient.left || 
                              elRect.left > selectionRectClient.right || 
                              elRect.bottom < selectionRectClient.top || 
                              elRect.top > selectionRectClient.bottom);
            
            if (overlap) {
                selectedIds.add(id);
            }
        });
        setSelectedElementIds(selectedIds);
    }
    selectionStartPos.current = null;
    setSelectionBox(null);
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePosition.current.x;
      const dy = e.clientY - lastMousePosition.current.y;
      setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    } else if (selectionStartPos.current) {
        setSelectionBox({ start: selectionStartPos.current, end: { x: e.clientX, y: e.clientY }});
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = Math.min(Math.max(view.zoom + scaleAmount, 0.2), 3);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = view.x + (mouseX - view.x) * (1 - newZoom / view.zoom);
    const newY = view.y + (mouseY - view.y) * (1 - newZoom / view.zoom);

    setView({ x: newX, y: newY, zoom: newZoom });
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const elementJSON = e.dataTransfer.getData("application/json");
      if (elementJSON) {
          const element = JSON.parse(elementJSON) as ElementData;
          if (canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect();
              const x = (e.clientX - rect.left - view.x) / view.zoom;
              const y = (e.clientY - rect.top - view.y) / view.zoom;
              addElementToCanvas(element, { x, y });
          }
      }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
  };

  const handleContextMenu = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  };


  return (
    <div
      ref={canvasRef}
      className="h-full w-full absolute top-0 left-0 cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onContextMenu={handleContextMenu}
    >
      <div 
        className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#d1d5db_1px,transparent_1px)] dark:bg-[radial-gradient(#4b5563_1px,transparent_1px)] pointer-events-none"
        style={{
          backgroundSize: `${20 * view.zoom}px ${20 * view.zoom}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
      />
      <div
        className="absolute top-0 left-0"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
      >
        {/* FIX: Explicitly type `el` as CanvasElement to fix type inference issue. */}
        {Array.from(elements.values()).map((el: CanvasElement) => (
          <DraggableElement
            key={el.id}
            element={el}
            elementsOnCanvas={elements}
            updateMultiplePositions={updateMultiplePositions}
            combineElements={combineElements}
            removeElement={removeElementFromCanvas}
            view={view}
            setIsSidebarTrashActive={setIsSidebarTrashActive}
            highlightedElementId={highlightedElementId}
            setHighlightedElementId={setHighlightedElementId}
            onDragEnd={savePositionToHistory}
            selectedElementIds={selectedElementIds}
            setSelectedElementIds={setSelectedElementIds}
            duplicateElement={duplicateElement}
            showTooltip={showTooltip}
            hideTooltip={hideTooltip}
          />
        ))}
        {explosions.map(exp => (
          <Explosion
            key={exp.id}
            position={exp.position}
            onComplete={() => removeExplosion(exp.id)}
          />
        ))}
      </div>
      {selectionBox && (
          <div
              className="absolute border-2 border-dashed border-blue-500 bg-blue-500/20 pointer-events-none z-50"
              style={{
                  left: Math.min(selectionBox.start.x, selectionBox.end.x),
                  top: Math.min(selectionBox.start.y, selectionBox.end.y),
                  width: Math.abs(selectionBox.start.x - selectionBox.end.x),
                  height: Math.abs(selectionBox.start.y - selectionBox.end.y),
              }}
          />
      )}
    </div>
  );
};