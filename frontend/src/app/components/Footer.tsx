export default function Footer() {
  return (
    <footer className="bg-[#0F0F0F] border-t border-[#242424] text-white py-8">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-xl mb-2">
              <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
            </div>
            <p className="text-sm text-gray-400">© 2026 pickxel. pick your designer · sell your work</p>
          </div>
          <div className="flex gap-8 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">이용약관</a>
            <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-white transition-colors">고객센터</a>
            <a href="#" className="hover:text-white transition-colors">인재채용</a>
            <a href="#" className="hover:text-white transition-colors">비즈니스 문의</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
