// 全部 canvas 绘制：房间、灯光池、视锥、角色、战利品、烟雾与飘字。
import { CFG } from './config.js';
import { rayDistance, losBlockers } from './level.js';

const CONE_RAYS = 20;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(game, t) {
    const ctx = this.ctx;
    const level = game.level;
    const C = CFG.colors;
    ctx.clearRect(0, 0, CFG.canvasW, CFG.canvasH);

    this.drawFloor(ctx, level, t);
    this.drawMats(ctx, level, game);
    this.drawPedestal(ctx, level, t);
    this.drawLoot(ctx, level, t);
    this.drawCovers(ctx, level);
    this.drawWalls(ctx, level);
    this.drawCones(ctx, game, level);
    this.drawCameras(ctx, game);
    this.drawGuards(ctx, game, t);
    this.drawCoin(ctx, game);
    this.drawPlayer(ctx, game, t);
    this.drawSmoke(ctx, game);
    this.drawFloaters(ctx, game, t);
    this.drawVignette(ctx, t, game.alarm.value);
  }

  drawFloor(ctx, level, t) {
    const C = CFG.colors;
    // 地板：深蓝底 + 细格纹
    ctx.fillStyle = C.floorB;
    ctx.fillRect(0, CFG.hudH, CFG.canvasW, CFG.canvasH - CFG.hudH);
    ctx.fillStyle = C.floorA;
    const b = level.bounds;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = 'rgba(120, 150, 210, 0.07)';
    ctx.lineWidth = 1;
    for (let x = b.x + 62; x < b.x + b.w; x += 62) {
      ctx.beginPath();
      ctx.moveTo(x, b.y);
      ctx.lineTo(x, b.y + b.h);
      ctx.stroke();
    }
    for (let y = b.y + 62; y < b.y + b.h; y += 62) {
      ctx.beginPath();
      ctx.moveTo(b.x, y);
      ctx.lineTo(b.x + b.w, y);
      ctx.stroke();
    }
    // 暖色灯光池（展厅吊灯的光晕）
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const pools = [
      [640, 300, 260],
      [310, 202, 150],
      [970, 202, 150],
      [310, 502, 150],
      [970, 502, 150],
    ];
    for (const [x, y, r] of pools) {
      const g = ctx.createRadialGradient(x, y, 10, x, y, r);
      g.addColorStop(0, 'rgba(255, 214, 130, 0.10)');
      g.addColorStop(1, 'rgba(255, 214, 130, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawMats(ctx, level, game) {
    const C = CFG.colors;
    // 入口垫
    const en = level.entrance;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.fillRect(en.x, en.y, en.w, en.h);
    ctx.strokeStyle = C.entrance;
    ctx.lineWidth = 2;
    ctx.strokeRect(en.x, en.y, en.w, en.h);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('入口', en.x + en.w / 2, en.y + en.h / 2 + 5);
    // 出口垫（拿到宝石后发光脉动）
    const ex = level.exitZone;
    const glow = game.player.hasSapphire ? 0.35 + 0.2 * Math.sin(Date.now() / 240) : 0.18;
    ctx.fillStyle = `rgba(34, 197, 94, ${glow})`;
    ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
    ctx.strokeStyle = C.exit;
    ctx.lineWidth = 2;
    ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
    ctx.fillStyle = '#bbf7d0';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('出口 EXIT', ex.x + ex.w / 2, ex.y + ex.h / 2 + 5);
  }

  drawPedestal(ctx, level, t) {
    const C = CFG.colors;
    const p = level.pedestal;
    ctx.fillStyle = C.pedestal;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = C.pedestalTop;
    ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8);
    ctx.strokeStyle = C.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    if (!level.sapphire.taken) {
      // 星蓝宝石：发光菱形 + 旋转星芒
      const s = level.sapphire;
      const pulse = 1 + 0.12 * Math.sin(t * 3);
      const glow = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 46 * pulse);
      glow.addColorStop(0, 'rgba(77, 216, 255, 0.55)');
      glow.addColorStop(1, 'rgba(77, 216, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 46 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(Math.sin(t * 1.2) * 0.25);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = C.sapphire;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(13, 0);
      ctx.lineTo(0, 20);
      ctx.lineTo(-13, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(6, -2);
      ctx.lineTo(0, 2);
      ctx.lineTo(-6, -2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#bfefff';
      ctx.font = 'bold 12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('星蓝宝石', s.x, s.y + 38);
    }
  }

  drawLoot(ctx, level, t) {
    for (const spot of level.lootSpots) {
      if (spot.taken) continue;
      const bob = Math.sin(t * 2 + spot.x) * 2;
      ctx.save();
      ctx.translate(spot.x, spot.y + bob);
      if (spot.id === 'gold') {
        ctx.fillStyle = '#f5c542';
        ctx.beginPath();
        ctx.moveTo(-14, 6);
        ctx.lineTo(-9, -7);
        ctx.lineTo(9, -7);
        ctx.lineTo(14, 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(-9, -7, 18, 3);
      } else if (spot.id === 'cash') {
        ctx.fillStyle = '#86efac';
        ctx.fillRect(-13, -8, 26, 16);
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 古董花瓶
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.moveTo(-6, -12);
        ctx.bezierCurveTo(-14, -2, -12, 8, -6, 12);
        ctx.lineTo(6, 12);
        ctx.bezierCurveTo(12, 8, 14, -2, 6, -12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(-2, -12, 4, 20);
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
      ctx.font = '11px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(spot.name, spot.x, spot.y + 26 + bob);
    }
  }

  drawCovers(ctx, level) {
    const C = CFG.colors;
    for (const c of level.covers) {
      if (c.kind === 'case') {
        ctx.fillStyle = '#1d2b45';
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.fillStyle = C.caseGlass;
        ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, c.h - 12);
        ctx.strokeStyle = C.caseFrame;
        ctx.lineWidth = 3;
        ctx.strokeRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(c.x + 8, c.y + c.h - 8);
        ctx.lineTo(c.x + c.w - 20, c.y + 8);
        ctx.stroke();
      } else if (c.kind === 'pillar') {
        ctx.fillStyle = '#2b3548';
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = C.wallTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(c.x, c.y, c.w, c.h);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, 5);
      } else {
        // 花坛
        ctx.fillStyle = '#3f6212';
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.fillStyle = '#4d7c0f';
        ctx.beginPath();
        ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#65a30d';
        ctx.beginPath();
        ctx.arc(c.x + c.w / 2 - 6, c.y + c.h / 2 - 4, 8, 0, Math.PI * 2);
        ctx.arc(c.x + c.w / 2 + 7, c.y + c.h / 2 + 5, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawWalls(ctx, level) {
    const C = CFG.colors;
    for (const w of level.walls) {
      ctx.fillStyle = C.wall;
      ctx.fillRect(w.x, w.y, w.w, w.h);
    }
    // 墙沿金线
    ctx.strokeStyle = C.wallTrim;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 84, 1240, 616);
  }

  // 视锥：沿扇形发多条射线，被掩体截断后连成多边形。
  drawCone(ctx, ox, oy, angle, range, halfAngle, fill, edge, blockers) {
    const pts = [];
    for (let i = 0; i <= CONE_RAYS; i++) {
      const a = angle - halfAngle + (2 * halfAngle * i) / CONE_RAYS;
      const d = rayDistance(ox, oy, a, range, blockers);
      pts.push([ox + Math.cos(a) * d, oy + Math.sin(a) * d]);
    }
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawCones(ctx, game, level) {
    const C = CFG.colors;
    const blockers = losBlockers(level);
    const smoke = game.tools.smokeActive;
    for (const cam of game.cameras) {
      if (cam.disabled) continue;
      this.drawCone(
        ctx,
        cam.x,
        cam.y,
        cam.angle,
        CFG.camRange,
        CFG.camHalfAngle,
        smoke ? 'rgba(80, 255, 140, 0.05)' : C.camCone,
        smoke ? 'rgba(80, 255, 140, 0.15)' : C.camConeEdge,
        blockers,
      );
    }
    for (const g of game.guards) {
      const chasing = g.state === 'chase';
      this.drawCone(
        ctx,
        g.x,
        g.y,
        g.dir,
        CFG.guardRange,
        CFG.guardHalfAngle,
        smoke
          ? 'rgba(255, 70, 60, 0.05)'
          : chasing
            ? 'rgba(255, 40, 30, 0.34)'
            : C.guardCone,
        smoke ? 'rgba(255, 90, 70, 0.15)' : C.guardConeEdge,
        blockers,
      );
    }
  }

  drawCameras(ctx, game) {
    for (const cam of game.cameras) {
      ctx.save();
      ctx.translate(cam.x, cam.y);
      ctx.rotate(cam.angle);
      ctx.fillStyle = cam.disabled ? '#334155' : '#16a34a';
      ctx.fillRect(-4, -4, 8, 16);
      ctx.fillStyle = cam.disabled ? '#475569' : '#4ade80';
      ctx.beginPath();
      ctx.arc(0, 12, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (cam.disabled) {
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EMP', cam.x, cam.y + 30);
      }
    }
  }

  drawGuards(ctx, game, t) {
    const C = CFG.colors;
    for (const g of game.guards) {
      // 身体
      ctx.fillStyle = C.guardDark;
      ctx.beginPath();
      ctx.arc(g.x, g.y, CFG.guardRadius + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.guard;
      ctx.beginPath();
      ctx.arc(g.x, g.y, CFG.guardRadius, 0, Math.PI * 2);
      ctx.fill();
      // 朝向（小手电/视线方向）
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.dir) * (CFG.guardRadius + 8), g.y + Math.sin(g.dir) * (CFG.guardRadius + 8));
      ctx.stroke();
      // 帽子
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(g.x, g.y - 3, 7, Math.PI, 0);
      ctx.fill();
      // 状态标记
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      if (g.state === 'chase') {
        ctx.fillStyle = '#ff2222';
        ctx.fillText('!', g.x, g.y - CFG.guardRadius - 8);
      } else if (g.seesPlayer) {
        const blink = Math.sin(t * 14) > 0 ? '#fbbf24' : '#f59e0b';
        ctx.fillStyle = blink;
        ctx.fillText('?', g.x, g.y - CFG.guardRadius - 8);
      } else if (g.state === 'investigate') {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('?', g.x, g.y - CFG.guardRadius - 8);
      }
      ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
      ctx.font = '11px sans-serif';
      ctx.fillText(g.name, g.x, g.y + CFG.guardRadius + 14);
    }
  }

  drawCoin(ctx, game) {
    const coin = game.tools.coin;
    if (!coin) return;
    ctx.save();
    ctx.translate(coin.x, coin.y - (coin.lift || 0));
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    const ping = game.tools.coinPing;
    if (ping && game.tools.time < ping.until) {
      const k = 1 - (ping.until - game.tools.time) / 1.6;
      ctx.strokeStyle = `rgba(253, 230, 138, ${0.8 * (1 - k)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ping.x, ping.y, 10 + k * 46, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawPlayer(ctx, game, t) {
    const p = game.player;
    const C = CFG.colors;
    // 潜行时身体半透明一点 + 脚下虚线圈
    ctx.save();
    if (p.sneaking) ctx.globalAlpha = 0.85;
    ctx.fillStyle = C.playerDark;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.player;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    // 面罩带
    ctx.strokeStyle = '#134e4a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x - p.r + 2, p.y - 2);
    ctx.lineTo(p.x + p.r - 2, p.y - 2);
    ctx.stroke();
    // 眼睛
    ctx.fillStyle = '#ffffff';
    const ex = Math.cos(p.dir) * 5;
    const ey = Math.sin(p.dir) * 5;
    ctx.beginPath();
    ctx.arc(p.x + ex - 4, p.y + ey - 1, 2.4, 0, Math.PI * 2);
    ctx.arc(p.x + ex + 4, p.y + ey - 1, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(p.x + ex - 4, p.y + ey - 1, 1.2, 0, Math.PI * 2);
    ctx.arc(p.x + ex + 4, p.y + ey - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (p.sneaking) {
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.7)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#5eead4';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('潜行', p.x, p.y - p.r - 10);
    }
    if (p.hasSapphire) {
      // 背着宝石：头顶小蓝光
      const pulse = 1 + 0.15 * Math.sin(t * 4);
      ctx.fillStyle = 'rgba(77, 216, 255, 0.9)';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.r - 14 * pulse);
      ctx.lineTo(p.x + 5, p.y - p.r - 6);
      ctx.lineTo(p.x, p.y - p.r - 2);
      ctx.lineTo(p.x - 5, p.y - p.r - 6);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawSmoke(ctx, game) {
    if (!game.tools.smokeActive && game.tools.smokePuffs.length === 0) return;
    const now = game.tools.time;
    for (const puff of game.tools.smokePuffs) {
      const remain = puff.until - now;
      if (remain <= 0) continue;
      const alpha = Math.min(0.55, (remain / CFG.smokeSecs) * 0.55);
      ctx.fillStyle = `rgba(200, 200, 210, ${alpha})`;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFloaters(ctx, game, t) {
    // 拾取飘字（+150 等），1.2 秒淡出
    for (const f of game.floaters) {
      const age = t - f.born;
      if (age > 1.2) continue;
      ctx.globalAlpha = 1 - age / 1.2;
      ctx.fillStyle = f.color;
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y - age * 34);
    }
    ctx.globalAlpha = 1;
  }

  drawVignette(ctx, t, alarmValue) {
    // 报警高时屏幕边缘泛红，制造紧张感
    if (alarmValue < 55) return;
    const a = ((alarmValue - 55) / 45) * (0.22 + 0.08 * Math.sin(t * 6));
    const g = ctx.createRadialGradient(640, 390, 300, 640, 390, 720);
    g.addColorStop(0, 'rgba(239, 68, 68, 0)');
    g.addColorStop(1, `rgba(239, 68, 68, ${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, CFG.hudH, CFG.canvasW, CFG.canvasH - CFG.hudH);
  }
}
