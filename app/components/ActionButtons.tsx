interface ActionButtonsProps {
  onFeed: () => void;
  onClean: () => void;
  onSleep: () => void;
  onChat: () => void;
  isSleeping: boolean;
  isSick: boolean;
  isAILoading: boolean;
}

interface BtnProps {
  label: string;
  onClick: () => void;
  disabled: boolean;
}

function PixelButton({ label, onClick, disabled }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="font-mono text-xs bg-gb-mid text-gb-screen border-2 border-gb-dark px-3 py-2 shadow-pixel-sm
        hover:bg-gb-dark
        active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-pixel-sm
        transition-none"
    >
      {label}
    </button>
  );
}

export default function ActionButtons({
  onFeed,
  onClean,
  onSleep,
  onChat,
  isSleeping,
  isSick,
  isAILoading,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <PixelButton label="Feed" onClick={onFeed} disabled={isSleeping} />
      <PixelButton label="Clean" onClick={onClean} disabled={isSleeping} />
      <PixelButton
        label={isSleeping ? "Sleeping..." : "Sleep"}
        onClick={onSleep}
        disabled={isSleeping}
      />
      <PixelButton
        label="Chat"
        onClick={onChat}
        disabled={isSleeping || isSick || isAILoading}
      />
    </div>
  );
}
