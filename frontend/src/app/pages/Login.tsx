import { Link, useNavigate } from "react-router";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 테스트 계정 확인
    if (email === "qwer@email.com" && password === "1234") {
      navigate("/feed");
    } else {
      alert("이메일 또는 비밀번호가 일치하지 않습니다.\n\n테스트 계정:\n이메일: qwer@email.com\n비밀번호: 1234");
    }
  };

  const handleTestLogin = () => {
    setEmail("qwer@email.com");
    setPassword("1234");
    // 자동으로 로그인
    setTimeout(() => {
      navigate("/feed");
    }, 300);
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

        {/* Test Account Info */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-blue-800 mb-2">🧪 테스트 계정</p>
          <p className="text-xs text-blue-700 mb-1">이메일: <code className="bg-blue-100 px-2 py-0.5 rounded">qwer@email.com</code></p>
          <p className="text-xs text-blue-700 mb-3">비밀번호: <code className="bg-blue-100 px-2 py-0.5 rounded">1234</code></p>
          <button
            type="button"
            onClick={handleTestLogin}
            className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            테스트 계정으로 빠른 로그인
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h1 className="text-2xl font-bold mb-2 text-center">로그인</h1>
          <p className="text-gray-600 text-center mb-8">크리에이티브 세계로 들어오세요</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#00C9A7] transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#00C9A7] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-[#00C9A7] border-gray-300 rounded focus:ring-[#00C9A7]" />
                <span className="text-sm text-gray-600">로그인 상태 유지</span>
              </label>
              <a href="#" className="text-sm text-[#00C9A7] hover:text-[#00A88C] transition-colors">
                비밀번호 찾기
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00C9A7]/90 to-[#00A88C]/90 backdrop-blur-md text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] transition-all border border-white/30"
            >
              로그인
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              아직 계정이 없으신가요?{" "}
              <Link to="/signup" className="text-[#00C9A7] hover:text-[#00A88C] font-semibold transition-colors">
                회원가입
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">또는</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Social Login */}
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

        <p className="text-center text-sm text-gray-500 mt-6">
          로그인함으로써{" "}
          <a href="#" className="text-[#00C9A7] hover:underline">이용약관</a>
          {" "}및{" "}
          <a href="#" className="text-[#00C9A7] hover:underline">개인정보처리방침</a>
          에 동의합니다.
        </p>
      </div>
    </div>
  );
}