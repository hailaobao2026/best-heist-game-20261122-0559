// 守卫：固定路线巡逻、视锥判定、发现玩家后追击、被硬币引开查看。
import { CFG } from './config.js';
import { segmentBlocked, resolveCircleRect } from './level.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class Guard {
  constructor(route) {
    this.name = route.name;
    this.waypoints = route.waypoints;
    this.wpIndex = 0;
    this.x = route.waypoints[0].x;
    this.y = route.waypoints[0].y;
    this.dir = 0;
    this.state = 'patrol'; // patrol | pause | chase | investigate | return
    this.pauseTimer = 0;
    this.scanAngle = 0;
    this.alertTimer = 0; // 看到玩家后先 "!" 延迟再追
    this.loseTimer = 0; // 丢失视线计时
    this.chaseTimer = 0;
    this.seesPlayer = false;
    this.investigateTarget = null;
    this.investigateTimer = 0;
    this.returnTarget = null;
  }

  reset() {
    this.wpIndex = 0;
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.dir = 0;
    this.state = 'patrol';
    this.pauseTimer = 0;
    this.alertTimer = 0;
    this.loseTimer = 0;
    this.chaseTimer = 0;
    this.seesPlayer = false;
    this.investigateTarget = null;
    this.investigateTimer = 0;
    this.returnTarget = null;
  }

  // 视锥是否照到玩家：距离 + 角度 + 视线不被掩体挡住。烟雾中失效。
  canSee(player, blockers, smokeActive) {
    if (smokeActive) return false;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CFG.guardRange) return false;
    const ang = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(ang, this.dir)) > CFG.guardHalfAngle) return false;
    if (segmentBlocked(this.x, this.y, player.x, player.y, blockers)) return false;
    return true;
  }

  // 被硬币吸引：走向落点查看。
  lureTo(x, y) {
    if (this.state === 'chase') return; // 追击中不理会硬币
    this.investigateTarget = { x, y };
    this.state = 'investigate';
    this.investigateTimer = 0;
  }

  update(dt, player, level, blockers, solids, smokeActive) {
    this.seesPlayer = this.canSee(player, blockers, smokeActive);

    if (this.seesPlayer) {
      this.loseTimer = 0;
      if (this.state !== 'chase') {
        // 刚发现：先 "!" 0.35 秒，再追
        this.alertTimer += dt;
        if (this.alertTimer >= CFG.alertDelay) {
          this.state = 'chase';
          this.chaseTimer = 0;
          this.alertTimer = 0;
        }
      }
    } else {
      this.alertTimer = 0;
      if (this.state === 'chase') {
        this.loseTimer += dt;
        if (this.loseTimer >= CFG.chaseLoseTime || this.chaseTimer >= CFG.chaseMaxTime) {
          this.state = 'return';
          this.returnTarget = this.nearestWaypoint();
        }
      }
    }

    if (this.state === 'chase') {
      this.chaseTimer += dt;
      this.moveToward(player.x, player.y, CFG.chaseSpeed, dt, solids);
      this.dir = Math.atan2(player.y - this.y, player.x - this.x);
      return;
    }

    if (this.state === 'investigate' && this.investigateTarget) {
      const t = this.investigateTarget;
      const arrived = this.moveToward(t.x, t.y, CFG.patrolSpeed * 1.4, dt, solids);
      if (arrived) {
        // 到了落点：左右张望 2 秒
        this.investigateTimer += dt;
        this.dir += Math.sin(this.investigateTimer * 2.2) * dt * 1.6;
        if (this.investigateTimer >= 2) {
          this.investigateTarget = null;
          this.state = 'return';
          this.returnTarget = this.nearestWaypoint();
        }
      } else {
        this.dir = Math.atan2(t.y - this.y, t.x - this.x);
      }
      return;
    }

    if (this.state === 'return' && this.returnTarget) {
      const arrived = this.moveToward(
        this.returnTarget.x,
        this.returnTarget.y,
        CFG.patrolSpeed * 1.3,
        dt,
        solids,
      );
      if (arrived) {
        this.wpIndex = this.waypoints.indexOf(this.returnTarget);
        this.returnTarget = null;
        this.state = 'pause';
        this.pauseTimer = 0;
      }
      return;
    }

    if (this.state === 'pause') {
      this.pauseTimer += dt;
      // 停顿张望：左右扫视
      this.dir += Math.sin(this.pauseTimer * 1.8) * dt * 1.2;
      if (this.pauseTimer >= CFG.guardPause) {
        this.pauseTimer = 0;
        this.state = 'patrol';
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      }
      return;
    }

    // patrol：走向下一个巡逻点
    const target = this.waypoints[this.wpIndex];
    const arrived = this.moveToward(target.x, target.y, CFG.patrolSpeed, dt, solids);
    this.dir = Math.atan2(target.y - this.y, target.x - this.x);
    if (arrived) {
      this.state = 'pause';
      this.pauseTimer = 0;
    }
  }

  nearestWaypoint() {
    let best = this.waypoints[0];
    let bestD = Infinity;
    for (const w of this.waypoints) {
      const d = Math.hypot(w.x - this.x, w.y - this.y);
      if (d < bestD) {
        bestD = d;
        best = w;
      }
    }
    return best;
  }

  // 朝目标移动一帧；到达（< 6px）返回 true。
  moveToward(tx, ty, speed, dt, solids) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    const fixed = resolveCircleRect(nx, ny, CFG.guardRadius, solids);
    this.x = fixed.x;
    this.y = fixed.y;
    return Math.hypot(tx - this.x, ty - this.y) < 6;
  }

  // 是否碰到玩家（被抓）。
  touches(player) {
    return Math.hypot(player.x - this.x, player.y - this.y) < CFG.playerTouch;
  }
}
