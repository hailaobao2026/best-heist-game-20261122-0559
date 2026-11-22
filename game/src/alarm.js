// 报警条：被视锥照到上涨（站立快、潜行慢），躲开后缓慢回落；满 100 即被抓。
import { CFG } from './config.js';

export class Alarm {
  constructor() {
    this.value = 0;
    this.maxSeen = 0;
    this.tripped = false;
  }

  reset() {
    this.value = 0;
    this.maxSeen = 0;
    this.tripped = false;
  }

  // guardSeen / camSeen：本帧是否被守卫 / 摄像头照到；sneaking 是否潜行。
  update(dt, guardSeen, camSeen, sneaking) {
    let rate = 0;
    if (guardSeen) rate = sneaking ? CFG.alarmGuardSneak : CFG.alarmGuardStand;
    else if (camSeen) rate = sneaking ? CFG.alarmCamSneak : CFG.alarmCamStand;
    if (rate > 0) {
      this.value += rate * dt;
    } else {
      this.value -= CFG.alarmDecay * dt;
    }
    if (this.value < 0) this.value = 0;
    if (this.value > CFG.alarmMax) this.value = CFG.alarmMax;
    if (this.value > this.maxSeen) this.maxSeen = this.value;
    if (this.value >= CFG.alarmMax) this.tripped = true;
  }

  // 0..1，供 HUD 颜色与宽度用。
  get ratio() {
    return this.value / CFG.alarmMax;
  }

  // 报警条颜色：绿 → 黄 → 红。
  get color() {
    if (this.value < 40) return '#22c55e';
    if (this.value < 70) return '#eab308';
    return '#ef4444';
  }
}
