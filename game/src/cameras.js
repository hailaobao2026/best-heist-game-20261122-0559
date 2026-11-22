// 壁挂摄像头：视锥左右扫动；EMP 可让它停 5 秒。
import { CFG } from './config.js';
import { segmentBlocked } from './level.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class Camera {
  constructor(mount) {
    this.x = mount.x;
    this.y = mount.y;
    this.baseAngle = mount.baseAngle;
    this.phase = mount.phase;
    this.angle = mount.baseAngle;
    this.time = mount.phase;
    this.disabled = false;
    this.seesPlayer = false;
  }

  reset() {
    this.time = this.phase;
    this.angle = this.baseAngle;
    this.disabled = false;
    this.seesPlayer = false;
  }

  update(dt, empActive) {
    this.disabled = empActive;
    if (!this.disabled) {
      this.time += dt;
      this.angle = this.baseAngle + Math.sin(this.time * 0.55) * CFG.camSweep;
    }
  }

  // 视锥是否照到玩家：距离 + 角度 + 视线不被挡。EMP 或烟雾中失效。
  canSee(player, blockers, smokeActive) {
    if (this.disabled || smokeActive) {
      this.seesPlayer = false;
      return false;
    }
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CFG.camRange) {
      this.seesPlayer = false;
      return false;
    }
    const ang = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(ang, this.angle)) > CFG.camHalfAngle) {
      this.seesPlayer = false;
      return false;
    }
    if (segmentBlocked(this.x, this.y, player.x, player.y, blockers)) {
      this.seesPlayer = false;
      return false;
    }
    this.seesPlayer = true;
    return true;
  }
}
