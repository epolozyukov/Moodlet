interface ActionButtonsProps {
  onMeal: () => void;
  onSnack: () => void;
  onPlay: () => void;
  onClean: () => void;
  onSleep: () => void;
  onWake: () => void;
  onMedicine: () => void;
  onChat: () => void;
  isSleeping: boolean;
  isSick: boolean;
  isAILoading: boolean;
  energy: number;
}

interface BtnProps {
  label: string;
  onClick: () => void;
  disabled: boolean;
  highlight?: boolean;
}

function PixelButton({ label, onClick, disabled, highlight }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-mono text-xs border-2 border-gb-dark px-3 py-2 shadow-pixel-sm
        active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-pixel-sm
        transition-none ${
          highlight
            ? "bg-gb-screen text-gb-dark hover:bg-gb-light"
            : "bg-gb-mid text-gb-screen hover:bg-gb-dark"
        }`}
    >
      {label}
    </button>
  );
}

export default function ActionButtons({
  onMeal,
  onSnack,
  onPlay,
  onClean,
  onSleep,
  onWake,
  onMedicine,
  onChat,
  isSleeping,
  isSick,
  isAILoading,
  energy,
}: ActionButtonsProps) {
  const playDisabled = isSleeping || isSick || energy <= 20;

  if (isSleeping) {
    return (
      <div className="flex flex-wrap gap-2">
        <PixelButton label="Wake Up" onClick={onWake} disabled={false} highlight />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <PixelButton label="Meal" onClick={onMeal} disabled={false} />
        <PixelButton label="Snack" onClick={onSnack} disabled={false} />
        <PixelButton label="Play" onClick={onPlay} disabled={playDisabled} />
      </div>
      <div className="flex flex-wrap gap-2">
        <PixelButton label="Clean" onClick={onClean} disabled={false} />
        <PixelButton label="Sleep" onClick={onSleep} disabled={false} />
        {isSick && (
          <PixelButton label="Medicine" onClick={onMedicine} disabled={false} highlight />
        )}
        <PixelButton
          label="Chat"
          onClick={onChat}
          disabled={isSick || isAILoading}
        />
      </div>
    </div>
  );
}
