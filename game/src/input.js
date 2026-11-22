// 键盘 + 鼠标输入：WASD/方向键移动，Shift 潜行，Space 烟雾，E EMP，
// 鼠标点击投硬币，R 重开，P/Esc 暂停，M 静音，Enter 开始。
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.canvas = canvas;
    this.clickQueue = []; // {x, y} 画布坐标的点击
    this.pressedQueue = []; // 本帧新按下的键（code），供一次性动作消费
    this.onFirstGesture = null; // 首次手势回调（用于解锁音频）

    window.addEventListener('keydown', (e) => {
      if (this.isGameKey(e.code)) e.preventDefault();
      if (!e.repeat) {
        this.pressedQueue.push(e.code);
        if (this.onFirstGesture) {
          this.onFirstGesture();
          this.onFirstGesture = null;
        }
      }
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.clickQueue.push({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      });
      if (this.onFirstGesture) {
        this.onFirstGesture();
        this.onFirstGesture = null;
      }
    });
  }

  isGameKey(code) {
    return [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Space',
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
    ].includes(code);
  }

  // 每帧调用：返回归一化移动向量 + 是否潜行。
  moveVector() {
    let mx = 0;
    let my = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) my -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) my += 1;
    const mag = Math.hypot(mx, my);
    if (mag > 0) {
      mx /= mag;
      my /= mag;
    }
    return { mx, my, sneak: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') };
  }

  // 消费本帧新按下的指定键（只触发一次）。
  pressed(code) {
    const i = this.pressedQueue.indexOf(code);
    if (i >= 0) {
      this.pressedQueue.splice(i, 1);
      return true;
    }
    return false;
  }

  hasPressed(code) {
    return this.pressedQueue.includes(code);
  }

  // 消费一次鼠标点击，返回画布坐标，没有则 null。
  consumeClick() {
    return this.clickQueue.shift() || null;
  }

  // 每帧结束时调用：清空本帧未消费的按下记录，避免跨帧重复触发。
  endFrame() {
    this.pressedQueue.length = 0;
    this.clickQueue.length = 0;
  }
}
