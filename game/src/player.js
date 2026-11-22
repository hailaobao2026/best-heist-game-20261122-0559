// 小偷：移动、潜行、拾取战利品。
import { CFG } from './config.js';
import { resolveCircleRect, pointInRect } from './level.js';

export class Player {
  constructor(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.r = CFG.playerRadius;
    this.dir = -Math.PI / 2; // 初始面朝上（向展厅深处）
    this.sneaking = false;
    this.moving = false;
    this.hasSapphire = false;
    this.lootValue = 0;
    this.lootCount = 0;
    this.stepTimer = 0;
  }

  reset(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.dir = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.hasSapphire = false;
    this.lootValue = 0;
    this.lootCount = 0;
    this.stepTimer = 0;
  }

  // input: {mx, my} 移动向量（已归一化）；sneak 是否潜行。
  // 返回本帧是否在走路（供脚步声音效用）。
  update(dt, input, level, solids) {
    this.sneaking = input.sneak;
    const speed = this.sneaking ? CFG.sneakSpeed : CFG.walkSpeed;
    const mag = Math.hypot(input.mx, input.my);
    this.moving = mag > 0.01;
    if (this.moving) {
      const nx = input.mx / (mag || 1);
      const ny = input.my / (mag || 1);
      this.dir = Math.atan2(ny, nx);
      let x = this.x + nx * speed * dt;
      let y = this.y + ny * speed * dt;
      // 限制在房间内
      const b = level.bounds;
      x = Math.max(b.x + this.r, Math.min(b.x + b.w - this.r, x));
      y = Math.max(b.y + this.r, Math.min(b.y + b.h - this.r, y));
      const fixed = resolveCircleRect(x, y, this.r, solids);
      this.x = fixed.x;
      this.y = fixed.y;
      this.stepTimer += dt;
    } else {
      this.stepTimer = 0;
    }
    return this.moving;
  }

  // 脚步声节拍：走路 0.34s 一步，潜行 0.48s 一步。
  stepDue() {
    const interval = this.sneaking ? 0.48 : 0.34;
    if (this.stepTimer >= interval) {
      this.stepTimer = 0;
      return true;
    }
    return false;
  }

  // 走过战利品点即拾取。返回本帧新拾取的物品（没有则 null）。
  tryPickup(level) {
    for (const spot of level.lootSpots) {
      if (!spot.taken && Math.hypot(this.x - spot.x, this.y - spot.y) < 34) {
        spot.taken = true;
        this.lootValue += spot.value;
        this.lootCount += 1;
        return spot;
      }
    }
    const s = level.sapphire;
    if (!s.taken && Math.hypot(this.x - s.x, this.y - s.y) < 40) {
      s.taken = true;
      this.hasSapphire = true;
      this.lootValue += s.value;
      this.lootCount += 1;
      return s;
    }
    return null;
  }

  inExit(level) {
    return pointInRect(this.x, this.y, level.exitZone);
  }
}
