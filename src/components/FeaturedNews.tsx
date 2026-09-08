import { Calendar, ArrowUpRight, Clock } from "lucide-react";

const FEATURED = {
  title: "莘松中学在2026年全国青少年科技创新大赛中荣获金奖",
  desc: "我校三支代表队在第28届全国青少年科技创新大赛中表现卓越，分别获得一等奖两项、二等奖一项。这是我校连续第五年在该赛事中取得优异成绩，充分展示了学校在科技创新教育方面的深厚积淀。",
  date: "2026-09-06",
  category: "喜报",
};

const NEWS_ITEMS = [
  {
    title: "新学期校长寄语：激发潜能，拥抱变化",
    desc: "张忆校长在2026学年第一学期开学典礼上发表致辞，勉励全体师生以开放的心态迎接新学期的挑战与机遇。",
    date: "2026-09-05",
    category: "校园新闻",
    img: "./images/library.jpg",
  },
  {
    title: "智慧课堂2.0项目正式启动",
    desc: "我校与华东师范大学合作推出智慧课堂2.0项目，引入AI辅助教学系统，打造个性化学习体验。",
    date: "2026-09-03",
    category: "教学动态",
    img: "./images/activities.jpg",
  },
  {
    title: "春申校区实验室全面升级改造完成",
    desc: "投资800万元的现代化实验室改造工程圆满完成，新增物理、化学、生物各两间标准化实验室。",
    date: "2026-09-01",
    category: "校区建设",
    img: "./images/lab.jpg",
  },
];

const SIDE_NEWS = [
  { title: "2026年闵行区中学生辩论赛在我校成功举办", date: "08-30" },
  { title: "我校教师团队获上海市教学成果一等奖", date: "08-28" },
  { title: "水清校区运动会圆满落幕", date: "08-25" },
  { title: "莘松学子在全国英语演讲比赛中斩获佳绩", date: "08-22" },
  { title: "暑期教师培训圆满结束", date: "08-20" },
  { title: "校男子篮球队获得市级比赛亚军", date: "08-18" },
];

export default function FeaturedNews() {
  return (
    <section id="news" className="py-20 md:py-28 bg-warm-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="flex items-end justify-between mb-14">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1.5 h-8 bg-gold-500 rounded-full" />
              <span className="text-gold-600 font-medium text-sm tracking-wider uppercase">
                News & Events
              </span>
            </div>
            <h2 className="text-navy-900 font-serif font-bold text-3xl md:text-4xl">
              新闻动态
            </h2>
            <div className="section-divider" />
          </div>
          <a href="#" className="hidden md:flex items-center gap-2 text-navy-700 hover:text-gold-600 font-medium text-sm transition-colors group">
            查看全部新闻
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Featured article */}
          <div className="lg:col-span-5">
            <div className="relative h-full bg-navy-900 rounded-2xl overflow-hidden group card-hover">
              <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-900">
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-5">
                  <svg width="100%" height="100%">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
              </div>
              <div className="relative z-10 p-8 md:p-10 flex flex-col h-full min-h-[400px] justify-end">
                <div className="absolute top-8 left-8">
                  <span className="px-3 py-1.5 bg-gold-500 text-navy-900 text-xs font-bold rounded-full">
                    {FEATURED.category}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{FEATURED.date}</span>
                  </div>
                  <h3 className="text-white font-serif font-bold text-2xl md:text-3xl leading-snug mb-4 group-hover:text-gold-300 transition-colors">
                    {FEATURED.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed text-sm md:text-base line-clamp-3">
                    {FEATURED.desc}
                  </p>
                  <div className="mt-6">
                    <span className="inline-flex items-center gap-2 text-gold-400 font-medium text-sm group-hover:gap-3 transition-all cursor-pointer">
                      阅读全文
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* News cards */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {NEWS_ITEMS.map((item, i) => (
              <a
                key={i}
                href="#"
                className="group flex gap-4 p-4 rounded-xl hover:bg-white hover:shadow-lg hover:shadow-navy-900/5 transition-all duration-300"
              >
                <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-navy-500 text-xs font-medium">{item.category}</span>
                  <h4 className="text-navy-900 font-semibold text-sm leading-snug mt-1 mb-2 group-hover:text-navy-700 line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-text-muted text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{item.date}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Side list */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-6 border border-navy-100/50 h-full">
              <h4 className="font-bold text-navy-900 text-base mb-5 flex items-center gap-2">
                <div className="w-2 h-2 bg-gold-500 rounded-full" />
                最新动态
              </h4>
              <div className="space-y-0">
                {SIDE_NEWS.map((item, i) => (
                  <a
                    key={i}
                    href="#"
                    className="group flex items-start gap-3 py-3.5 border-b border-navy-50 last:border-0"
                  >
                    <span className="text-navy-300 text-xs font-mono mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-secondary text-sm leading-snug group-hover:text-navy-900 transition-colors line-clamp-2">
                        {item.title}
                      </p>
                      <span className="text-text-muted text-xs mt-1">{item.date}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
