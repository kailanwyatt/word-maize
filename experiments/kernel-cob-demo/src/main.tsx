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
type LayoutCell = Cell & { x: number; y: number; scaleX: number; scale: number; tilt: number; shade: number; opacity: number };
type FlyingKernel = { id: string; letter: string; left: number; top: number; width: number; height: number; dx: number; dy: number; delay: number };

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
    const distance = Math.abs(offset);
    const angle = (offset / VISIBLE_COLUMNS) * Math.PI;
    const rowT = cell.row / (ROWS.length - 1);
    const radius = 178 * (0.88 + 0.12 * Math.sin(Math.PI * rowT));
    const edge = Math.min(1, distance / front);
    const opacity = Math.max(0, Math.min(1, (3.65 - distance) / 0.8));
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
      opacity,
    };
  }).sort((a, b) => b.shade - a.shade);
}

function App() {
  const [rotation, setRotation] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [removed, setRemoved] = useState(INITIAL_REMOVED);
  const [departing, setDeparting] = useState<Set<string>>(new Set());
  const [flying, setFlying] = useState<FlyingKernel[]>([]);
  const phoneRef = useRef<HTMLElement | null>(null);
  const basketRef = useRef<HTMLDivElement | null>(null);
  const rotationRef = useRef(0);
  const animation = useRef<number | null>(null);
  const pointer = useRef<{ x: number; rotation: number; moved: boolean; lastX: number; lastTime: number; velocity: number } | null>(null);
  const board = useMemo(() => layout(rotation), [rotation]);
  const selectedCells = selected.map(id => cells.find(cell => cell.id === id)).filter(Boolean) as Cell[];
  const word = selectedCells.map(cell => cell.letter).join('');

  const updateRotation = (value: number) => {
    rotationRef.current = value;
    setRotation(value);
  };

  const stopAnimation = () => {
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    animation.current = null;
  };

  const springTo = (target: number, initialVelocity = 0) => {
    stopAnimation();
    let velocity = initialVelocity;
    let previous = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.032);
      previous = now;
      const displacement = target - rotationRef.current;
      velocity += (displacement * 145 - velocity * 20) * dt;
      updateRotation(rotationRef.current + velocity * dt);
      if (Math.abs(displacement) < 0.002 && Math.abs(velocity) < 0.02) {
        updateRotation(target);
        animation.current = null;
        return;
      }
      animation.current = requestAnimationFrame(frame);
    };
    animation.current = requestAnimationFrame(frame);
  };

  const coastAndSettle = (initialVelocity: number) => {
    stopAnimation();
    let velocity = initialVelocity;
    let previous = performance.now();
    const frame = (now: number) => {
      const dt = Math.min((now - previous) / 1000, 0.032);
      previous = now;
      updateRotation(rotationRef.current + velocity * dt);
      velocity *= Math.exp(-6.2 * dt);
      if (Math.abs(velocity) < 0.22) {
        springTo(Math.round(rotationRef.current), velocity);
        return;
      }
      animation.current = requestAnimationFrame(frame);
    };
    animation.current = requestAnimationFrame(frame);
  };

  const tapCell = (id: string) => {
    if (removed.has(id) || departing.has(id) || pointer.current?.moved || flying.length > 0) return;
    setSelected(current => {
      const at = current.indexOf(id);
      if (at >= 0) return current.slice(0, at);
      return [...current, id];
    });
  };

  const begin = (event: PointerEvent) => {
    stopAnimation();
    pointer.current = { x: event.clientX, rotation: rotationRef.current, moved: false, lastX: event.clientX, lastTime: performance.now(), velocity: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent) => {
    if (!pointer.current) return;
    const dx = event.clientX - pointer.current.x;
    if (Math.abs(dx) > 7) pointer.current.moved = true;
    if (pointer.current.moved) {
      const now = performance.now();
      const dt = Math.max(now - pointer.current.lastTime, 1);
      const instantVelocity = -((event.clientX - pointer.current.lastX) / 74) / (dt / 1000);
      pointer.current.velocity = pointer.current.velocity * 0.58 + instantVelocity * 0.42;
      pointer.current.lastX = event.clientX;
      pointer.current.lastTime = now;
      updateRotation(pointer.current.rotation - dx / 74);
    }
  };
  const end = () => {
    if (pointer.current?.moved) coastAndSettle(pointer.current.velocity);
    setTimeout(() => { pointer.current = null; }, 0);
  };

  const submit = () => {
    if (selected.length < 3 || flying.length > 0 || !phoneRef.current || !basketRef.current) return;
    const phoneRect = phoneRef.current.getBoundingClientRect();
    const basketRect = basketRef.current.getBoundingClientRect();
    const targetX = basketRect.left - phoneRect.left + basketRect.width * 0.5;
    const targetY = basketRect.top - phoneRect.top + 25;
    const flights = selected.flatMap((id, index) => {
      const source = phoneRef.current?.querySelector<HTMLElement>(`[data-cell-id="${id}"]`);
      const cell = cells.find(item => item.id === id);
      if (!source || !cell) return [];
      const rect = source.getBoundingClientRect();
      const left = rect.left - phoneRect.left;
      const top = rect.top - phoneRect.top;
      return [{
        id,
        letter: cell.letter,
        left,
        top,
        width: rect.width,
        height: rect.height,
        dx: targetX - (left + rect.width * 0.5),
        dy: targetY - (top + rect.height * 0.5),
        delay: index * 70,
      }];
    });
    const leavingIds = [...selected];
    setDeparting(new Set(leavingIds));
    setFlying(flights);
    setSelected([]);
    leavingIds.forEach((id, index) => {
      window.setTimeout(() => {
        setRemoved(current => new Set([...current, id]));
      }, 610 + index * 70);
    });
    window.setTimeout(() => {
      setFlying([]);
      setDeparting(new Set());
    }, 780 + Math.max(0, leavingIds.length - 1) * 70);
  };

  return (
    <main className="stage">
      <section className="phone" ref={phoneRef}>
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
                data-cell-id={cell.id}
                style={{
                  opacity: cell.opacity * (1 - cell.shade * .18),
                  zIndex: Math.round((1 - cell.shade) * 100),
                  transform: `translate3d(${cell.x - 39}px,${cell.y - 39}px,0) rotate(${cell.tilt}deg) scale(${cell.scale}) scaleX(${cell.scaleX})`,
                  filter: `brightness(${1 - cell.shade * .22})`,
                  pointerEvents: cell.opacity < 0.35 ? 'none' : 'auto',
                }}
                onPointerDown={event => event.stopPropagation()}
                onClick={() => tapCell(cell.id)}
                aria-label={`${cell.letter}, row ${cell.row + 1}, column ${cell.column + 1}`}
              >
                <img className="socket" src="/assets/kernel-empty-socket.png" />
                {!isRemoved && !departing.has(cell.id) && <><img className="kernel" src="/assets/kernel-normal.png" /><span>{cell.letter}</span></>}
              </button>
            );
          })}
        </div>

        {flying.map(kernel => (
          <div
            className="flying-kernel"
            key={kernel.id}
            style={{
              left: kernel.left,
              top: kernel.top,
              width: kernel.width,
              height: kernel.height,
              '--fly-x': `${kernel.dx}px`,
              '--fly-y': `${kernel.dy}px`,
              '--fly-delay': `${kernel.delay}ms`,
            } as React.CSSProperties}
          >
            <img src="/assets/kernel-normal.png" />
            <span>{kernel.letter}</span>
          </div>
        ))}

        <footer>
          <div className="basket" ref={basketRef}><img src="/assets/harvest-basket.png"/><strong>{Math.round(removed.size / cells.length * 100)}%</strong><span>HARVESTED</span></div>
          <button className="turn" onClick={() => springTo(Math.round(rotationRef.current) - 1)}>↻</button>
          <div className="coins">◉ <strong>30</strong></div>
          <button className="turn" onClick={() => springTo(Math.round(rotationRef.current) + 1)}>↺</button>
          <button className="reset" onClick={() => { setRemoved(new Set(INITIAL_REMOVED)); setSelected([]); setDeparting(new Set()); setFlying([]); }}>RESET</button>
        </footer>
      </section>
      <aside>
        <h1>Kernel-cluster MVP</h1>
        <p>Drag the board horizontally to rotate. Tap visible kernels to build a word. Press the green word button to harvest selected kernels.</p>
        <p>Each cell owns its socket, kernel, and native letter while continuous cylinder motion keeps the spin seamless.</p>
      </aside>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
