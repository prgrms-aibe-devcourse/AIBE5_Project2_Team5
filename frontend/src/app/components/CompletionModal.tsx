import { CheckCircle2, X } from "lucide-react";

type CompletionModalProps = {
  open: boolean;
  eyebrow: string;
  title: string;
  description: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onClose?: () => void;
  isNight?: boolean;
};

export default function CompletionModal({
  open,
  eyebrow,
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  onClose,
  isNight = false,
}: CompletionModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full max-w-md p-7 text-center shadow-2xl ${
          isNight
            ? "rounded-lg border border-white/10 bg-[#141d30] text-white"
            : "rounded-lg bg-white"
        }`}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`absolute right-4 top-4 rounded-md p-2 transition-colors ${
              isNight
                ? "text-white/50 hover:bg-white/10 hover:text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
            aria-label="완료 모달 닫기"
          >
            <X className="size-5" />
          </button>
        )}

        <div
          className={`mx-auto mb-5 grid size-14 place-items-center rounded-md ${
            isNight ? "bg-[#00C9A7]/15 text-[#7ee8d3]" : "bg-[#A8F0E4]/35 text-[#00A88C]"
          }`}
        >
          <CheckCircle2 className="size-8" />
        </div>
        <p className={`text-sm font-bold ${isNight ? "text-[#7ee8d3]" : "text-[#00A88C]"}`}>{eyebrow}</p>
        <h2 className={`mt-2 text-2xl font-bold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>{title}</h2>
        <p
          className={`mt-3 whitespace-pre-line text-sm leading-relaxed ${
            isNight ? "text-white/65" : "text-gray-600"
          }`}
        >
          {description}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onPrimaryAction}
            className={`flex h-12 w-full items-center justify-center rounded-md font-bold shadow-lg transition-colors ${
              isNight
                ? "bg-[#00C9A7] text-[#0f172a] shadow-[#00C9A7]/20 hover:bg-[#00E0BA]"
                : "bg-[#00C9A7] text-[#0F0F0F] shadow-[#00C9A7]/20 hover:bg-[#00A88C]"
            }`}
          >
            {primaryActionLabel}
          </button>
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className={`flex h-11 w-full items-center justify-center rounded-md border font-semibold transition-colors ${
                isNight
                  ? "border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
