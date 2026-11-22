// 午夜金库 MIDNIGHT VAULT — 启动、主循环、状态机（开始 / 游玩 / 暂停 / 胜利 / 被抓）。
import { CFG } from './config.js';
import { buildLevel, losBlockers } from './level.js';
import { Player } from './player.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { Alarm } from './alarm.js';
import { Tools } from './tools.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { applyShot } from './shots.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.canvas.width = CFG.canvasW;
    this.canvas.height = CFG.canvasH;
    this.renderer = new Renderer(this.canvas);
    this.input = new Input(this.canvas);
    this.audio = new SoundBank();
    this.input.onFirstGesture = () => this.audio.ensure();

    this.level = buildLevel();
    this.solids = [...this.level.walls, ...this.level.covers, this.level.pedestal];
    this.blockers = losBlockers(this.level);
    this.player = new Player(this.level.playerSpawn);
    this.guards = this.level.guardRoutes.map((r) => new Guard(r));
    this.cameras = this.level.cameraMounts.map((m) => new Camera(m));
    this.alarm = new Alarm();
    this.tools = new Tools();
    this.floaters = [];
    this.state = 'start';
    this.shotMode = false;
    this.elapsed = 0;
    this.visualTime = 0;
    this.prevSees = this.guards.map(() => false);
    this.lastResult = null;

    this.bindButtons();
    this.bindHud();

    // ?shot=start|play|sneak|getaway —— 截图摆拍
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      applyShot(this, shot);
    }
    this.updateHud();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  bindButtons() {
    const startBtn = document.getElementById('btn-start');
    if (startBtn) startBtn.addEventListener('click', () => this.startGame());
    for (const id of ['btn-again-win', 'btn-again-caught']) {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', () => this.startGame());
    }
  }

  bindHud() {
    this.hud = {
      alarmFill: document.getElementById('alarm-fill'),
      alarmText: document.getElementById('alarm-text'),
      objective: document.getElementById('objective'),
      loot: document.getElementById('loot-count'),
      smoke: document.getElementById('tool-smoke'),
      emp: document.getElementById('tool-emp'),
      coin: document.getElementById('tool-coin'),
      timer: document.getElementById('timer'),
      sneak: document.getElementById('sneak-tag'),
    };
  }

  resetRun() {
    this.level = buildLevel();
    this.solids = [...this.level.walls, ...this.level.covers, this.level.pedestal];
    this.blockers = losBlockers(this.level);
    this.player.reset(this.level.playerSpawn);
    this.guards = this.level.guardRoutes.map((r) => new Guard(r));
    this.cameras = this.level.cameraMounts.map((m) => new Camera(m));
    this.alarm.reset();
    this.tools.reset();
    this.floaters = [];
    this.elapsed = 0;
    this.prevSees = this.guards.map(() => false);
    this.lastResult = null;
  }

  startGame() {
    this.audio.ensure();
    this.audio.click();
    this.resetRun();
    this.state = 'play';
    this.hideOverlays();
    this.updateHud();
  }

  hideOverlays() {
    for (const id of ['screen-start', 'screen-win', 'screen-caught', 'screen-pause']) {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    }
  }

  showStart() {
    this.hideOverlays();
    document.getElementById('screen-start').classList.remove('hidden');
  }

  showWin() {
    const s = this.score();
    document.getElementById('win-time').textContent = this.formatTime(this.elapsed);
    document.getElementById('win-loot').textContent = `¥${s.loot}`;
    document.getElementById('win-bonus').textContent = `¥${s.bonus}`;
    document.getElementById('win-total').textContent = `¥${s.total}`;
    document.getElementById('win-title').textContent =
      this.alarm.maxSeen < 30 ? '幽灵大盗 · 干净利落！' : '逃脱成功！';
    this.hideOverlays();
    document.getElementById('screen-win').classList.remove('hidden');
  }

  showCaught() {
    document.getElementById('caught-time').textContent = this.formatTime(this.elapsed);
    document.getElementById('caught-loot').textContent = `¥${this.player.lootValue}`;
    this.hideOverlays();
    document.getElementById('screen-caught').classList.remove('hidden');
  }

  score() {
    const loot = this.player.lootValue;
    const timeBonus = Math.max(0, Math.round(CFG.timeBonusBase - this.elapsed * 2));
    const bonus =
      this.alarm.maxSeen < 30
        ? CFG.ghostBonusLow
        : this.alarm.maxSeen < 70
          ? CFG.ghostBonusMid
          : 0;
    return { loot, timeBonus, bonus, total: loot + timeBonus + bonus };
  }

  formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - (this.lastNow || now)) / 1000 || 0.016);
    this.lastNow = now;
    this.visualTime += dt;
    if (!this.shotMode) this.update(dt);
    this.renderer.draw(this, this.visualTime);
    this.updateHud();
    this.input.endFrame();
  }

  update(dt) {
    // 全局按键
    if (this.input.pressed('KeyM')) {
      const muted = this.audio.toggleMute();
      document.getElementById('mute-tag').textContent = muted ? '已静音 M' : '音效开 M';
    }
    if (this.input.pressed('KeyR') && this.state !== 'start') {
      this.startGame();
      return;
    }
    if (this.state === 'start') {
      if (this.input.pressed('Enter')) {
        this.startGame();
        return;
      }
      // 开始屏后是“活”的展厅：守卫巡逻、摄像头扫动
      for (const g of this.guards) g.update(dt, this.player, this.level, this.blockers, this.solids, false);
      for (const c of this.cameras) c.update(dt, false);
      return;
    }
    if (this.state === 'paused') {
      if (this.input.pressed('KeyP') || this.input.pressed('Escape')) {
        this.state = 'play';
        this.hideOverlays();
      }
      return;
    }
    if (this.state === 'win' || this.state === 'caught') {
      if (this.input.pressed('Enter')) this.startGame();
      return;
    }

    // --- 游玩中 ---
    if (this.input.pressed('KeyP') || this.input.pressed('Escape')) {
      this.state = 'paused';
      document.getElementById('screen-pause').classList.remove('hidden');
      return;
    }

    this.elapsed += dt;
    const mv = this.input.moveVector();
    const moving = this.player.update(dt, mv, this.level, this.solids);
    if (moving && this.player.stepDue()) this.audio.footstep(this.player.sneaking);

    // 工具
    if (this.input.pressed('Space')) {
      if (this.tools.useSmoke(this.player)) this.audio.smoke();
    }
    if (this.input.pressed('KeyE')) {
      if (this.tools.useEmp()) this.audio.emp();
    }
    const click = this.input.consumeClick();
    if (click) {
      if (this.tools.throwCoin(this.player, click.x, click.y)) {
        this.audio.coinPing();
      }
    }
    this.tools.update(dt, this.guards);

    // 摄像头扫动（EMP 会停）
    for (const c of this.cameras) c.update(dt, this.tools.empActive);

    // 守卫巡逻 / 追击 / 查看
    for (const g of this.guards) {
      g.update(dt, this.player, this.level, this.blockers, this.solids, this.tools.smokeActive);
    }

    // 谁照到了玩家？
    const guardSeen = this.guards.some((g) => g.seesPlayer);
    const camSeen = this.cameras.some((c) => c.canSee(this.player, this.blockers, this.tools.smokeActive));
    this.guards.forEach((g, i) => {
      if (g.seesPlayer && !this.prevSees[i]) this.audio.spotted();
      this.prevSees[i] = g.seesPlayer;
    });
    this.alarm.update(dt, guardSeen, camSeen, this.player.sneaking);
    this.audio.alarmBeep(dt, this.alarm.value);

    // 拾取
    const got = this.player.tryPickup(this.level);
    if (got) {
      this.floaters.push({
        x: got.x,
        y: got.y - 20,
        text: `+¥${got.value} ${got.name}`,
        color: got.id === 'sapphire' || got.name === '星蓝宝石' ? '#4dd8ff' : '#f5c542',
        born: this.visualTime,
      });
      if (got.name === '星蓝宝石') this.audio.sapphire();
      else this.audio.pickup();
    }

    // 胜负
    if (this.player.hasSapphire && this.player.inExit(this.level)) {
      this.state = 'win';
      this.lastResult = { outcome: 'win', ...this.score() };
      this.audio.win();
      this.showWin();
      return;
    }
    if (this.alarm.tripped || this.guards.some((g) => g.touches(this.player))) {
      this.state = 'caught';
      this.lastResult = { outcome: 'caught', loot: this.player.lootValue, time: this.elapsed };
      this.audio.caught();
      this.showCaught();
    }
  }

  updateHud() {
    const h = this.hud;
    if (!h.alarmFill) return;
    const a = this.alarm;
    h.alarmFill.style.width = `${a.ratio * 100}%`;
    h.alarmFill.style.background = a.color;
    h.alarmText.textContent = `报警 ${Math.round(a.value)}`;
    h.alarmText.style.color = a.color;
    h.objective.textContent = this.player.hasSapphire
      ? '目标：逃到出口！'
      : '目标：偷走星蓝宝石';
    h.loot.textContent = `战利品 ${this.player.lootCount}/4 · ¥${this.player.lootValue}`;
    h.smoke.textContent = `烟雾 ${this.tools.smokeLeft}${this.tools.smokeActive ? ` (${this.tools.smokeLeftSecs.toFixed(0)}s)` : ''}`;
    h.emp.textContent = `EMP ${this.tools.empLeft}${this.tools.empActive ? ` (${this.tools.empLeftSecs.toFixed(0)}s)` : ''}`;
    h.coin.textContent = `硬币 ${this.tools.coinsLeft}`;
    h.timer.textContent = this.formatTime(this.elapsed);
    h.sneak.style.visibility = this.player.sneaking && this.state === 'play' ? 'visible' : 'hidden';
  }
}

const game = new Game();

// 供 Playwright 实测与调试：只读快照 + 摆位接口，不影响正常游玩。
window.__vault = {
  game,
  state() {
    return {
      phase: game.state,
      alarm: Math.round(game.alarm.value),
      alarmMax: Math.round(game.alarm.maxSeen),
      player: { x: Math.round(game.player.x), y: Math.round(game.player.y) },
      hasSapphire: game.player.hasSapphire,
      lootCount: game.player.lootCount,
      lootValue: game.player.lootValue,
      guards: game.guards.map((g) => ({ state: g.state, sees: g.seesPlayer, x: Math.round(g.x), y: Math.round(g.y) })),
      cameras: game.cameras.map((c) => ({ angle: +c.angle.toFixed(2), sees: c.seesPlayer, disabled: c.disabled })),
      tools: {
        smoke: game.tools.smokeLeft,
        emp: game.tools.empLeft,
        coins: game.tools.coinsLeft,
        smokeActive: game.tools.smokeActive,
        empActive: game.tools.empActive,
      },
      elapsed: +game.elapsed.toFixed(1),
      result: game.lastResult,
    };
  },
  teleport(x, y) {
    game.player.x = x;
    game.player.y = y;
  },
  setAlarm(v) {
    game.alarm.value = v;
  },
  start() {
    game.startGame();
  },
};
