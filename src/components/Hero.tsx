import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="./images/campus-hero.jpg"
          alt="莘松中学校园鸟瞰"
          className="w-full h-full object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-gold-400/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-navy-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8 animate-fade-up">
            <div className="w-2 h-2 bg-gold-400 rounded-full animate-shimmer" />
            <span className="text-white/90 text-sm font-medium">
              始于1998年 · 上海市重点中学
            </span>
          </div>

          {/* Main title */}
          <h1 className="text-white font-serif font-bold text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 animate-fade-up" style={{ animationDelay: "0.15s" }}>
            以信息之光
            <br />
            <span className="text-gold-300">照亮未来之路</span>
          </h1>

          {/* Description */}
          <p className="text-white/75 text-lg md:text-xl leading-relaxed mb-10 max-w-lg animate-fade-up" style={{ animationDelay: "0.3s" }}>
            上海市莘松中学——以信息技术教育见长，培养具有创新精神和国际视野的未来人才。三校区协同发展，共建卓越教育生态。
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.45s" }}>
            <a
              href="#about"
              className="group inline-flex items-center gap-3 px-7 py-4 bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-xl hover:shadow-gold-500/25"
            >
              了解莘松
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#news"
              className="group inline-flex items-center gap-3 px-7 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold rounded-lg border border-white/25 transition-all duration-300"
            >
              <Play className="w-4 h-4" />
              校园动态
            </a>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-warm-white to-transparent" />

      {/* Stats bar */}
      <div className="absolute bottom-12 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { number: "25+", label: "办学历史(年)" },
              { number: "3", label: "校区" },
              { number: "3000+", label: "在校学生" },
              { number: "200+", label: "教职员工" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center md:text-left p-4 bg-white/8 backdrop-blur-md rounded-xl border border-white/10"
              >
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {stat.number}
                </div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
