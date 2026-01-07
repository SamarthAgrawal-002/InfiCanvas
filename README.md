
# PinBoard Pro - Infinite Digital Canvas

PinBoard Pro is a high-performance, client-side digital whiteboard inspired by tools like Miro and Pinterest. It allows users to capture ideas using text, images, task lists, and **free-hand drawing** on a freely navigable 2D space.

## 🚀 Key Features

- **Infinite Canvas**: Zoom and pan seamlessly using mouse controls.
- **Free-hand Drawing**: Toggle "Drawing Mode" to mark up your board.
  - **Marker**: Sharp solid lines for notes.
  - **Highlighter**: Semi-transparent thick brush for emphasis.
  - **Customizable**: Change brush size and color on the fly.
- **Rich Pin Types**: Support for Text notes, Image blocks, and interactive Task Lists.
- **History (Undo/Redo)**: Full command stack tracking movements, deletions, edits, and **drawing strokes**.
- **Snapshots**: Save current board layouts as named versions and restore them anytime.
- **Persistence**: Automatically saves your board and drawings to browser storage.
- **High Performance**: Optimized canvas rendering for strokes and React refs for transformations.

## 🛠️ Technical Implementation

### State Management
The app uses a hybrid approach:
- **React State** for UI reactivity (pin content, stroke selection).
- **Drawing Engine**: Uses an HTML5 Canvas synced with the global coordinate system. Strokes are re-rendered based on the current viewport (pan/zoom).
- **History Manager**: Every drawing stroke completion pushes the state to the stack.

## ⌨️ Controls
- **Pan**: Middle mouse button or drag empty space (when Draw Mode is OFF).
- **Zoom**: `Ctrl` + `Mouse Wheel` or header controls.
- **Draw**: Toggle Drawing Mode in the header. Use left-click to sketch.
- **Recenter**: Use the maximize icon to reset zoom/pan.
