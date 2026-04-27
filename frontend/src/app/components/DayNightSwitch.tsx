import { SkyToggle } from "@/components/ui/sky-toggle";

export function DayNightSwitch({
  isNight,
  onToggle,
  className,
}: {
  isNight: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <div className={`flex h-9 w-[68px] shrink-0 items-center justify-center ${className ?? ""}`}>
      <SkyToggle
        isNight={isNight}
        onToggle={onToggle}
        aria-label={isNight ? "라이트 모드로 전환" : "다크 모드로 전환"}
      />
    </div>
  );
}
