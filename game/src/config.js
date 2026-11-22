// 午夜金库 MIDNIGHT VAULT — 全部调参集中在这里。
// 画布 1280x720；顶部 64px 是 DOM 做的 HUD 条，游戏房间在 y 64..720 之间。

export const CFG = {
  canvasW: 1280,
  canvasH: 720,
  hudH: 64,

  // 小偷
  playerRadius: 14,
  walkSpeed: 178, // px/s
  sneakSpeed: 96, // px/s，潜行更慢、更难被发现
  playerTouch: 30, // 守卫碰到这个距离即被抓

  // 守卫
  guardRadius: 16,
  patrolSpeed: 58,
  chaseSpeed: 152, // 略低于玩家跑速，甩得掉才公平
  guardRange: 250, // 视锥射程
  guardHalfAngle: (38 * Math.PI) / 180, // 视锥半角
  guardPause: 2.4, // 巡逻点停顿张望（秒）
  chaseLoseTime: 1.5, // 丢失视线多久后放弃追击
  chaseMaxTime: 4.5, // 追击最长持续
  alertDelay: 0.35, // 看到后先 "!" 再追，给玩家反应时间

  // 摄像头
  camRange: 280,
  camHalfAngle: (26 * Math.PI) / 180,
  camSweep: (50 * Math.PI) / 180, // 左右扫动幅度

  // 报警条：被照到上涨，躲开后缓慢回落；100 即被抓
  alarmGuardStand: 38,
  alarmGuardSneak: 16,
  alarmCamStand: 30,
  alarmCamSneak: 12,
  alarmDecay: 7,
  alarmMax: 100,

  // 工具（每局有限次数，用完不补）
  smokeCount: 2,
  smokeSecs: 3, // 烟雾弹：3 秒内所有视锥失效
  empCount: 2,
  empSecs: 5, // EMP：摄像头停 5 秒
  coinCount: 3, // 硬币：点击投掷，吸引最近守卫过去查看
  coinLureRange: 460, // 多远内的守卫会被硬币吸引
  coinFlight: 0.55, // 硬币飞行时间（秒）

  // 战利品分值
  sapphireValue: 500,
  goldValue: 150,
  cashValue: 100,
  vaseValue: 120,
  ghostBonusLow: 300, // 全程报警峰值 < 30：幽灵大盗
  ghostBonusMid: 100, // 峰值 < 70：悄无声息
  timeBonusBase: 600, // 胜利结算：600 - 秒数*2，不低于 0

  // 颜色
  colors: {
    floorA: '#16233d',
    floorB: '#101a2e',
    wall: '#0a1220',
    wallTrim: '#c9a227',
    caseGlass: 'rgba(150, 200, 255, 0.16)',
    caseFrame: '#8a6d2f',
    pedestal: '#3a3f4a',
    pedestalTop: '#565d6b',
    sapphire: '#4dd8ff',
    gold: '#f5c542',
    guardCone: 'rgba(255, 70, 60, 0.20)',
    guardConeEdge: 'rgba(255, 90, 70, 0.55)',
    camCone: 'rgba(80, 255, 140, 0.16)',
    camConeEdge: 'rgba(80, 255, 140, 0.5)',
    player: '#2dd4bf',
    playerDark: '#0f766e',
    guard: '#e11d48',
    guardDark: '#7f1d2e',
    exit: '#22c55e',
    entrance: '#94a3b8',
    smoke: 'rgba(200, 200, 210, 0.55)',
  },
};
