export interface RadioOptionProps {
  label: string;
  on: boolean;
  onSelect: () => void;
}

/**
 * A single radio row in a settings menu. Defined at module scope (NOT inside a
 * modal component) so its component identity is stable across the skin's
 * frequent re-renders — otherwise React would recreate the option's DOM node
 * between pointerdown and pointerup, cancelling the click.
 */
export function RadioOption({ label, on, onSelect }: RadioOptionProps): JSX.Element {
  return (
    <li>
      <button className="lpx-radio-opt" role="radio" aria-checked={on} onClick={onSelect}>
        <span className="lpx-radio-label">{label}</span>
        <span className="lpx-radio-dot" data-on={on || undefined} />
      </button>
    </li>
  );
}
