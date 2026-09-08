import { useState, useEffect } from "react";
import { Menu, X, Search } from "lucide-react";

const NAV_ITEMS = [
  { label: "首页", href: "#" },
  { label: "学校概况", href: "#about" },
  { label: "新闻动态", href: "#news" },
  { label: "校区介绍", href: "#campuses" },
  { label: "信息公开", href: "#info" },
  { label: "招生信息", href: "#" },
  { label: "党建园地", href: "#" },
];

interface HeaderProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Header({ mobileMenuOpen, setMobileMenuOpen }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Top utility bar */}
      <div className="bg-navy-900 text-white/80 text-xs py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>2026年9月8日 星期一</span>
            <span className="text-white/40">|</span>
            <span>上海 · 晴 28°C</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-gold-400 transition-colors">校长信箱</a>
            <span className="text-white/40">|</span>
            <a href="#" className="hover:text-gold-400 transition-colors">English</a>
            <span className="text-white/40">|</span>
            <a href="#" className="hover:text-gold-400 transition-colors">旧版入口</a>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-navy-900/5"
            : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="#" className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-full bg-navy-900 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-gold-400 font-serif font-bold text-lg">莘</span>
              </div>
              <div>
                <h1 className="text-navy-900 font-serif font-bold text-xl tracking-wide leading-tight">
                  莘松中学
                </h1>
                <p className="text-text-muted text-[10px] tracking-widest uppercase">
                  Xinsong Middle School
                </p>
              </div>
            </a>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="nav-link px-4 py-2 text-sm font-medium text-text-secondary hover:text-navy-900 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 rounded-full hover:bg-navy-50 transition-colors"
                aria-label="搜索"
              >
                <Search className="w-4.5 h-4.5 text-navy-700" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-full hover:bg-navy-50 transition-colors"
                aria-label="菜单"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-navy-700" />
                ) : (
                  <Menu className="w-5 h-5 text-navy-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-navy-100 shadow-xl animate-fade-in">
            <div className="max-w-3xl mx-auto px-6 py-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
                <input
                  type="text"
                  placeholder="搜索新闻、公告、通知..."
                  className="w-full pl-12 pr-4 py-4 bg-navy-50 rounded-xl border border-navy-100 focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100 text-navy-900 placeholder:text-navy-300 transition-all"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white/98 backdrop-blur-xl border-b border-navy-100 shadow-2xl animate-fade-in">
            <nav className="max-w-7xl mx-auto px-6 py-6">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3.5 px-4 text-text-secondary hover:text-navy-900 hover:bg-navy-50 rounded-lg font-medium transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
