import { ArrowLeft, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { confirmPasswordResetApi } from "../api/authApi";
import { PickxelLogo } from "../components/PickxelLogo";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { useAuthSurface } from "../components/auth/useAuthSurface";

type PasswordResetErrors = {
  newPassword?: string;
  confirmPassword?: string;
  form?: string;
};

const isPasswordLengthValid = (password: string) => password.length >= 8 && password.length <= 20;

export default function PasswordReset() {
  const s = useAuthSurface();
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
    <AuthPageShell>
      <main className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center px-4 pb-16 pt-4 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <PickxelLogo dark={s.isNight} />
        </div>

        <Link
          to="/login"
          className={`mb-6 inline-flex items-center gap-2 text-base font-semibold transition-colors ${
            s.isNight ? "text-white/55 hover:text-[#7EE8D0]" : "text-[#525252] hover:text-[#007C69]"
          }`}
        >
          <ArrowLeft className="size-4" />
          로그인으로 돌아가기
        </Link>

        <section className={`p-6 sm:p-8 ${s.card}`}>
          <div className="mb-6">
            <p className={`mb-1 text-base font-semibold ${s.link}`}>비밀번호 재설정</p>
            <h1 className={`font-display text-2xl font-bold ${s.heading}`}>새 비밀번호를 입력해주세요</h1>
            <p className={`mt-2 text-sm ${s.subheading}`}>비밀번호는 8자 이상 20자 이하로 설정해주세요.</p>
          </div>

          {!token ? (
            <div className={s.errorBanner}>재설정 링크가 올바르지 않습니다. 다시 요청해주세요.</div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="new-password" className={s.label}>
                  새 비밀번호
                </label>
                <div className="relative">
                  <Lock className={`pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 ${s.iconInput}`} />
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors((current) => ({ ...current, newPassword: undefined, form: undefined }));
                    }}
                    className={s.input(Boolean(errors.newPassword))}
                    placeholder="8자 이상 20자 이하"
                  />
                </div>
                {errors.newPassword && <p className={`mt-2 ${s.errorText}`}>{errors.newPassword}</p>}
              </div>

              <div>
                <label htmlFor="confirm-password" className={s.label}>
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <Lock className={`pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 ${s.iconInput}`} />
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((current) => ({ ...current, confirmPassword: undefined, form: undefined }));
                    }}
                    className={s.input(Boolean(errors.confirmPassword))}
                    placeholder="새 비밀번호를 한 번 더 입력"
                  />
                </div>
                {errors.confirmPassword && <p className={`mt-2 ${s.errorText}`}>{errors.confirmPassword}</p>}
              </div>

              {errors.form && <p className={s.errorBanner}>{errors.form}</p>}

              <button type="submit" disabled={isSubmitting} className={`w-full ${s.primaryButton}`}>
                {isSubmitting ? "변경 중..." : "비밀번호 변경"}
              </button>
            </form>
          )}
        </section>
      </main>
    </AuthPageShell>
  );
}
