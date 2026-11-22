// 工具：烟雾弹 / EMP / 硬币。都有代价——每局有限次数，用完不补。
import { CFG } from './config.js';

export class Tools {
  constructor() {
    this.smokeLeft = CFG.smokeCount;
    this.empLeft = CFG.empCount;
    this.coinsLeft = CFG.coinCount;
    this.smokeUntil = 0; // 游戏时间（秒），0 表示未生效
    this.empUntil = 0;
    this.coin = null; // {x, y, tx, ty, t} 飞行中的硬币
    this.coinPing = null; // {x, y, until} 落点声响圈
    this.smokePuffs = []; // {x, y, until} 烟雾团
    this.time = 0;
  }

  reset() {
    this.smokeLeft = CFG.smokeCount;
    this.empLeft = CFG.empCount;
    this.coinsLeft = CFG.coinCount;
    this.smokeUntil = 0;
    this.empUntil = 0;
    this.coin = null;
    this.coinPing = null;
    this.smokePuffs = [];
    this.time = 0;
  }

  get smokeActive() {
    return this.time < this.smokeUntil;
  }

  get empActive() {
    return this.time < this.empUntil;
  }

  get smokeLeftSecs() {
    return Math.max(0, this.smokeUntil - this.time);
  }

  get empLeftSecs() {
    return Math.max(0, this.empUntil - this.time);
  }

  useSmoke(player) {
    if (this.smokeLeft <= 0 || this.smokeActive) return false;
    this.smokeLeft -= 1;
    this.smokeUntil = this.time + CFG.smokeSecs;
    // 在玩家周围生成一团烟雾
    this.smokePuffs = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const r = 12 + Math.random() * 34;
      this.smokePuffs.push({
        x: player.x + Math.cos(a) * r,
        y: player.y + Math.sin(a) * r,
        r: 22 + Math.random() * 14,
        until: this.smokeUntil,
      });
    }
    return true;
  }

  useEmp() {
    if (this.empLeft <= 0 || this.empActive) return false;
    this.empLeft -= 1;
    this.empUntil = this.time + CFG.empSecs;
    return true;
  }

  throwCoin(player, tx, ty) {
    if (this.coinsLeft <= 0 || this.coin) return false;
    this.coinsLeft -= 1;
    this.coin = { sx: player.x, sy: player.y, tx, ty, t: 0, x: player.x, y: player.y };
    return true;
  }

  update(dt, guards) {
    this.time += dt;
    if (this.coin) {
      this.coin.t += dt / CFG.coinFlight;
      const k = Math.min(1, this.coin.t);
      // 直线飞行 + 抛物线高度（高度只影响绘制，见 render.js）
      this.coin.x = this.coin.sx + (this.coin.tx - this.coin.sx) * k;
      this.coin.y = this.coin.sy + (this.coin.ty - this.coin.sy) * k;
      this.coin.lift = Math.sin(k * Math.PI) * 26;
      if (k >= 1) {
        this.coinPing = { x: this.coin.tx, y: this.coin.ty, until: this.time + 1.6 };
        // 最近的守卫走过去查看
        let best = null;
        let bestD = Infinity;
        for (const g of guards) {
          const d = Math.hypot(g.x - this.coin.tx, g.y - this.coin.ty);
          if (d < CFG.coinLureRange && d < bestD) {
            bestD = d;
            best = g;
          }
        }
        if (best) best.lureTo(this.coin.tx, this.coin.ty);
        this.coin = null;
      }
    }
  }
}
