import { ArrowLeft, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { confirmPasswordResetApi } from "../api/authApi";

type PasswordResetErrors = {
  newPassword?: string;
  confirmPassword?: string;
  form?: string;
};

const isPasswordLengthValid = (password: string) => password.length >= 8 && password.length <= 20;

export default function PasswordReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<PasswordResetErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nextErrors: PasswordResetErrors = {};
    if (!isPasswordLengthValid(newPassword)) {
      nextErrors.newPassword = "새 비밀번호는 8자 이상 20자 이하로 입력해주세요.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "새 비밀번호 확인을 입력해주세요.";
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await confirmPasswordResetApi({
        token,
        newPassword,
        confirmPassword,
      });
      navigate("/login", {
        replace: true,
        state: { message: "비밀번호가 변경됐습니다. 새 비밀번호로 로그인해주세요." },
      });
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "비밀번호 재설정에 실패했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-10">
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-[#00A88C]"
        >
          <ArrowLeft className="size-4" />
          로그인으로 돌아가기
        </Link>

        <section className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="mb-1 text-sm font-semibold text-[#00A88C]">비밀번호 재설정</p>
            <h1 className="text-2xl font-bold text-gray-950">새 비밀번호를 입력해주세요</h1>
            <p className="mt-2 text-sm text-gray-600">비밀번호는 8자 이상 20자 이하로 설정해주세요.</p>
          </div>

          {!token ? (
            <div className="rounded-lg bg-[#FFF7F4] px-4 py-3 text-sm font-medium text-[#FF5C3A]">
              재설정 링크가 올바르지 않습니다. 다시 요청해주세요.
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-gray-700">
                  새 비밀번호
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors((current) => ({ ...current, newPassword: undefined, form: undefined }));
                    }}
                    className={`h-11 w-full rounded-lg border bg-white px-12 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-4 focus:ring-[#00C9A7]/10 ${
                      errors.newPassword ? "border-[#FF5C3A]" : "border-gray-200"
                    }`}
                    placeholder="8자 이상 20자 이하"
                  />
                </div>
                {errors.newPassword && (
                  <p className="mt-2 text-xs font-medium text-[#FF5C3A]">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-700">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((current) => ({ ...current, confirmPassword: undefined, form: undefined }));
                    }}
                    className={`h-11 w-full rounded-lg border bg-white px-12 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-4 focus:ring-[#00C9A7]/10 ${
                      errors.confirmPassword ? "border-[#FF5C3A]" : "border-gray-200"
                    }`}
                    placeholder="새 비밀번호를 한 번 더 입력"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-xs font-medium text-[#FF5C3A]">{errors.confirmPassword}</p>
                )}
              </div>

              {errors.form && (
                <p className="rounded-lg bg-[#FFF7F4] px-4 py-3 text-sm font-medium text-[#FF5C3A]">
                  {errors.form}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-lg bg-[#00C9A7] text-sm font-semibold text-[#0F0F0F] transition-colors hover:bg-[#00A88C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "변경 중..." : "비밀번호 변경"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
