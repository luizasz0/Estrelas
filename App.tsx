
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from './components/Canvas';
import { Sidebar } from './components/Sidebar';
import { Controls } from './components/Controls';
import { Tooltip } from './components/Tooltip';
import { Notification } from './components/Notification';
import type { ElementData, CanvasElement, Position, SortType, SortDirection, ExplosionData, NotificationData } from './types';
import { INITIAL_ELEMENTS } from './constants';
import { recipes } from './recipes';
import { recipeDescriptions } from './data/descriptions';
import { useLocalStorage } from './hooks/useLocalStorage';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useLocalStorage('infinite-craft-dark-mode', false);
  const [elementsOnCanvas, setElementsOnCanvas] = useLocalStorage<Map<string, CanvasElement>>('infinite-craft-canvas-elements', new Map());
  const [discoveredElements, setDiscoveredElements] = useLocalStorage<Map<string, ElementData>>('infinite-craft-discovered', new Map(INITIAL_ELEMENTS.map(el => [el.text, el])));
  
  const [sortType, setSortType] = useState<SortType>('time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const [isSidebarTrashActive, setIsSidebarTrashActive] = useState(false);
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
  const [selectedElementIds, setSelectedElementIds] = useState<Set<string>>(new Set());

  const [history, setHistory] = useState<Map<string, CanvasElement>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyInitialized = useRef(false);

  const [explosions, setExplosions] = useState<ExplosionData[]>([]);
  const nextExplosionId = useRef(0);

  const [tooltip, setTooltip] = useState<{ content: React.ReactNode; position: Position } | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const nextNotificationId = useRef(0);

  const nextId = useRef(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    const maxId = Math.max(0, ...Array.from(elementsOnCanvas.values()).map((el: CanvasElement) => parseInt(el.id.split('-')[1], 10)));
    nextId.current = maxId + 1;
    
    if (!historyInitialized.current) {
        setHistory([elementsOnCanvas]);
        setHistoryIndex(0);
        historyInitialized.current = true;
    }

  }, [elementsOnCanvas]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const updateCanvas = useCallback((updater: (prev: Map<string, CanvasElement>) => Map<string, CanvasElement>) => {
    setElementsOnCanvas(prev => {
        const newElements = updater(prev);
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, newElements]);
        setHistoryIndex(newHistory.length);
        return newElements;
    });
  }, [history, historyIndex, setElementsOnCanvas]);


  const undo = useCallback(() => {
    if (canUndo) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setElementsOnCanvas(history[newIndex]);
    }
  }, [canUndo, history, historyIndex, setElementsOnCanvas]);

  const redo = useCallback(() => {
    if (canRedo) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setElementsOnCanvas(history[newIndex]);
    }
  }, [canRedo, history, historyIndex, setElementsOnCanvas]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if (e.key === 'y') {
                e.preventDefault();
                redo();
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const getNewId = () => {
    const id = `el-${nextId.current}`;
    nextId.current += 1;
    return id;
  };

  const addElementToCanvas = useCallback((element: ElementData, position?: Position) => {
    setSelectedElementIds(new Set());
    const newId = getNewId();
    const pos = position || { x: window.innerWidth / 3, y: window.innerHeight / 3 };
    updateCanvas(prev => new Map(prev).set(newId, { id: newId, ...element, position: pos, isFirstDiscovery: false }));
  }, [updateCanvas]);

  const duplicateElement = useCallback((elementId: string) => {
    const elementToDup = elementsOnCanvas.get(elementId);
    if (elementToDup) {
        const { text, emoji, discoveredAt } = elementToDup;
        const newPosition = { x: elementToDup.position.x + 20, y: elementToDup.position.y + 20 };
        addElementToCanvas({ text, emoji, discoveredAt }, newPosition);
    }
  }, [elementsOnCanvas, addElementToCanvas]);

  const updateMultiplePositions = useCallback((newPositions: Map<string, Position>) => {
    setElementsOnCanvas(prev => {
      const newMap = new Map(prev);
      newPositions.forEach((pos, id) => {
          const el = newMap.get(id);
          if (el) {
              newMap.set(id, { ...el, position: pos });
          }
      });
      return newMap;
    });
  }, [setElementsOnCanvas]);

  const savePositionToHistory = useCallback(() => {
    const currentHistoryState = history[historyIndex];
    if (currentHistoryState !== elementsOnCanvas) {
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, elementsOnCanvas]);
        setHistoryIndex(newHistory.length);
    }
  }, [elementsOnCanvas, history, historyIndex]);
  
  const removeElementFromCanvas = useCallback((id: string) => {
    updateCanvas(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
    });
  }, [updateCanvas]);

  const removeExplosion = useCallback((id: number) => {
    setExplosions(prev => prev.filter(exp => exp.id !== id));
  }, []);

  const showTooltip = useCallback((content: React.ReactNode, position: Position) => {
    setTooltip({ content, position });
  }, []);

  const hideTooltip = useCallback(() => {
      setTooltip(null);
  }, []);

  const addNotification = useCallback((data: Omit<NotificationData, 'id'>) => {
      const id = nextNotificationId.current++;
      setNotifications(prev => [...prev, { id, ...data }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const combineElements = useCallback((el1: CanvasElement, el2: CanvasElement) => {
    const sortedNames = [el1.text, el2.text].sort();
    const recipeKey = sortedNames.join('+');
    
    const result = recipes[recipeKey];

    if (!result) {
      // No recipe found, do nothing.
      return;
    }

    const recipeDescription = recipeDescriptions[recipeKey];

    if ('isExplosion' in result && result.isExplosion) {
      const newPosition = { 
          x: (el1.position.x + el2.position.x) / 2, 
          y: (el1.position.y + el2.position.y) / 2 
      };
      const explosionId = nextExplosionId.current++;
      setExplosions(prev => [...prev, { id: explosionId, position: newPosition }]);
      
      if (recipeDescription) {
        addNotification({
            title: `${el1.text} + ${el2.text} = 💥`,
            message: recipeDescription,
            emoji: '💥'
        });
      }

      updateCanvas(prev => {
        const newMap = new Map(prev);
        newMap.delete(el1.id);
        newMap.delete(el2.id);
        return newMap;
      });
    } else {
      const resultTemplate = result as ElementData;
      let finalElement: ElementData;
      let isFirst = false;

      if (!discoveredElements.has(resultTemplate.text)) {
        finalElement = { ...resultTemplate, discoveredAt: Date.now() };
        setDiscoveredElements(prev => new Map(prev).set(finalElement.text, finalElement));
        isFirst = true;
      } else {
        const existingElement = discoveredElements.get(resultTemplate.text)!;
        finalElement = { ...resultTemplate, discoveredAt: existingElement.discoveredAt };
      }
      
      if (isFirst && recipeDescription) {
        addNotification({
            title: `New Discovery: ${finalElement.text}`,
            message: recipeDescription,
            emoji: finalElement.emoji
        });
      }

      updateCanvas(prev => {
        const newMap = new Map(prev);
        newMap.delete(el1.id);
        newMap.delete(el2.id);
        
        const newId = getNewId();
        const newPosition = { 
            x: (el1.position.x + el2.position.x) / 2, 
            y: (el1.position.y + el2.position.y) / 2 
        };
        newMap.set(newId, {
            id: newId, 
            ...finalElement,
            position: newPosition,
            isFirstDiscovery: isFirst,
        });
        return newMap;
      });
    }
  }, [discoveredElements, setDiscoveredElements, updateCanvas, addNotification]);
  
  const resetCanvas = useCallback(() => {
    updateCanvas(() => new Map());
  }, [updateCanvas]);

  const resetAll = useCallback(() => {
      updateCanvas(() => new Map());
      setDiscoveredElements(new Map(INITIAL_ELEMENTS.map(el => [el.text, el])));
  }, [updateCanvas, setDiscoveredElements]);

  return (
    <div className={'w-full h-full overflow-hidden font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300'}>
      <Canvas
        elements={elementsOnCanvas}
        updateMultiplePositions={updateMultiplePositions}
        combineElements={combineElements}
        removeElementFromCanvas={removeElementFromCanvas}
        addElementToCanvas={addElementToCanvas}
        setIsSidebarTrashActive={setIsSidebarTrashActive}
        highlightedElementId={highlightedElementId}
        setHighlightedElementId={setHighlightedElementId}
        savePositionToHistory={savePositionToHistory}
        selectedElementIds={selectedElementIds}
        setSelectedElementIds={setSelectedElementIds}
        duplicateElement={duplicateElement}
        explosions={explosions}
        removeExplosion={removeExplosion}
        showTooltip={showTooltip}
        hideTooltip={hideTooltip}
      />
      <Sidebar
        discoveredElements={discoveredElements}
        addElementToCanvas={addElementToCanvas}
        sortType={sortType}
        setSortType={setSortType}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        resetAll={resetAll}
        isSidebarTrashActive={isSidebarTrashActive}
        showTooltip={showTooltip}
        hideTooltip={hideTooltip}
      />
      <Controls 
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(p => !p)}
        resetCanvas={resetCanvas}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      {tooltip && <Tooltip content={tooltip.content} position={tooltip.position} />}
      <div className="absolute top-4 left-4 z-50 w-80">
        {notifications.map(n => (
          <Notification key={n.id} {...n} onDismiss={removeNotification} />
        ))}
      </div>
    </div>
  );
}

export default App;