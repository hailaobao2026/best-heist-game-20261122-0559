// 午夜金库 — 房间布局与几何判定（视线遮挡、碰撞都在这里）。
// 房间是一整屏：入口左下、出口右下、星蓝宝石在中央展台。

export function buildLevel() {
  // 外墙（四段矩形，留出上下左右的墙体厚度）
  const walls = [
    { x: 10, y: 74, w: 1260, h: 10, kind: 'wall' }, // 顶墙
    { x: 10, y: 700, w: 1260, h: 10, kind: 'wall' }, // 底墙
    { x: 10, y: 74, w: 10, h: 636, kind: 'wall' }, // 左墙
    { x: 1260, y: 74, w: 10, h: 636, kind: 'wall' }, // 右墙
  ];

  // 掩体：展柜 / 立柱 / 花坛。既挡移动，也挡视线（视锥会被它们截断）。
  const covers = [
    { x: 240, y: 170, w: 140, h: 64, kind: 'case', label: '展柜' },
    { x: 900, y: 170, w: 140, h: 64, kind: 'case', label: '展柜' },
    { x: 240, y: 470, w: 140, h: 64, kind: 'case', label: '展柜' },
    { x: 900, y: 470, w: 140, h: 64, kind: 'case', label: '展柜' },
    { x: 470, y: 330, w: 40, h: 40, kind: 'pillar', label: '立柱' },
    { x: 770, y: 330, w: 40, h: 40, kind: 'pillar', label: '立柱' },
    { x: 620, y: 556, w: 40, h: 40, kind: 'pillar', label: '立柱' },
    { x: 1128, y: 300, w: 48, h: 48, kind: 'planter', label: '花坛' },
    { x: 104, y: 300, w: 48, h: 48, kind: 'planter', label: '花坛' },
  ];

  // 中央展台（星蓝宝石放在上面）
  const pedestal = { x: 600, y: 300, w: 80, h: 56, kind: 'pedestal' };

  // 小战利品：金条 / 现金 / 古董花瓶，各放在一个展柜上
  const lootSpots = [
    { id: 'gold', x: 310, y: 202, value: 150, name: '金条', taken: false },
    { id: 'cash', x: 970, y: 202, value: 100, name: '一叠现金', taken: false },
    { id: 'vase', x: 310, y: 502, value: 120, name: '古董花瓶', taken: false },
  ];

  return {
    bounds: { x: 20, y: 84, w: 1240, h: 616 }, // 玩家活动范围（墙内）
    walls,
    covers,
    pedestal,
    sapphire: { x: 640, y: 300, value: 500, name: '星蓝宝石', taken: false },
    lootSpots,
    entrance: { x: 110, y: 640, w: 90, h: 56, label: '入口' },
    exitZone: { x: 1080, y: 640, w: 90, h: 56, label: '出口 EXIT' },
    playerSpawn: { x: 155, y: 668 },
    guardRoutes: [
      {
        name: '大刘',
        waypoints: [
          { x: 300, y: 400 },
          { x: 980, y: 400 },
        ],
      },
      {
        name: '小陈',
        waypoints: [
          { x: 1090, y: 200 },
          { x: 1090, y: 560 },
        ],
      },
    ],
    cameraMounts: [
      { x: 430, y: 86, baseAngle: Math.PI / 2, phase: 0 }, // 顶墙，向下扫
      { x: 850, y: 86, baseAngle: Math.PI / 2, phase: 1.6 }, // 顶墙，向下扫（错开相位）
    ],
  };
}

// 全部会挡视线的矩形：外墙 + 掩体 + 展台。
export function losBlockers(level) {
  return [...level.walls, ...level.covers, level.pedestal];
}

// 线段 (x1,y1)-(x2,y2) 是否被任一矩形挡住（碰到即挡住）。
export function segmentBlocked(x1, y1, x2, y2, rects) {
  for (const r of rects) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return true;
  }
  return false;
}

// Liang-Barsky 裁剪：线段是否穿过矩形。
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

// 沿射线 (ox,oy) 方向 angle 的最近遮挡距离；无遮挡返回 maxDist。
export function rayDistance(ox, oy, angle, maxDist, rects) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = maxDist;
  for (const r of rects) {
    const t = rayHitsRect(ox, oy, dx, dy, r);
    if (t !== null && t < best) best = t;
  }
  return best;
}

function rayHitsRect(ox, oy, dx, dy, r) {
  let tmin = 0;
  let tmax = Infinity;
  if (dx === 0) {
    if (ox < r.x || ox > r.x + r.w) return null;
  } else {
    let t1 = (r.x - ox) / dx;
    let t2 = (r.x + r.w - ox) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (dy === 0) {
    if (oy < r.y || oy > r.y + r.h) return null;
  } else {
    let t1 = (r.y - oy) / dy;
    let t2 = (r.y + r.h - oy) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

// 圆形（玩家/守卫）与矩形的碰撞解算：把圆推出矩形，返回修正后的位置。
export function resolveCircleRect(px, py, radius, rects) {
  let x = px;
  let y = py;
  for (const r of rects) {
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    const ddx = x - cx;
    const ddy = y - cy;
    const d2 = ddx * ddx + ddy * ddy;
    if (d2 < radius * radius) {
      if (d2 === 0) {
        // 圆心落在矩形内：沿最短边推出
        const left = x - r.x;
        const right = r.x + r.w - x;
        const top = y - r.y;
        const bottom = r.y + r.h - y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) x = r.x - radius;
        else if (m === right) x = r.x + r.w + radius;
        else if (m === top) y = r.y - radius;
        else y = r.y + r.h + radius;
      } else {
        const d = Math.sqrt(d2);
        x = cx + (ddx / d) * radius;
        y = cy + (ddy / d) * radius;
      }
    }
  }
  return { x, y };
}

// 点是否在矩形内。
export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
