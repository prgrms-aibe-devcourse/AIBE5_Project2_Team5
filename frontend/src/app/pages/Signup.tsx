import { Link, useNavigate } from "react-router";
import { useState } from "react";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "designer",
  });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    // 회원가입 로직 (현재는 간단히 피드로 이동)
    navigate("/feed");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F5] via-white to-[#A8F0E4]/10 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="grid grid-cols-2 gap-[3px] w-[32px] h-[32px]">
            <div className="rounded-[2px] bg-[#00C9A7]"></div>
            <div className="rounded-[2px] bg-[#00C9A7] opacity-50"></div>
            <div className="rounded-[2px] bg-[#FF5C3A] opacity-60"></div>
            <div className="rounded-[2px] bg-[#FF5C3A]"></div>
          </div>
          <span className="text-3xl font-bold tracking-tight">
            <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A] text-[32px]">.</span>
          </span>
        </Link>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h1 className="text-2xl font-bold mb-2 text-center">회원가입</h1>
          <p className="text-gray-600 text-center mb-8">픽셀 크리에이티브 커뮤니티에 가입하세요</p>

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#00C9A7] transition-colors"
                placeholder="홍길동"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#00C9A7] transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                역할
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#00C9A7] transition-colors"
              >
                <option value="designer">디자이너</option>
                <option value="client">클라이언트</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#00C9A7] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#00C9A7] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <label className="flex items-start gap-2">
              <input type="checkbox" className="w-4 h-4 mt-1 text-[#00C9A7] border-gray-300 rounded focus:ring-[#00C9A7]" required />
              <span className="text-sm text-gray-600">
                <a href="#" className="text-[#00C9A7] hover:underline">이용약관</a> 및{" "}
                <a href="#" className="text-[#00C9A7] hover:underline">개인정보처리방침</a>에 동의합니다.
              </span>
            </label>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00C9A7]/90 to-[#00A88C]/90 backdrop-blur-md text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition-all border border-white/30"
            >
              회원가입
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              이미 계정이 있으신가요?{" "}
              <Link to="/login" className="text-[#00C9A7] hover:text-[#00A88C] font-semibold transition-colors">
                로그인
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">또는</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Social Signup */}
          <div className="space-y-3">
            <button 
              type="button"
              onClick={() => navigate("/feed")}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-gray-700">Google로 계속하기</span>
            </button>

            <button 
              type="button"
              onClick={() => navigate("/feed")}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#FEE500] rounded-lg hover:bg-[#FDD835] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#000000" d="M3.0273 10.9441c0 3.9802 2.4648 7.3789 6.7383 7.3789 2.2148 0 3.6953-0.8789 4.8281-2.1367l-1.9688-1.5234c-0.5859 0.7031-1.4297 1.2891-2.8594 1.2891-1.8398 0-3.1406-1.1367-3.5156-2.7539h8.6133c0.0703-0.293 0.1172-0.6328 0.1172-1.0078 0-3.5508-2.332-7.3789-6.457-7.3789-3.8516 0-6.5508 3.4219-6.5508 7.1328zm3.2227-1.2891c0.2461-1.8164 1.4648-2.8711 3.3281-2.8711 1.7109 0 2.9063 1.0078 3.0938 2.8711z"/>
              </svg>
              <span className="font-medium text-gray-900">카카오로 계속하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}