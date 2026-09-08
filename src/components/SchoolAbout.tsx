import { useEffect, useRef, useState } from "react";
import { Award, Users, Trophy, GraduationCap, Sparkles } from "lucide-react";

const STATS = [
  { icon: Award, number: 25, suffix: "+", label: "办学年份", description: "年" },
  { icon: Users, number: 3000, suffix: "+", label: "在校学生", description: "人" },
  { icon: GraduationCap, number: 98, suffix: "%", label: "升学率", description: "" },
  { icon: Trophy, number: 150, suffix: "+", label: "竞赛获奖", description: "项/年" },
];

const PRINCIPAL_QUOTE = "教育的本质是激发，是引导，是唤醒。让每一个孩子在莘松发现自我、成就未来。";

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="stat-number">
      {count.toLocaleString()}{suffix}
    </div>
  );
}

export default function SchoolAbout() {
  return (
    <section id="about" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-px bg-gold-400" />
            <span className="text-gold-600 font-medium text-sm tracking-wider uppercase">
              About Xinsong
            </span>
            <div className="w-8 h-px bg-gold-400" />
          </div>
          <h2 className="text-navy-900 font-serif font-bold text-3xl md:text-4xl mb-4">
            学校概况
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed">
            上海市莘松中学创建于1998年，是闵行区一所以信息技术教育见长的现代化公办初级中学。学校秉持"让每一个生命精彩绽放"的办学理念，致力于培养具有家国情怀和国际视野的新时代少年。
          </p>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left - Image composition */}
          <div className="relative">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl shadow-navy-900/20">
              <img
                src="./images/library.jpg"
                alt="莘松中学图书馆"
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/40 to-transparent" />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -right-6 md:right-8 z-20 bg-white rounded-xl p-5 shadow-xl shadow-navy-900/10 border border-navy-50 max-w-[240px]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-navy-900 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <div className="text-navy-900 font-bold text-sm">校长寄语</div>
                  <div className="text-text-muted text-xs">张忆校长</div>
                </div>
              </div>
              <p className="text-text-secondary text-xs leading-relaxed italic">
                "{PRINCIPAL_QUOTE}"
              </p>
            </div>
            {/* Decorative element */}
            <div className="absolute -top-4 -left-4 w-32 h-32 bg-gold-100 rounded-2xl -z-0" />
          </div>

          {/* Right - Content */}
          <div className="lg:pl-8">
            <h3 className="text-navy-900 font-serif font-bold text-2xl mb-6">
              追求卓越，立德树人
            </h3>
            <div className="space-y-5 text-text-secondary leading-relaxed">
              <p>
                学校现有莘松、春申、水清三个校区，占地面积共计60余亩。学校拥有一支高素质专业化的教师队伍，其中特级教师2人、高级教师38人、区学科带头人15人。
              </p>
              <p>
                多年来，学校以信息技术教育为特色，以科技创新教育为突破口，构建了完善的校本课程体系。在各类学科竞赛、体育比赛、艺术展演中屡获佳绩，教育教学质量始终位居闵行区前列。
              </p>
              <p>
                学校先后获得"全国青少年科技创新大赛优秀基层组织""上海市文明校园""上海市科技教育特色学校""闵行区教育信息化应用标杆培育校"等荣誉称号。
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {["科技教育特色", "信息化标杆校", "文明校园", "体育传统校"].map((tag) => (
                <span key={tag} className="px-4 py-2 bg-navy-50 text-navy-700 rounded-full text-sm font-medium border border-navy-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="relative group p-6 md:p-8 bg-gradient-to-br from-navy-50 to-white rounded-2xl border border-navy-100/50 text-center hover:shadow-lg hover:shadow-navy-900/5 transition-all duration-300"
            >
              <div className="w-12 h-12 mx-auto mb-4 bg-navy-900/5 rounded-xl flex items-center justify-center group-hover:bg-navy-900 group-hover:scale-110 transition-all duration-300">
                <stat.icon className="w-6 h-6 text-navy-700 group-hover:text-gold-400 transition-colors" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-navy-900 mb-1">
                <AnimatedCounter target={stat.number} suffix={stat.suffix} />
              </div>
              <div className="text-text-muted text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
