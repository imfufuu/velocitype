import { MapPin, Phone } from "lucide-react";

const CAMPUSES = [
  {
    name: "莘松校区",
    subtitle: "XINSONG CAMPUS",
    address: "上海市闵行区莘沥路480号",
    phone: "021-64923530",
    description: "主校区，承载学校行政中心与核心教学资源。拥有标准化运动场、现代化图书馆、多功能报告厅及各类专业实验室。",
    features: ["行政中心", "标准运动场", "现代图书馆"],
    img: "./images/campus-hero.jpg",
  },
  {
    name: "春申校区",
    subtitle: "CHUNSHEN CAMPUS",
    address: "上海市闵行区伟业路229号",
    phone: "021-54373591",
    description: "以科技创新教育为特色，配备全新升级的智慧教室和STEM创客空间，是学校科技教育的重要基地。",
    features: ["STEM中心", "智慧教室", "创客空间"],
    img: "./images/lab.jpg",
  },
  {
    name: "水清校区",
    subtitle: "SHUIQING CAMPUS",
    address: "上海市闵行区水清路769号",
    phone: "021-54430100",
    description: "以艺术教育为亮点，配备专业音乐厅、美术工作室、舞蹈房和书法教室，为学生提供多元化的艺术发展平台。",
    features: ["艺术中心", "音乐厅", "书法教室"],
    img: "./images/activities.jpg",
  },
];

export default function Campuses() {
  return (
    <section id="campuses" className="py-20 md:py-28 bg-warm-gray">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-px bg-gold-400" />
            <span className="text-gold-600 font-medium text-sm tracking-wider uppercase">
              Our Campuses
            </span>
            <div className="w-8 h-px bg-gold-400" />
          </div>
          <h2 className="text-navy-900 font-serif font-bold text-3xl md:text-4xl mb-4">
            三校区 · 共卓越
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            一校三区，各有特色，协同发展，共同构建莘松教育生态圈
          </p>
        </div>

        {/* Campus cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CAMPUSES.map((campus, i) => (
            <div
              key={campus.name}
              className="group bg-white rounded-2xl overflow-hidden border border-navy-100/50 card-hover"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={campus.img}
                  alt={campus.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-navy-900/20 to-transparent" />
                <div className="absolute bottom-4 left-5">
                  <div className="text-white/60 text-[10px] tracking-widest uppercase mb-1">
                    {campus.subtitle}
                  </div>
                  <h3 className="text-white font-serif font-bold text-xl">
                    {campus.name}
                  </h3>
                </div>
                {/* Number badge */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white text-sm font-bold border border-white/30">
                  {String(i + 1).padStart(2, "0")}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  {campus.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {campus.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2.5 py-1 bg-navy-50 text-navy-600 rounded-md text-xs font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Contact */}
                <div className="pt-4 border-t border-navy-50 space-y-2.5">
                  <div className="flex items-center gap-2 text-text-muted text-xs">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{campus.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted text-xs">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{campus.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
