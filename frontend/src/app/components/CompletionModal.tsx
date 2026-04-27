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
      <div className="relative w-full max-w-md rounded-lg bg-white p-7 text-center shadow-2xl">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            aria-label="완료 모달 닫기"
          >
            <X className="size-5" />
          </button>
        )}

        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-[#A8F0E4]/35 text-[#00A88C]">
          <CheckCircle2 className="size-8" />
        </div>
        <p className="text-sm font-bold text-[#00A88C]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold text-[#0F0F0F]">{title}</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">{description}</p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-[#00C9A7] font-bold text-[#0F0F0F] shadow-lg shadow-[#00C9A7]/20 transition-colors hover:bg-[#00A88C]"
          >
            {primaryActionLabel}
          </button>
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="flex h-11 w-full items-center justify-center rounded-lg border border-gray-200 bg-white font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
