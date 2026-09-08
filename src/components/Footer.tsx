import { MapPin, Phone, Mail, Clock, ExternalLink } from "lucide-react";

const CAMPUS_FOOTER = [
  {
    name: "莘松校区",
    address: "上海市闵行区莘沥路480号",
    postal: "201100",
    principal: "64881049",
    general: "64923530",
  },
  {
    name: "春申校区",
    address: "上海市闵行区伟业路229号",
    postal: "201100",
    principal: "54373592",
    general: "54373591",
  },
  {
    name: "水清校区",
    address: "上海市闵行区水清路769号",
    postal: "201100",
    principal: "54430086",
    general: "54430100",
  },
];

const QUICK_LINKS_FOOTER = [
  "学校概况", "新闻动态", "信息公开", "招生信息",
  "党建园地", "教师发展", "学生天地", "家长学校",
];

const FRIEND_LINKS = [
  { name: "上海市教育委员会", url: "#" },
  { name: "闵行区教育局", url: "#" },
  { name: "上海市教育考试院", url: "#" },
  { name: "中国教育在线", url: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                <span className="text-gold-400 font-serif font-bold text-lg">莘</span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-xl">莘松中学</h3>
                <p className="text-white/40 text-xs tracking-widest">XINSONG MIDDLE SCHOOL</p>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              以信息技术教育见长，培养具有创新精神和国际视野的未来人才。让每一个生命精彩绽放。
            </p>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Mail className="w-4 h-4" />
              <span>mxszx001@163.com</span>
            </div>
          </div>

          {/* Campus info */}
          <div className="lg:col-span-5">
            <h4 className="font-bold text-sm mb-5 text-white/80 tracking-wider uppercase">
              校区信息
            </h4>
            <div className="space-y-4">
              {CAMPUS_FOOTER.map((campus) => (
                <div key={campus.name} className="pb-4 border-b border-white/10 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-1.5 h-1.5 bg-gold-400 rounded-full" />
                    <span className="font-semibold text-sm">{campus.name}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-white/40 text-xs pl-3.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{campus.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span>校长室: {campus.principal}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>总机: {campus.general}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-3">
            <h4 className="font-bold text-sm mb-5 text-white/80 tracking-wider uppercase">
              快速导航
            </h4>
            <div className="grid grid-cols-2 gap-y-2.5">
              {QUICK_LINKS_FOOTER.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-white/40 hover:text-gold-400 text-sm transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/30 text-xs">
            <div className="flex items-center gap-2">
              <span>Copyright © 2002-2026 上海市莘松中学 版权所有</span>
              <span className="hidden md:inline">|</span>
              <span className="hidden md:inline">网站起始于2002年4月</span>
            </div>
            <div className="flex items-center gap-4">
              <span>沪公网安备 31011202007261号</span>
              <span>|</span>
              <span>沪ICP备XXXXXXXX号</span>
            </div>
          </div>
        </div>
      </div>

      {/* Friend links */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-4 text-white/20 text-xs">
            <span className="shrink-0">友情链接：</span>
            {FRIEND_LINKS.map((link) => (
              <a key={link.name} href={link.url} className="hover:text-white/50 transition-colors flex items-center gap-1">
                {link.name}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
