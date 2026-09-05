import React, { PointerEvent, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const ROWS = [
  'SEEDCORN', 'HAYFARMR', 'SUNRAINE', 'SOILGROW',
  'CROPMAIZ', 'EARFIELD', 'ROWCOBXY',
];
const COLUMNS = 8;
const VISIBLE_COLUMNS = 6.2;
const INITIAL_REMOVED = new Set(['0-3', '2-1', '3-6', '5-4']);

type Cell = { id: string; row: number; column: number; letter: string };
type LayoutCell = Cell & { x: number; y: number; scaleX: number; scale: number; tilt: number; shade: number; visible: boolean };

const cells: Cell[] = ROWS.flatMap((letters, row) =>
  [...letters].map((letter, column) => ({ id: `${row}-${column}`, row, column, letter })),
);

function signedOffset(column: number, rotation: number) {
  let value = ((column - rotation) % COLUMNS + COLUMNS) % COLUMNS;
  if (value > COLUMNS / 2) value -= COLUMNS;
  return value;
}

function layout(rotation: number): LayoutCell[] {
  const front = (VISIBLE_COLUMNS - 1) / 2;
  return cells.map(cell => {
    const offset = signedOffset(cell.column, rotation);
    const visible = Math.abs(offset) <= front + 0.22;
    const angle = (offset / VISIBLE_COLUMNS) * Math.PI;
    const rowT = cell.row / (ROWS.length - 1);
    const radius = 178 * (0.88 + 0.12 * Math.sin(Math.PI * rowT));
    const edge = Math.min(1, Math.abs(offset) / front);
    return {
      ...cell,
      x: 210 + Math.sin(angle) * radius,
      y: 142 + cell.row * 68,
      scaleX: 1 - edge * 0.44,
      scale: 1 - edge * 0.08,
      // Each outer edge follows the vertical oval: inward at the top,
      // straight at mid-height, then outward at the bottom. The right mirrors left.
      tilt: edge > 0.36
        ? -Math.sign(offset) * (0.5 - rowT) * 24 * Math.pow((edge - 0.36) / 0.64, 1.15)
        : 0,
      shade: edge,
      visible,
    };
  }).filter(cell => cell.visible).sort((a, b) => b.shade - a.shade);
}

function App() {
  const [rotation, setRotation] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [removed, setRemoved] = useState(INITIAL_REMOVED);
  const pointer = useRef<{ x: number; rotation: number; moved: boolean } | null>(null);
  const board = useMemo(() => layout(rotation), [rotation]);
  const selectedCells = selected.map(id => cells.find(cell => cell.id === id)).filter(Boolean) as Cell[];
  const word = selectedCells.map(cell => cell.letter).join('');

  const tapCell = (id: string) => {
    if (removed.has(id) || pointer.current?.moved) return;
    setSelected(current => {
      const at = current.indexOf(id);
      if (at >= 0) return current.slice(0, at);
      return [...current, id];
    });
  };

  const begin = (event: PointerEvent) => {
    pointer.current = { x: event.clientX, rotation, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent) => {
    if (!pointer.current) return;
    const dx = event.clientX - pointer.current.x;
    if (Math.abs(dx) > 7) pointer.current.moved = true;
    if (pointer.current.moved) setRotation(pointer.current.rotation - dx / 74);
  };
  const end = () => {
    if (pointer.current?.moved) setRotation(value => Math.round(value));
    setTimeout(() => { pointer.current = null; }, 0);
  };

  const submit = () => {
    if (selected.length < 3) return;
    setRemoved(current => new Set([...current, ...selected]));
    setSelected([]);
  };

  return (
    <main className="stage">
      <section className="phone">
        <div className="vignette" />
        <header className="topbar"><button>⌂</button><div><strong>LEVEL 1</strong><span>HARVEST 70% OF THE COB</span></div><button>♥<small>4</small></button></header>
        <button className={`word ${word ? 'active' : ''}`} onClick={submit}>{word || 'TAP KERNELS TO BUILD A WORD'}</button>

        <div className="cob-zone" onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
          <div className="silk" aria-hidden="true">
            {Array.from({ length: 15 }, (_, index) => <i key={index} style={{ '--strand': index } as React.CSSProperties} />)}
          </div>
          {board.map(cell => {
            const isSelected = selected.includes(cell.id);
            const isRemoved = removed.has(cell.id);
            return (
              <button
                key={cell.id}
                className={`cell ${isSelected ? 'selected' : ''}`}
                style={{
                  left: cell.x, top: cell.y,
                  opacity: 1 - cell.shade * .22,
                  zIndex: Math.round((1 - cell.shade) * 100),
                  transform: `translate(-50%,-50%) rotate(${cell.tilt}deg) scale(${cell.scale}) scaleX(${cell.scaleX})`,
                  filter: `brightness(${1 - cell.shade * .22})`,
                }}
                onPointerDown={event => event.stopPropagation()}
                onClick={() => tapCell(cell.id)}
                aria-label={`${cell.letter}, row ${cell.row + 1}, column ${cell.column + 1}`}
              >
                <img className="socket" src="/assets/kernel-empty-socket.png" />
                {!isRemoved && <><img className="kernel" src="/assets/kernel-normal.png" /><span>{cell.letter}</span></>}
              </button>
            );
          })}
        </div>

        <footer>
          <div className="basket"><img src="/assets/harvest-basket.png"/><strong>{Math.round(removed.size / cells.length * 100)}%</strong><span>HARVESTED</span></div>
          <button className="turn" onClick={() => setRotation(value => Math.round(value - 1))}>↻</button>
          <div className="coins">◉ <strong>30</strong></div>
          <button className="turn" onClick={() => setRotation(value => Math.round(value + 1))}>↺</button>
          <button className="reset" onClick={() => { setRemoved(new Set(INITIAL_REMOVED)); setSelected([]); }}>RESET</button>
        </footer>
      </section>
      <aside>
        <h1>Kernel-cluster MVP</h1>
        <p>Drag the board horizontally to rotate. Tap visible kernels to build a word. Press the green word button to harvest selected kernels.</p>
        <p>The amber core, not a detailed corn illustration, hides every gap. Each cell owns its socket, kernel, and letter.</p>
      </aside>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
