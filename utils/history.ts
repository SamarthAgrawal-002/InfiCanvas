
import { BoardState } from '../types';

export class HistoryManager {
  private stack: BoardState[] = [];
  private pointer: number = -1;
  private maxHistory: number = 50;

  push(state: BoardState) {
    // If we're not at the end of the stack, remove future states
    if (this.pointer < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.pointer + 1);
    }
    
    // Deep copy to prevent reference issues
    const stateCopy = JSON.parse(JSON.stringify(state));
    this.stack.push(stateCopy);
    
    if (this.stack.length > this.maxHistory) {
      this.stack.shift();
    } else {
      this.pointer++;
    }
  }

  undo(): BoardState | null {
    if (this.pointer > 0) {
      this.pointer--;
      return JSON.parse(JSON.stringify(this.stack[this.pointer]));
    }
    return null;
  }

  redo(): BoardState | null {
    if (this.pointer < this.stack.length - 1) {
      this.pointer++;
      return JSON.parse(JSON.stringify(this.stack[this.pointer]));
    }
    return null;
  }

  canUndo(): boolean {
    return this.pointer > 0;
  }

  canRedo(): boolean {
    return this.pointer < this.stack.length - 1;
  }

  clear() {
    this.stack = [];
    this.pointer = -1;
  }
}
