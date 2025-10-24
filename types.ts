export interface ElementData {
  text: string;
  emoji: string;
  discoveredAt?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface CanvasElement extends ElementData {
  id: string;
  position: Position;
  isFirstDiscovery: boolean;
}

export interface ExplosionData {
  id: number;
  position: Position;
}

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  emoji: string;
}

export type RecipeResult = ElementData | { isExplosion: true };

export type Recipe = {
  [key: string]: RecipeResult;
};

export type SortType = 'time' | 'name' | 'emoji';
export type SortDirection = 'asc' | 'desc';