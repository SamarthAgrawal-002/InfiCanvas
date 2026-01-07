
export type PinType = 'text' | 'image' | 'list';

export interface PinItem {
  id: string;
  checked: boolean;
  text: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
  opacity: number;
  type: 'pen' | 'highlighter';
}

export interface Pin {
  id: string;
  type: PinType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content: string;
  items?: PinItem[];
  color: string;
  tags: string[];
  createdAt: number;
}

export interface BoardState {
  pins: Pin[];
  strokes: DrawingStroke[];
  zoom: number;
  panX: number;
  panY: number;
}

export interface Snapshot {
  id: string;
  name: string;
  timestamp: number;
  data: BoardState;
}

export type Action = 
  | { type: 'ADD_PIN'; pin: Pin }
  | { type: 'MOVE_PIN'; id: string; x: number; y: number }
  | { type: 'UPDATE_PIN'; id: string; updates: Partial<Pin> }
  | { type: 'DELETE_PIN'; id: string }
  | { type: 'SET_STATE'; state: BoardState };
