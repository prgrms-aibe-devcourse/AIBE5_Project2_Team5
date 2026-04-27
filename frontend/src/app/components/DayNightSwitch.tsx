import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

export function DayNightSwitch({
  isNight,
  onToggle,
}: {
  isNight: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={isNight ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className={`relative flex h-9 w-[68px] cursor-pointer items-center rounded-full p-[3px] transition-all duration-700 ${
        isNight
          ? "bg-gradient-to-r from-[#1a1f3d] via-[#252b5c] to-[#1e2451] shadow-[0_0_12px_rgba(99,102,241,0.3),inset_0_1px_1px_rgba(255,255,255,0.08)]"
          : "bg-gradient-to-r from-[#fbbf24]/30 via-[#87ceeb]/40 to-[#60a5fa]/30 shadow-[0_0_12px_rgba(251,191,36,0.2),inset_0_1px_1px_rgba(255,255,255,0.5)]"
      }`}
    >
      <span
        className={`absolute left-1.5 text-[10px] font-bold transition-opacity duration-500 ${
          isNight ? "opacity-0" : "opacity-60"
        }`}
      >
        ☀
      </span>
      <span
        className={`absolute right-1.5 text-[10px] font-bold transition-opacity duration-500 ${
          isNight ? "opacity-60" : "opacity-0"
        }`}
      >
        ☾
      </span>

      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full shadow-lg ${
          isNight
            ? "ml-auto bg-gradient-to-br from-[#c7d2fe] to-[#818cf8] shadow-[0_0_10px_rgba(129,140,248,0.5)]"
            : "ml-0 bg-gradient-to-br from-[#fef3c7] to-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.5)]"
        }`}
      >
        <motion.div
          animate={{ rotate: isNight ? 360 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {isNight ? (
            <Moon className="size-3.5 text-[#312e81]" strokeWidth={2.5} />
          ) : (
            <Sun className="size-3.5 text-[#92400e]" strokeWidth={2.5} />
          )}
        </motion.div>
      </motion.div>
    </button>
  );
}
