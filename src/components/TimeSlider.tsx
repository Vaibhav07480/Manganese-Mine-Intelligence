import { MONTHS } from "../data/series";

interface TimeSliderProps {
  monthIndex: number;
  onChange: (index: number) => void;
}

export function TimeSlider({ monthIndex, onChange }: TimeSliderProps) {
  const meta = MONTHS[monthIndex];
  return (
    <div className="time-slider">
      <div className="time-head">
        <span className="time-kicker">Month</span>
        <strong>{meta.label}</strong>
      </div>
      <input
        type="range"
        min={0}
        max={11}
        step={1}
        value={monthIndex}
        aria-label="Month"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="time-ticks">
        {MONTHS.map((month, index) => (
          <button
            key={month.month}
            type="button"
            className={index === monthIndex ? "is-on" : ""}
            onClick={() => onChange(index)}
          >
            {month.short}
          </button>
        ))}
      </div>
    </div>
  );
}
