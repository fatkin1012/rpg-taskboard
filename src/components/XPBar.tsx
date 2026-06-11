interface XPBarProps {
  progress: number;
  expInLevel: number;
  expForNext: number;
  level: number;
}

export default function XPBar({ progress, expInLevel, expForNext, level }: XPBarProps) {
  const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[11px] text-pixel-xp tracking-wider font-pixel">
          EXP
        </span>
        <span className="text-[10px] text-pixel-dim font-pixel">
          {expInLevel}/{expForNext}
        </span>
      </div>
      <div className="w-full h-5 bg-pixel-bg border border-pixel-border rounded-sm overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-pixel-xp to-yellow-400 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] text-black font-pixel" style={{ textShadow: 'none' }}>
            Lv.{level}
          </span>
        </div>
      </div>
    </div>
  );
}
