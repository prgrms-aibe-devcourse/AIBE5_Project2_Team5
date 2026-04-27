import { Link } from "react-router";

type PickxelLogoProps = {
  className?: string;
  /** 다크 배경에서 로고 워드마크 대비 */
  dark?: boolean;
};

export function PickxelLogo({ className = "", dark = false }: PickxelLogoProps) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <div className="grid h-7 w-7 grid-cols-2 gap-[3px] sm:h-7 sm:w-7">
        <div className="rounded-[3px] bg-[#00C9A7]" />
        <div className="rounded-[3px] bg-[#00C9A7]/55" />
        <div className="rounded-[3px] bg-[#FF5C3A]/65" />
        <div className="rounded-[3px] bg-[#FF5C3A]" />
      </div>
      <span
        className={`text-xl font-bold tracking-tight transition-colors duration-500 sm:text-2xl ${
          dark ? "text-white" : "text-[#2D2A26]"
        }`}
      >
        <span className="text-[#FF5C3A]">p</span>ick
        <span className="text-[#00C9A7]">x</span>el
        <span className="text-[#FF5C3A] text-[26px]">.</span>
      </span>
    </Link>
  );
}
