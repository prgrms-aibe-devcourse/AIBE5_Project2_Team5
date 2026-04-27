export default function Footer() {
  return (
    <footer className="bg-[#0F0F0F] border-t border-[#242424] text-white py-8">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-xl mb-2">
              <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
            </div>
            <p className="text-sm text-gray-400">© 2024 pickxel. 크리에이터와 의뢰인을 위한 연결 플랫폼.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 sm:text-sm">
            <span className="rounded-full border border-white/15 px-3 py-1">이용약관 준비중</span>
            <span className="rounded-full border border-white/15 px-3 py-1">개인정보처리방침 준비중</span>
            <span className="rounded-full border border-white/15 px-3 py-1">고객센터 오픈 예정</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
