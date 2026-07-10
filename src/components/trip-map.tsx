import { getT } from "@/lib/locale";
import { getReceptionsForView } from "@/lib/database-data";
import { MapPinned } from "lucide-react";
import {
  DOT_COLS,
  DOT_ROWS,
  LAT_MAX,
  LAT_MIN,
  LON_MAX,
  LON_MIN,
  WORLD_DOTS,
} from "@/components/world-dots";

// 出差足迹 · 夜光世界地图：真实世界海岸线点阵（world.geo.json 栅格化生成），
// 去过的城市炫彩点亮 + 双色脉冲，北京出发的航线带彗星动画。
// 面板始终深色星空风，不随皮肤变化。
const CITIES: { name: string; alias: string[]; lon: number; lat: number; home?: boolean }[] = [
  { name: "北京", alias: ["北京", "Beijing"], lon: 116.4, lat: 39.9, home: true },
  { name: "合肥", alias: ["合肥", "Hefei"], lon: 117.2, lat: 31.8 },
  { name: "上海", alias: ["上海", "Shanghai"], lon: 121.5, lat: 31.2 },
  { name: "兰州", alias: ["兰州", "Lanzhou"], lon: 103.8, lat: 36.1 },
  { name: "成都", alias: ["成都", "Chengdu"], lon: 104.1, lat: 30.7 },
  { name: "广州", alias: ["广州", "Guangzhou"], lon: 113.3, lat: 23.1 },
  { name: "香港", alias: ["香港", "Hong Kong"], lon: 114.2, lat: 22.3 },
  { name: "澳门", alias: ["澳门", "Macau", "Macao"], lon: 113.5, lat: 22.15 },
  { name: "河内", alias: ["河内", "越南", "Hanoi"], lon: 105.8, lat: 21.0 },
  { name: "曼谷", alias: ["曼谷", "Bangkok"], lon: 100.5, lat: 13.75 },
  { name: "吉隆坡", alias: ["吉隆坡", "Kuala Lumpur", "马来西亚"], lon: 101.7, lat: 3.1 },
  { name: "新加坡", alias: ["新加坡", "Singapore"], lon: 103.8, lat: 1.35 },
  { name: "东京", alias: ["东京", "Tokyo", "日本"], lon: 139.7, lat: 35.7 },
  { name: "迪拜", alias: ["迪拜", "Dubai"], lon: 55.3, lat: 25.2 },
  { name: "伦敦", alias: ["伦敦", "London"], lon: -0.1, lat: 51.5 },
  { name: "巴黎", alias: ["巴黎", "Paris"], lon: 2.35, lat: 48.85 },
  { name: "纽约", alias: ["纽约", "New York"], lon: -74.0, lat: 40.7 },
  { name: "旧金山", alias: ["旧金山", "San Francisco"], lon: -122.4, lat: 37.8 },
  { name: "悉尼", alias: ["悉尼", "Sydney"], lon: 151.2, lat: -33.9 },
];

// 点阵网格 → 画布坐标（与 gen-dots.js 的网格一一对应）
const CELL_X = 6;
const CELL_Y = 6.9;
const PAD = 4;
const W = (DOT_COLS - 1) * CELL_X + PAD * 2;
const H = (DOT_ROWS - 1) * CELL_Y + PAD * 2 + 10;

function project(lon: number, lat: number) {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (DOT_COLS - 1) * CELL_X + PAD;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (DOT_ROWS - 1) * CELL_Y + PAD;
  return { x, y };
}

export async function TripMap() {
  const [{ t }, receptions] = await Promise.all([
    getT(),
    getReceptionsForView(),
  ]);
  const today = new Date().toISOString().slice(0, 10);

  const status = new Map<string, "visited" | "planned">();
  for (const city of CITIES) {
    if (city.home) status.set(city.name, "visited");
  }
  for (const reception of receptions) {
    if (reception.status === "CANCELLED") continue;
    // 只按“地点”匹配：接待澳门客人不等于去过澳门；没填地点才退回标题
    const haystack = reception.location || reception.title;
    const started =
      reception.status === "DONE" ||
      (reception.startAt && reception.startAt.slice(0, 10) <= today);
    for (const city of CITIES) {
      if (!city.alias.some((alias) => haystack.includes(alias))) continue;
      const prev = status.get(city.name);
      if (started) {
        status.set(city.name, "visited");
      } else if (prev !== "visited") {
        status.set(city.name, "planned");
      }
    }
  }

  const visited = CITIES.filter((c) => status.get(c.name) === "visited");
  const planned = CITIES.filter((c) => status.get(c.name) === "planned");
  const home = CITIES.find((c) => c.home)!;
  const homePt = project(home.lon, home.lat);

  // 航线（北京 → 去过的城市），带控制点抬升的弧线
  const arcs = visited
    .filter((c) => !c.home)
    .map((city) => {
      const pt = project(city.lon, city.lat);
      const mx = (homePt.x + pt.x) / 2;
      const my = Math.min(homePt.y, pt.y) - Math.max(26, Math.abs(homePt.x - pt.x) * 0.18);
      return {
        name: city.name,
        d: `M ${homePt.x.toFixed(1)} ${homePt.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
      };
    });

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#1b2450] bg-[#070c22] shadow-lg">
      {/* 背景光斑 */}
      <div className="hero-blob pointer-events-none absolute -left-24 -top-32 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
      <div className="hero-blob pointer-events-none absolute -right-16 top-10 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl [animation-delay:-4s]" />
      <div className="hero-blob pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl [animation-delay:-8s]" />

      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3.5">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <MapPinned className="h-4 w-4 text-cyan-300" />
            {t.tripMap.title}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{t.tripMap.hint}</p>
        </div>
        <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
          ✨ {t.tripMap.lit(visited.length)}
        </span>
      </div>

      <div className="relative overflow-x-auto p-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label={t.tripMap.title}
        >
          <defs>
            <radialGradient id="cityGlowA" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="45%" stopColor="#818cf8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#e879f9" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cityGlowB" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#fb7185" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>

          {/* 世界陆地点阵：色相随经度流转 */}
          {Array.from({ length: WORLD_DOTS.length / 2 }, (_, i) => {
            const ci = WORLD_DOTS[i * 2];
            const ri = WORLD_DOTS[i * 2 + 1];
            const x = ci * CELL_X + PAD;
            const y = ri * CELL_Y + PAD;
            const hue = 175 + (ci / DOT_COLS) * 150;
            const twinkle = i % 37 === 0;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={1.7}
                fill={`hsl(${hue.toFixed(0)} 90% 66%)`}
                opacity={twinkle ? 0.85 : 0.3}
                className={twinkle ? "dot-twinkle" : undefined}
                style={twinkle ? { animationDelay: `${(i % 11) * 0.6}s` } : undefined}
              />
            );
          })}

          {/* 航线 + 彗星 */}
          {arcs.map((arc, idx) => (
            <g key={arc.name}>
              <path
                d={arc.d}
                fill="none"
                stroke="url(#arcGrad)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray="6 7"
                className="arc-flow"
                opacity="0.8"
              />
              <circle r="2.6" fill="#ffffff">
                <animateMotion
                  dur={`${3 + idx * 0.9}s`}
                  repeatCount="indefinite"
                  path={arc.d}
                />
              </circle>
              <circle r="5" fill="url(#cityGlowA)" opacity="0.8">
                <animateMotion
                  dur={`${3 + idx * 0.9}s`}
                  repeatCount="indefinite"
                  path={arc.d}
                />
              </circle>
            </g>
          ))}

          {/* 城市 */}
          {CITIES.map((city, idx) => {
            const pt = project(city.lon, city.lat);
            const state = status.get(city.name);
            const isVisited = state === "visited";
            const isPlanned = state === "planned";
            if (!isVisited && !isPlanned) return null;
            const glow = idx % 2 === 0 ? "url(#cityGlowA)" : "url(#cityGlowB)";
            return (
              <g key={city.name}>
                {isVisited ? (
                  <>
                    <circle cx={pt.x} cy={pt.y} r="16" fill={glow} className="map-pulse" />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="7"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1.4"
                      className="ring-pulse"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="7"
                      fill="none"
                      stroke="#f472b6"
                      strokeWidth="1.4"
                      className="ring-pulse"
                      style={{ animationDelay: "1.1s" }}
                    />
                    <circle cx={pt.x} cy={pt.y} r="3" fill="#ffffff" />
                  </>
                ) : (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5.5"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.6"
                    strokeDasharray="3 3"
                    className="ring-pulse"
                  />
                )}
                <text
                  x={pt.x}
                  y={pt.y - 11}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontWeight={isVisited ? 600 : 400}
                  fill={isVisited ? "#f0f9ff" : "#fcd34d"}
                  stroke="#070c22"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {city.name}
                  {city.home ? `（${t.tripMap.home}）` : ""}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="relative flex flex-wrap items-center gap-2 border-t border-white/10 px-5 py-2.5 text-xs">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
          {t.tripMap.lit(visited.length)}
        </span>
        {planned.map((city) => (
          <span
            key={city.name}
            className="rounded-full border border-amber-300/40 bg-amber-400/10 px-2.5 py-0.5 text-amber-200"
          >
            {city.name} · {t.statuses.reception.PLANNED}
          </span>
        ))}
      </div>
    </div>
  );
}
