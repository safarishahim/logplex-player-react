import { useRef, useState } from 'react';

export interface ReactionsBarProps {
  reactions: string[];
  onReact: (emoji: string) => void;
}

/** A row of emoji reactions; tapping one fires a callback + a floating animation. */
export function ReactionsBar({ reactions, onReact }: ReactionsBarProps): JSX.Element {
  const [floats, setFloats] = useState<Array<{ id: number; emoji: string }>>([]);
  const nextId = useRef(0);

  const react = (emoji: string) => {
    onReact(emoji);
    const id = (nextId.current += 1);
    setFloats((f) => [...f, { id, emoji }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1200);
  };

  return (
    <div className="lpx-reactions">
      <div className="lpx-float-layer" aria-hidden="true">
        {floats.map((f) => (
          <span key={f.id} className="lpx-float">
            {f.emoji}
          </span>
        ))}
      </div>
      <div className="lpx-reaction-row">
        {reactions.map((emoji) => (
          <button
            key={emoji}
            className="lpx-reaction"
            type="button"
            aria-label={emoji}
            onClick={() => react(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
