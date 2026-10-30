import { useEffect, useRef } from 'react';

const INTERACTIVE = 'a, button, label, input, textarea, select, [role="radio"]';

/**
 * Cursor decorativo que sigue al mouse (solo en escritorio y si no se pidió
 * reducir movimiento). El cursor normal del sistema se conserva.
 */
export default function Cursor() {
  const ref = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia?.('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    const el = ref.current;
    if (!el || !mq?.matches) return undefined;

    let x = -100;
    let y = -100;
    let tx = -100;
    let ty = -100;
    let frame;

    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = requestAnimationFrame(loop);
    };

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      el.classList.add('is-on');
      const target = e.target instanceof Element ? e.target : null;
      el.classList.toggle('is-hover', Boolean(target?.closest(INTERACTIVE)));
    };
    const onLeave = () => el.classList.remove('is-on');
    const onDown = () => el.classList.add('is-down');
    const onUp = () => el.classList.remove('is-down');

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div className="cursor" ref={ref} aria-hidden="true">
      <span className="cursor-ring" />
    </div>
  );
}
