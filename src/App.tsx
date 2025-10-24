

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Canvas } from './components/Canvas';
import { Sidebar } from './components/Sidebar';
import { Controls } from './components/Controls';
import type { ElementData, CanvasElement, Position, Recipe, SortType, SortDirection } from './types';
import { INITIAL_ELEMENTS } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useLocalStorage('infinite-craft-dark-mode', false);
  const [elementsOnCanvas, setElementsOnCanvas] = useLocalStorage<Map<string, CanvasElement>>('infinite-craft-canvas-elements', new Map());
  const [discoveredElements, setDiscoveredElements] = useLocalStorage<Map<string, ElementData>>('infinite-craft-discovered', new Map(INITIAL_ELEMENTS.map(el => [el.text, el])));
  const [recipes, setRecipes] = useLocalStorage<Recipe>('infinite-craft-recipes', {});
  
  const [sortType, setSortType] = useState<SortType>('time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const [isSidebarTrashActive, setIsSidebarTrashActive] = useState(false);
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
  const [selectedElementIds, setSelectedElementIds] = useState<Set<string>>(new Set());

  const [history, setHistory] = useState<Map<string, CanvasElement>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyInitialized = useRef(false);

  const nextId = useRef(0);
  const aiRef = useRef<GoogleGenAI | null>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  useEffect(() => {
    if (process.env.API_KEY) {
      aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.error("API_KEY environment variable not set.");
    }

    // FIX: Explicitly type `el` as CanvasElement to resolve type inference error.
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
    // FIX: Cast element to ElementData before spreading to resolve type inference issue.
    updateCanvas(prev => new Map(prev).set(newId, { id: newId, ...(element as ElementData), position: pos, isProcessing: false, isFirstDiscovery: false }));
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
              // FIX: Cast el to CanvasElement to resolve spread type error.
              newMap.set(id, { ...(el as CanvasElement), position: pos });
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

  const combineElements = useCallback(async (el1: CanvasElement, el2: CanvasElement) => {
    const sortedNames = [el1.text, el2.text].sort();
    const recipeKey = sortedNames.join('+');
    
    // Set processing state without saving to history
    setElementsOnCanvas(prev => {
      const newMap = new Map(prev);
      const e1 = newMap.get(el1.id);
      const e2 = newMap.get(el2.id);
      // FIX: Cast e1 to CanvasElement to resolve spread type error.
      if (e1) newMap.set(el1.id, { ...(e1 as CanvasElement), isProcessing: true });
      // FIX: Cast e2 to CanvasElement to resolve spread type error.
      if (e2) newMap.set(el2.id, { ...(e2 as CanvasElement), isProcessing: true });
      return newMap;
    });

    let resultElement: ElementData | undefined;
    let isFirst = false;

    if (recipes[recipeKey]) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
      resultElement = recipes[recipeKey];
    } else if (aiRef.current) {
      try {
        const prompt = `You are a creative game AI. Combine "${sortedNames[0]}" and "${sortedNames[1]}" to create a new, single-word or short-phrase element. Respond ONLY with a JSON object containing "text" (string) and "emoji" (string, single emoji). Do not add any explanation or markdown formatting. Example: Water + Fire -> {"text": "Steam", "emoji": "💨"}`;
        
        const response = await aiRef.current.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      text: { type: Type.STRING },
                      emoji: { type: Type.STRING },
                  },
                  required: ["text", "emoji"],
              },
          },
        });
        
        const jsonString = response.text.trim();
        const parsedResult = JSON.parse(jsonString);

        if (parsedResult.text && parsedResult.emoji) {
            const newElement: ElementData = { 
                text: parsedResult.text.charAt(0).toUpperCase() + parsedResult.text.slice(1), 
                emoji: parsedResult.emoji,
                discoveredAt: Date.now(),
            };
            setRecipes(prev => ({...prev, [recipeKey]: newElement}));
            
            if (!discoveredElements.has(newElement.text)) {
                setDiscoveredElements(prev => new Map(prev).set(newElement.text, newElement));
                isFirst = true;
            }
            resultElement = newElement;
        }

      } catch (error) {
        console.error("Gemini API call failed:", error);
      }
    }

    updateCanvas(prev => {
      const newMap = new Map(prev);
      newMap.delete(el1.id);
      newMap.delete(el2.id);
      
      if (resultElement) {
        const newId = getNewId();
        const newPosition = { 
            x: (el1.position.x + el2.position.x) / 2, 
            y: (el1.position.y + el2.position.y) / 2 
        };
        newMap.set(newId, {
            id: newId, 
            ...resultElement!, 
            position: newPosition,
            isProcessing: false,
            isFirstDiscovery: isFirst,
        });
      }
      return newMap;
    });

  }, [recipes, discoveredElements, setRecipes, setDiscoveredElements, updateCanvas, setElementsOnCanvas]);
  
  const resetCanvas = useCallback(() => {
    updateCanvas(() => new Map());
  }, [updateCanvas]);

  const resetAll = useCallback(() => {
      updateCanvas(() => new Map());
      setDiscoveredElements(new Map(INITIAL_ELEMENTS.map(el => [el.text, el])));
      setRecipes({});
  }, [updateCanvas, setDiscoveredElements, setRecipes]);

  return (
    <div className={`w-full h-full overflow-hidden font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-300`}>
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
    </div>
  );
}

export default App;