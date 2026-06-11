interface LevelBadgeProps {
  level: number;
  showLevelUp?: boolean;
}

export default function LevelBadge({ level, showLevelUp }: LevelBadgeProps) {
  return (
    <div className={`relative ${showLevelUp ? 'animate-level-up' : ''}`}>
      <div className="flex items-center gap-1.5">
        <div className="w-12 h-12 flex items-center justify-center bg-pixel-panel border border-pixel-border rounded-full">
          <span className="text-base">🐱</span>
        </div>
        <div>
          <span className="text-[12px] text-pixel-text font-pixel tracking-wider block leading-tight">
            Lv.{level}
          </span>
          {showLevelUp && (
            <span className="text-[10px] text-pixel-xp font-pixel animate-pixel-blink">
              LEVEL UP!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
