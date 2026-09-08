import { BookOpen, FileText, Calendar, ExternalLink, Users, GraduationCap, BarChart3 } from "lucide-react";

const QUICK_LINKS = [
  { icon: Calendar, label: "阳光课表", desc: "各校区课程安排", color: "bg-blue-50 text-blue-600" },
  { icon: FileText, label: "信息公开", desc: "学校政策与文件", color: "bg-green-50 text-green-600" },
  { icon: GraduationCap, label: "招生信息", desc: "入学政策与流程", color: "bg-purple-50 text-purple-600" },
  { icon: Users, label: "教师风采", desc: "优秀师资团队", color: "bg-amber-50 text-amber-600" },
  { icon: BookOpen, label: "校本课程", desc: "特色课程体系", color: "bg-rose-50 text-rose-600" },
  { icon: BarChart3, label: "学业质量", desc: "教学成果展示", color: "bg-cyan-50 text-cyan-600" },
];

const WEEKLY_SCHEDULE = [
  { day: "周一", event: "升旗仪式 / 行政例会", time: "07:30" },
  { day: "周二", event: "教研组活动", time: "14:00" },
  { day: "周三", event: "社团活动日", time: "15:30" },
  { day: "周四", event: "教师培训", time: "13:30" },
  { day: "周五", event: "班会 / 主题教育", time: "14:00" },
];

export default function QuickLinks() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Quick links grid */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1.5 h-8 bg-gold-500 rounded-full" />
              <span className="text-gold-600 font-medium text-sm tracking-wider uppercase">
                Quick Access
              </span>
            </div>
            <h2 className="text-navy-900 font-serif font-bold text-3xl mb-10">
              快捷入口
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {QUICK_LINKS.map((link) => (
                <a
                  key={link.label}
                  href="#"
                  className="group p-5 rounded-xl border border-navy-100/50 hover:border-navy-200 hover:bg-white hover:shadow-lg hover:shadow-navy-900/5 transition-all duration-300"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${link.color} transition-transform group-hover:scale-110`}>
                    <link.icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-navy-900 font-semibold text-sm mb-1">
                    {link.label}
                  </h4>
                  <p className="text-text-muted text-xs">{link.desc}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Weekly schedule sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-7 text-white sticky top-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gold-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">本周安排</h3>
                  <p className="text-white/50 text-xs">Weekly Schedule</p>
                </div>
              </div>

              <div className="space-y-0">
                {WEEKLY_SCHEDULE.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 py-3.5 border-b border-white/10 last:border-0 group"
                  >
                    <div className="w-12 shrink-0 text-center">
                      <span className="text-gold-400 font-bold text-sm">{item.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm group-hover:text-white transition-colors truncate">
                        {item.event}
                      </p>
                    </div>
                    <span className="text-white/40 text-xs font-mono shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>

              <a
                href="#"
                className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-medium transition-colors"
              >
                查看完整课表
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
