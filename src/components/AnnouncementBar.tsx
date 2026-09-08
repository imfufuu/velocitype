import { Megaphone, ExternalLink } from "lucide-react";

const ANNOUNCEMENTS = [
  { date: "2026-09-05", text: "2026学年第一学期开学典礼通知", tag: "重要" },
  { date: "2026-09-03", text: "关于2026年教师节表彰活动的通知", tag: "通知" },
  { date: "2026-09-01", text: "新学期课程安排及作息时间调整公告", tag: "公告" },
  { date: "2026-08-28", text: "2026学年第一学期教材发放通知", tag: "通知" },
  { date: "2026-08-25", text: "暑期社会实践活动优秀成果评选公示", tag: "公示" },
  { date: "2026-08-20", text: "关于校园安全演练的通知", tag: "重要" },
];

const TAG_COLORS: Record<string, string> = {
  "重要": "bg-red-50 text-red-600 border-red-100",
  "通知": "bg-blue-50 text-blue-600 border-blue-100",
  "公告": "bg-amber-50 text-amber-600 border-amber-100",
  "公示": "bg-green-50 text-green-600 border-green-100",
};

export default function AnnouncementBar() {
  return (
    <section className="relative bg-white border-b border-navy-100/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-6 py-5">
          {/* Icon + Label */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-navy-900 rounded-lg flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <span className="text-navy-900 font-bold text-sm">通知公告</span>
              <p className="text-text-muted text-xs">NOTICE BOARD</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-10 bg-navy-100" />

          {/* Scrolling announcements */}
          <div className="flex-1 overflow-hidden relative">
            <div className="flex gap-12 marquee-track">
              {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((item, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex items-center gap-3 shrink-0 group"
                >
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${TAG_COLORS[item.tag] || ""}`}>
                    {item.tag}
                  </span>
                  <span className="text-text-secondary text-sm group-hover:text-navy-900 transition-colors whitespace-nowrap">
                    {item.text}
                  </span>
                  <span className="text-text-muted text-xs">{item.date}</span>
                </a>
              ))}
            </div>
          </div>

          {/* More link */}
          <a
            href="#"
            className="hidden md:flex items-center gap-1.5 text-navy-700 hover:text-gold-600 text-sm font-medium transition-colors shrink-0"
          >
            更多
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
