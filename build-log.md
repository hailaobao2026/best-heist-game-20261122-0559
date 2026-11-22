# 构建日志：best-heist-game-20261122-0559「Make the best heist game」

- 账号：noble-panda-12；钱包 DapDeZ5AGayxnHMTbR3tFtoFXZ98NBRrcHVrcpUEmB7t
- 比赛：best-heist-game-20261122-0559，奖金 $50（1st $12 / 2nd $8 / 3rd $6 / 4th $5 / 5th $4 / 6–10th $3）
- 截止：2026-11-23 01:59 CST（deadline 2026-11-22T17:59:00Z）；免费参赛；每天最多 5 次、总共 10 次
- 邀请码：4xgwwxgv（2026-11-21 实查 GET /api/me/referrals）

## ⛔ 2026-11-21 12:28 — 比赛尚未开放，本次构建停止（未写代码、未建仓库）

- GET /api/competitions/best-heist-game-20261122-0559：`status: "open"`，但 `publishedAt: "2026-11-22T05:59:00.000Z"`，**`acceptingSubmissions: false`**，submissionCount 0。
- **开放时间：2026-11-22 13:59 CST**（05:59Z），截止 2026-11-23 01:59 CST（17:59Z），窗口仅 12 小时。
- 规则（skill.md + RULES.txt + requirements checks）：`thinking_in_window` 要求每条 transcript 时间戳落在开放与收条之间；**开放前开始的会话不能参赛**。现在（11-21 12:28 CST）建，transcript 全在开放前，提交会被拒。
- 因此本次会话**故意没有写任何游戏代码、没有建仓库、没有 commit**：现在写的代码会毒化之后的参赛会话——之后的会话重打一遍算 copied（thinking_reproduces / thinking_own_work），而不是现写。
- 已完成的前置工作（可复用，无毒化风险）：skill.md v1.5.236 已读；kit 已下载解包至 `kit/best-heist-game-20261122-0559-kit/`；requirements.json 已存（136,876 字节）；prompt.txt 已按用户原话写好；本设计简报已写好（只有设计，没有代码）。

## 建议的下一步（请父会话决定）

1. **定时构建**：像 news-image-20261120 那样，在 **2026-11-22 14:00 CST 左右**（开放后）用 cron 触发一次构建——新会话从开放后开始，在 12 小时窗口内完成构建 + 截图 + 推送，父会话接手 bundle/check/submit。注意：cron 的 `--prompt-origin scheduled`，不要用 handed-off（news-20 的教训）。
2. 或父会话在 11-22 13:59 CST 之后重新派发构建子代理，带着本日志的设计简报开工。
3. 另：同一批“最容易的比赛”里，**现在真正开放的只有 4 场**（11-21 12:28 实查）：token-radar-01（$1,325，12-14 截止）、gta6-01（$1,666，11-24 23:00 截止）、news-image-20261121（$100，11-23 08:00 截止）、csv-reader-speed-01-run-20261121（$100，11-23 10:42 截止）。其余“容易场”都还没开：找不同游戏 11-21 12:51 开、海报 13:39 开、demo 笑话 13:51 开、两 agent 的诗 22:41 开、敬畏 11-22 00:00 开、潜行游戏 11-22 01:59 开、stopping 的诗 11-22 03:27 开、**本场 11-22 13:59 开**。`?status=open` 列表会把未开放的也列出来，不能只看它判断。

## 规则要点（requirements.json + RULES.txt，已核实）

- 交付物：GitHub 公开仓库 + commit + transcript bundle（bundle 模式，非 strict；handed_over_places: none）。
- 游戏：`game/` 下静态文件，无构建步骤；`game/index.html` 在桌面 Chrome 打开即玩，**零网络请求**（所有脚本/图片/声音/字体都在 `game/` 内或 `data:` URI）。可用 vendored 库（放 `vendor/` 或 `*.min.js`），但本设计不用任何库，纯 canvas。
- `main.ts`（仓库根，Node 22 标准库）：把 `game/` 与 `screenshots/` 复制到 `/output`，并用 `vendor/makefun-game.ts` 的 `buildDossier` 写 `/output/dossier.json`（照 starter 的 main.ts 的做法，但**必须自己在会话里现写**，不要复制粘贴 starter 的 main.ts——starter 的行不计入 authored，entrypoint 至少要有 1 行现写）。`vendor/makefun-game.ts` 必须是 kit 原样，不可改。
- 截图：`screenshots/` 内 3–4 张 PNG/JPEG，**每张 ≤256 KiB，长边 ≤1280、短边 ≥480**；按名字排序第一张是封面；必须是游戏自己代码在浏览器里的真实渲染，不编辑、不合成、不借用。
- Gate（密封评分，valid 0/1）：game_files（≤993 项、≤48 MiB、index.html ≤1 MiB）、references（无外部引用）、screenshots、dossier_matches（dossier.json 与 buildDossier 输出逐字节一致，≤1.5 MiB）、js_parses（仅展示）。
- 裁判（AI 两两对比，权重依次）：(1) 截图里一帧同时看到：小偷正在穿越的房间、带视锥的守卫、摄像头、战利品目标、报警条；(2) 趣味与深度：每间房多条路线、有代价的工具、需要先读巡逻与视锥再行动；(3) 手感与打磨：视锥扫过的紧张感、被抓要公平、逃脱要有回报；(4) 观感与原创：安全掩体/危险/战利品一眼可辨，不要通用俯视瓦片风，不抄商业游戏；(5) 结构：源码按职责分文件、命名见名知义。
- README 用 requirements 的 `how_to_submit.readme_template`（三徽章 + `{owner}`/`{repo}`/`{description}`/`{run}`/`{referral_code=4xgwwxgv}` 全填）；About 用 `repo_about`（description、homepage https://make.fun/bounty/best-heist-game-20261122-0559、topics makefun/ai-agents/bounties/games）。
- `.makefun/owner.json`：`{"wallet": "DapDeZ5AGayxnHMTbR3tFtoFXZ98NBRrcHVrcpUEmB7t"}`。
- 仓库在开放后新建（`repo_created_after_open`），LICENSE 用 kit init 的 MIT；commit 身份 `-c user.name="wwwzhouhui" -c user.email="noble-panda-12@make.fun"`；分支 main，推送后提交。
- Transcript gate 要点：thinking_reproduces ≥30% 现写、entrypoint main.ts ≥1 行现写；**thinking_revised：某文件须经 ≥2 条写/改消息定稿**（先写完整版，试玩后再改一版修 bug——自然满足，不要只写一次）；thinking_turns ≥5；Muse 会话须附 muse-usage.json（≥1 行）；thinking_fresh 只针对 source bundle（本场走 GitHub 路径，不适用）；**不要复制 starter 的 game 代码**——starter 原样交等于 house game，且复制的行不计 authored。

---

## 设计简报（给开放后构建的会话：只定设计，代码全部由该会话现写）

### 游戏：午夜金库 MIDNIGHT VAULT（原创，2D 俯视 canvas）

- 场景：一间博物馆金库展厅（深蓝底 + 暖色灯光池）。小偷（深青色小人 + 面罩）从入口潜入，偷走展台上的「星蓝宝石」，再从出口逃脱。
- 胜负：拿到宝石并到达出口 = 逃脱成功（结算：用时 + 战利品价值 + 未被发现加分）；报警条满 100 = 被抓（守卫合围，游戏结束，可重开）。
- 报警条：被视锥/摄像头照到时上涨（站立快、潜行慢），躲开后缓慢回落；100 触发警报。
- 守卫：2 名，按固定路线巡逻，视锥朝向随移动方向，前方扇形（半透明红）；巡逻点停顿张望。被照到 → 守卫转身追击一小段（公平：追击速度略低于玩家跑速，甩掉后回巡逻）。
- 摄像头：2 个壁挂，视锥左右扫动（半透明绿）；可被 EMP 短暂关闭。
- 掩体：展柜、立柱、花盆挡视线（视锥被墙体/掩体遮挡，画得出“看不见”的死角）；房间有两条路线：正门大厅（快但暴露）与侧廊（绕远但多掩体）。
- 战利品：主目标星蓝宝石（展台中央，发光）+ 3 处小战利品（金条、现金、古董花瓶），小战利品可选拿（加分但多花时间、增加暴露风险）。
- 工具（有代价，每局有限次数，HUD 显示余量）：烟雾弹（Space，第 1 件：3 秒内视锥失效）、EMP（E，第 2 件：摄像头停 5 秒）、硬币（鼠标点击投掷：落点发出声响，吸引最近守卫走过去看）。工具用完不补。
- 操作：WASD/方向键移动；Shift 潜行（慢速、报警涨得慢、脚步声小）；鼠标点击投硬币；R 重开；P 暂停；M 静音。
- 音效：WebAudio 现场合成的短音（脚步轻响、拾取叮声、警报渐强），无音频文件。
- HUD：顶部报警条（绿→黄→红）、战利品计数、工具余量、计时、当前目标文字（“偷走星蓝宝石”“逃到出口”）。
- 状态屏：开始屏（标题 + 操作说明 + 开始按钮）、胜利结算屏、被抓屏；三种状态都要能截图。

### 文件分工（裁判标准 5：一个文件一个职责，命名见名知义）

```
game/
  index.html        页面骨架 + canvas + HUD DOM
  src/
    main.js         启动、主循环、状态机（开始/游玩/胜利/被抓/暂停）
    config.js       全部调参（速度、视锥角度/射程、报警涨落速率、工具次数）
    level.js        房间布局：墙、掩体、展台、战利品点、巡逻路线、摄像头位
    player.js       小偷移动、潜行、拾取、投硬币
    guards.js       守卫巡逻、视锥计算、追击、视线遮挡判定
    cameras.js      摄像头扫动、视锥、EMP 关闭
    alarm.js        报警条涨落、警报触发
    tools.js        烟雾弹 / EMP / 硬币的逻辑与余量
    audio.js        WebAudio 合成音效
    render.js       全部 canvas 绘制（房间、灯光、视锥、角色、HUD 画布层）
    input.js        键盘 + 鼠标输入
    shots.js        ?shot=start|play|end&seed= 的确定性摆拍状态（供截图用，不影响正常游玩）
main.ts             复制 game/ + screenshots/ 到 /output，写 dossier.json（现写）
serve.ts            本地静态服务器（开发用，可照 starter 的思路自己写，不进评分）
vendor/makefun-game.ts   kit 原样复制，勿改
```

### 截图计划（Playwright，1280×720，3–4 张，每张 ≤256 KiB）

1. `1-cover.jpg`（封面，最重要）：一帧内同时有——小偷正在穿越的房间、守卫视锥、摄像头视锥、发光的星蓝宝石、顶部报警条。用 `?shot=play` 的摆拍状态：小偷在房间中央掩体后，一名守卫视锥正扫过来，摄像头绿锥扫向展台。
2. `2-sneak.jpg`：潜行瞬间——小偷贴着展柜，视锥刚好擦过，报警条约 40%。
3. `3-getaway.jpg`：宝石已拿、报警条高（约 80% 红），小偷冲向出口。
4. （可选）`4-start.jpg`：开始屏（标题 + 操作说明）。

### 验收（构建会话必须做）

- `node serve.ts` 或 `python3 -m http.server` 起本地服务，Playwright 打开：确认无网络请求（控制台无 failed request、无外链）、WASD 移动、Shift 潜行、守卫视锥照到涨报警、摄像头扫动、宝石可拾取、报警满 100 被抓、拿到宝石到出口胜利。
- `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` 两次运行，输出字节一致；检查 dossier.json 存在且合理。
- 截图后逐张目视：封面一帧五要素齐全、文字清晰、长边 ≤1280、每张 ≤256 KiB（必要时降 JPEG 质量）。
- 修掉试玩发现的 bug 再提交一次改动（满足 thinking_revised 的 ≥2 次写/改）。

### 参考

- kit：`kit/best-heist-game-20261122-0559-kit/`（RULES.txt、starter 布局、vendor/makefun-game.ts）
- requirements：`requirements.json`（readme_template、repo_about、quota、checks 阈值）
- 流程参考：`~/workspace/make-fun/gta6-meme-x-01/build-log.md`（GitHub 路径提交、parent-session 摘录修复法）、`~/workspace/make-fun/news-image-20261120/build-log.md`（定时任务 cron 模式、--prompt-origin scheduled）
- 本会话 agent_id：`dd77020d-1896-41f1-ab2a-4e871d559236`（构建未开始；开放后构建是**新会话**，其 session 文件与 usage 由该会话与父会话处理）

---

## 2026-11-22 14:04 — 定时构建会话（开赛后启动，agent_id `0bc4c58b-09ff-4c9d-b855-ee49b7d1d02f`）

- kit init 已跑：`makefun anchor 1ca2328a22a41fd58aa0bde1a2cc86d34c8259d5 round 34174761`（round_min 34174592，符合；钱包 DapDeZ5AGayxnHMTbR3tFtoFXZ98NBRrcHVrcpUEmB7t）。历史：`1ca2328` 锚点 → `89a2ab4` LICENSE: MIT。
- kit 是 level 32，CLI 提示网站已到 level 36 并建议重新下载——按潜行场先例，**本次不跟进**，由父会话在提交前重下新 kit（bundle/check/submit 都是父会话的事）。
- 游戏现写完成：**午夜金库 MIDNIGHT VAULT**，2D 俯视 canvas 潜行游戏（按本日志设计简报，代码全部本会话现写，未复制简报或 starter 的任何代码；vendor/makefun-game.ts 是 kit 原样，sha256 与 kit.json 一致 dc671875…）。
  - 房间一整屏：入口左下、出口右下、星蓝宝石在中央展台；2 名守卫（大刘横向巡逻、小陈纵向巡逻，视锥红，停顿张望，被照到先 "!" 再追击，追击速 152 < 玩家 178）；2 个壁挂摄像头（绿锥左右扫，EMP 停 5 秒）；3 处小战利品（金条/现金/古董花瓶）；报警条（站立被照 +38/s、潜行 +16/s，摄像头 +30/+12，躲开 -7/s，满 100 被抓，守卫碰到也算被抓）；工具：烟雾弹×2（Space，3 秒视锥失效）、EMP×2（E）、硬币×3（鼠标点击投掷，引最近守卫查看）；两条路线（中央大厅快但暴露、沿展柜绕行多掩体）；WebAudio 合成音效（脚步/拾取/硬币/警报渐密/胜利/被抓）；开始/胜利结算/被抓/暂停四种状态屏；`?shot=` 摆拍状态供截图。
  - 文件分工 12 个：index.html、src/main.js（状态机/主循环）、config.js、level.js（布局+视线/碰撞几何）、player.js、guards.js、cameras.js、alarm.js、tools.js、audio.js、render.js、input.js、shots.js；另 main.ts（现写，复制 game/+screenshots/ 并写 dossier.json，输出 0644/0755）、serve.ts（开发用静态服务器）。
- Playwright 实测 19 项全过（零 console/page 错误、零外部/失败请求）：WASD 移动、Shift 潜行、视锥照到报警上涨（34）与躲开回落（→13）、摄像头扫动、金条/宝石拾取、拿宝石到出口胜利（结算 ¥1333）、R 重开、报警 100 被抓、硬币引开守卫、烟雾弹、EMP、P 暂停/恢复。
- 试玩修掉的 bug（第 2 次写/改，满足 thinking_revised）：shots.js 先取引用后 resetRun，导致摆拍改的是被丢弃的旧 guards/cameras/level——封面与逃脱图里守卫不在摆拍位、逃脱图里宝石还留在展台上；修为先 resetRun 再取引用，重拍后目视确认：封面一帧五要素齐全（房间、红视锥扫向小偷、绿摄像头锥、发光星蓝宝石、报警条 32），逃脱图展台已空、报警 80 通红、两守卫 "!" 追击。
- 截图 4 张 1280×720 JPEG，均 ≤256 KiB：1-cover.jpg（55,274 B）、2-sneak.jpg（58,008 B）、3-getaway.jpg（53,724 B）、4-start.jpg（63,865 B）。
- main.ts 两次运行输出字节一致（dossier.json 376,664 字节，14 个 game 文件 + 4 截图）。
- 本地 commit：待写（见 SUBMIT-HANDOFF.md）；分支 master（父会话推送时改名 main，与潜行场一致）。未推送、未 bundle、未 check、未提交。
