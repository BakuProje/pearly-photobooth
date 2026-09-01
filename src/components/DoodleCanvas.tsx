'use client';

import React, { useRef, useState, useEffect } from 'react';
import { DoodlePath, DoodlePoint } from '@/lib/types';
import { Undo2, Trash2, Palette, PenTool, Check } from 'lucide-react';

interface DoodleCanvasProps {
  width: number;
  height: number;
  doodles: DoodlePath[];
  onUpdateDoodles: (doodles: DoodlePath[]) => void;
  isEnabled: boolean;
  onToggleEnabled: () => void;
}

const COLOR_PALETTE = ['#ff3366', '#00f0ff', '#f59e0b', '#ffffff', '#111827', '#a855f7', '#22c55e'];

export const DoodleCanvas: React.FC<DoodleCanvasProps> = ({
  width,
  height,
  doodles,
  onUpdateDoodles,
  isEnabled,
  onToggleEnabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState<string>('#ff3366');
  const [brushSize, setBrushSize] = useState<number>(4);
  const currentPathRef = useRef<DoodlePoint[]>([]);

  // Redraw doodles on canvas
  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const path of doodles) {
      if (path.points.length < 2) continue;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo((path.points[0].x / 100) * canvas.width, (path.points[0].y / 100) * canvas.height);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo((path.points[i].x / 100) * canvas.width, (path.points[i].y / 100) * canvas.height);
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    redraw();
  }, [doodles, width, height]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    currentPathRef.current = [{ x, y }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    currentPathRef.current.push({ x, y });

    // Live draw stroke
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const pts = currentPathRef.current;
      if (pts.length >= 2) {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        const p1 = pts[pts.length - 2];
        const p2 = pts[pts.length - 1];
        ctx.moveTo((p1.x / 100) * canvas.width, (p1.y / 100) * canvas.height);
        ctx.lineTo((p2.x / 100) * canvas.width, (p2.y / 100) * canvas.height);
        ctx.stroke();
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || !isEnabled) return;
    setIsDrawing(false);

    if (currentPathRef.current.length > 1) {
      const newPath: DoodlePath = {
        points: [...currentPathRef.current],
        color: currentColor,
        size: brushSize,
      };
      onUpdateDoodles([...doodles, newPath]);
    }
    currentPathRef.current = [];
  };

  const handleUndo = () => {
    if (doodles.length > 0) {
      onUpdateDoodles(doodles.slice(0, -1));
    }
  };

  const handleClear = () => {
    onUpdateDoodles([]);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 25,
          cursor: isEnabled ? 'crosshair' : 'default',
          pointerEvents: isEnabled ? 'auto' : 'none',
          touchAction: 'none',
        }}
      />

      {/* Floating Doodle Toolbar when active */}
      {isEnabled && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 35,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(15, 17, 26, 0.92)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6)',
            borderRadius: '999px',
          }}
        >
          {/* Color palette */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setCurrentColor(c)}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: c,
                  border: currentColor === c ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transform: currentColor === c ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              />
            ))}
          </div>

          <div style={{ width: '1px', height: '20px', background: 'var(--border-glass)' }} />

          {/* Stroke width */}
          <input
            type="range"
            min="2"
            max="12"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={{ width: '60px' }}
            title="Ukuran Kuas"
          />

          <div style={{ width: '1px', height: '20px', background: 'var(--border-glass)' }} />

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={doodles.length === 0}
            className="btn-icon"
            style={{ width: '30px', height: '30px' }}
            title="Undo"
          >
            <Undo2 size={14} />
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            disabled={doodles.length === 0}
            className="btn-icon"
            style={{ width: '30px', height: '30px' }}
            title="Hapus Semua Coretan"
          >
            <Trash2 size={14} color="#ef4444" />
          </button>

          {/* Finish drawing */}
          <button
            onClick={onToggleEnabled}
            className="btn btn-primary"
            style={{ padding: '4px 12px', fontSize: '0.75rem', height: '28px' }}
          >
            <Check size={14} /> Selesai
          </button>
        </div>
      )}
    </>
  );
};
