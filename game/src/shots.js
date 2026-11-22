// 摆拍状态：?shot=start|play|sneak|getaway&seed=
// 截图专用——把游戏摆成固定造型并冻结逻辑，只留视觉微光，
// 不影响正常游玩（无 shot 参数时完全不走这条路）。
export function applyShot(game, name) {
  // 先恢复一个干净的对局（会重建 level / guards / cameras），
  // 再按每张图的要求摆造型——引用必须在 resetRun 之后取，否则摆的是被丢弃的旧对象。
  game.shotMode = true;
  game.state = 'play';
  game.hideOverlays();
  game.resetRun();

  const level = game.level;
  const player = game.player;
  const guards = game.guards;
  const cameras = game.cameras;
  const alarm = game.alarm;
  const tools = game.tools;

  player.sneaking = false;

  if (name === 'start') {
    game.state = 'start';
    game.showStart();
    guards[0].x = 640;
    guards[0].y = 400;
    guards[0].dir = Math.PI; // 面朝左，视锥扫向房间
    guards[1].x = 1090;
    guards[1].y = 380;
    guards[1].dir = Math.PI / 2;
    cameras[0].angle = Math.PI / 2 + 0.5;
    cameras[1].angle = Math.PI / 2 - 0.45;
    return;
  }

  if (name === 'play') {
    // 封面：一帧内同时有房间、守卫视锥、摄像头视锥、星蓝宝石、报警条。
    player.x = 520;
    player.y = 440;
    player.dir = -Math.PI / 2;
    guards[0].x = 700;
    guards[0].y = 400;
    guards[0].dir = Math.PI; // 视锥正扫向小偷
    guards[0].state = 'patrol';
    guards[1].x = 1090;
    guards[1].y = 300;
    guards[1].dir = Math.PI * 0.75;
    cameras[0].angle = Math.PI / 2 + 0.42; // 绿锥扫向展台
    cameras[1].angle = Math.PI / 2 - 0.3;
    alarm.value = 32;
    alarm.maxSeen = 32;
    return;
  }

  if (name === 'sneak') {
    // 潜行瞬间：贴着展柜，视锥刚好擦过，报警条约 40%。
    player.x = 392;
    player.y = 246;
    player.dir = Math.PI / 2;
    player.sneaking = true;
    guards[0].x = 560;
    guards[0].y = 400;
    guards[0].dir = Math.PI * 1.08; // 锥边擦过小偷身后
    guards[1].x = 1090;
    guards[1].y = 480;
    guards[1].dir = -Math.PI / 2;
    cameras[0].angle = Math.PI / 2 - 0.5;
    cameras[1].angle = Math.PI / 2 + 0.2;
    alarm.value = 40;
    alarm.maxSeen = 40;
    return;
  }

  if (name === 'getaway') {
    // 逃脱瞬间：宝石已拿、报警条 80% 通红，小偷冲向出口，守卫在后追击。
    level.sapphire.taken = true;
    player.hasSapphire = true;
    player.lootValue = 500;
    player.lootCount = 1;
    level.lootSpots[0].taken = true; // 顺手拿了金条
    player.lootValue += 150;
    player.lootCount += 1;
    player.x = 920;
    player.y = 610;
    player.dir = 0;
    guards[0].x = 800;
    guards[0].y = 560;
    guards[0].dir = 0.15;
    guards[0].state = 'chase';
    guards[0].seesPlayer = true;
    guards[1].x = 1090;
    guards[1].y = 420;
    guards[1].dir = Math.PI / 2;
    guards[1].state = 'chase';
    cameras[0].angle = Math.PI / 2 + 0.6;
    cameras[1].angle = Math.PI / 2 - 0.55;
    alarm.value = 80;
    alarm.maxSeen = 80;
    tools.smokeLeft = 1;
    tools.empLeft = 0;
    tools.coinsLeft = 1;
    return;
  }
}
