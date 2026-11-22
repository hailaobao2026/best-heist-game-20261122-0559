// 音效：全部用 WebAudio 现场合成，没有任何音频文件。
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.alarmBeepTimer = 0;
  }

  // 必须在用户手势（点击 / 按键）之后调用一次，浏览器才允许发声。
  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // 轻微的脚步声：低频短促敲击。
  footstep(sneaking) {
    this.tone(sneaking ? 140 : 110, 0.07, 'sine', sneaking ? 0.03 : 0.06);
  }

  // 拾取：清脆的两声叮。
  pickup() {
    this.tone(880, 0.12, 'sine', 0.12);
    this.tone(1318, 0.18, 'sine', 0.1, 0.07);
  }

  // 拿到星蓝宝石：上行琶音。
  sapphire() {
    this.tone(523, 0.14, 'triangle', 0.14);
    this.tone(659, 0.14, 'triangle', 0.14, 0.09);
    this.tone(784, 0.14, 'triangle', 0.14, 0.18);
    this.tone(1046, 0.3, 'triangle', 0.16, 0.27);
  }

  // 硬币落地：金属叮声。
  coinPing() {
    this.tone(2093, 0.1, 'square', 0.05);
    this.tone(2637, 0.22, 'sine', 0.07, 0.05);
  }

  // 烟雾弹：低沉噗声。
  smoke() {
    this.tone(320, 0.35, 'sine', 0.1, 0, 90);
  }

  // EMP：电流滋滋声。
  emp() {
    this.tone(1800, 0.3, 'sawtooth', 0.04, 0, 220);
  }

  // 被发现的惊叹：短促高音。
  spotted() {
    this.tone(740, 0.1, 'square', 0.06);
    this.tone(988, 0.16, 'square', 0.06, 0.08);
  }

  // 报警渐强：报警条越高，哔声越密（由主循环按节拍调用）。
  alarmBeep(dt, alarmValue) {
    if (alarmValue < 55) return;
    this.alarmBeepTimer -= dt;
    if (this.alarmBeepTimer > 0) return;
    const interval = 1.1 - (alarmValue / 100) * 0.75;
    this.alarmBeepTimer = interval;
    this.tone(1150, 0.09, 'square', 0.05);
  }

  // 被抓：下行刺耳音。
  caught() {
    this.tone(420, 0.5, 'sawtooth', 0.12, 0, 110);
    this.tone(210, 0.7, 'sawtooth', 0.1, 0.15, 70);
  }

  // 逃脱成功：胜利琶音。
  win() {
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.13, i * 0.11));
  }

  click() {
    this.tone(660, 0.06, 'sine', 0.08);
  }
}
