# TODO — yoyant.com

> 更新：2026-07-31 · 上一会话主题：7 个新演示案例的 SEO 改造 + KST 真实客户案例页规划
> 恢复方式：读本文件 → 从「下一步」第 1 条开始

---

## 背景：这一轮在解决什么

7-30 新增 7 个演示案例（aveline / yunshang / reson / sunvolt / vitalink / goldenfields / cadence，
含子页共 19 个新 URL）。审计发现它们**没有按 7-29 那套 SEO 标准做**，而且存在比"关键词"更实际的风险。

**用户目标（已确认）**：案例要多、要被谷歌抓、要引流。所以**不 noindex，全部保留并继续加**，
方向是让"多"变成"多且可信且搜得到"。

**三个风险与对策（已达成共识）**
1. 标题写"案例/样板站"但页面正文只字未提 → 谷歌大概率改写标题，关键词白装
2. 虚构企业穿真企业外衣：挂 CE/MDR/ISO 13485/FDA/HACCP/BRC/Halal 认证声明、
   `since 2010`、可点企业邮箱用了**真实可注册域名**（非 `.example`）→ misleading content 灰区 + 虚假认证声明的法律/信任风险
3. 7 个行业页各锚一个行业词、全导向同一家公司 → doorway 形态嫌疑

→ **一条动作同时解掉三个**：每个演示页加**可见的 YOYANT 样板站标识 + 中文案例说明**。

---

## 已完成（本次会话，已 commit + push）

- [x] 7 个演示页 head 全量重写（脚本：`/private/tmp/.../scratchpad/patch_demo_seo.py`，逻辑已固化在 commit 里）
  - [x] 删掉 sunvolt / vitalink / goldenfields 三页**回归的 `meta keywords`**（7-29 P0 已清过一次，今天模板复制又带回来）
  - [x] **补 GA4 `G-0VE5EQQE12`**（19 个新页原本一个都没装 → 谷歌导流进来 GA 完全看不见，引流验证闭环是断的）
  - [x] 补 favicon / `robots: index,follow,max-image-preview:large` / `og:url`
  - [x] title + description 改为「行业关键词打头 + 品牌 + YOYANT 远洋数字」口径，7 页锚 7 个不同长尾词（见下表）
  - [x] 补 `CreativeWork + BreadcrumbList` JSON-LD，与 5 个老案例页同结构，已过 JSON 语法校验
- [x] 全站「核心团队来自**陌陌**、新浪、优酷」→「**阿里**」（5 处：index.html ×2、about ×2、services/software ×2 的 meta+正文）

### 7 页关键词分工（不许互相打架，新增案例也按此规则各占一个词）

| 演示页 | 锚定长尾词 |
|---|---|
| sunvolt | 新能源 / 光伏外贸独立站、出口企业英文官网 |
| vitalink | 医疗器械出海官网、医疗器械英文网站 |
| goldenfields | 食品农产品出口独立站 |
| cadence | B2B SaaS 官网设计、产品落地页设计 |
| reson | 跨境 DTC 独立站、3C 品牌独立站 |
| aveline | 服装品牌英文独立站（主打海外市场） |
| yunshang | 国风品牌出海独立站（主打文化品牌，与 aveline 分化避免自我竞争） |

---

## 下一步（按顺序做）

### 1. KST / Oilfield 真实客户案例页 ★（7-31 用户确认要做）

**问题**：首页 `index.html:468` 与 `services/web/index.html:344` 两处直接外链 `https://kst-power.com`，
点了**跳出站**——访客走了、权重送出去了、自己什么都没留下。而这是你为数不多的**真实上线客户案例**，
说服力天然高于 7 个虚构演示站，现在却只是个跳走的链接。

**关键认知**：谷歌不会因为你链出去就认定那是你的项目。链接信号方向是「你 → 对方」，
要建立归属关系得靠下面三件事。

- [ ] **建 `/work/kst-oilfield/` 案例页** —— 直接复刻 `/work/tarmeer/` 的结构（它已经是正确形态：
      案例页 + `<a class="btn" href="https://tarmeer.com" target="_blank">访问在线网站 ↗</a>`），
      不要另起炉灶
  - 页面里放「访问线上站 ↗」外链指向 kst-power.com
  - 锚定长尾词：`石油装备外贸站` / `B2B 双语外贸展示站` / `机械装备出口官网`
  - head 按文末「新增演示案例的标准流程」第 2 步配齐（GA4 / robots / canonical / og / JSON-LD）
  - JSON-LD 用 `CreativeWork` + `creator: {Organization: YOYANT 远洋数字}` —— **明确声明作者身份**
- [ ] **改两处卡片链接指向案例页**（而非直接外链）：
      `index.html:468`（现在是空锚 `<a class="case-link"></a>`，只有 aria-label，锚文本为空）、
      `services/web/index.html:344`（这处 `<a>` 包住了标题+描述，锚文本本身是充分的）
- [ ] 首页卡片 aria-label 补归属语义：`访问 Oilfield 网站…` → `查看 YOYANT 为 Oilfield 制作的中英双语外贸站`
- [ ] 进 sitemap + 接进相关案例互链

**并行推进（需你亲自联系客户，不是代码活）**
- [ ] 请 kst-power.com 页脚加 `Site by YOYANT` 回链 —— **建立归属关系最强的信号**，
      也是一条高相关性 dofollow 外链。7-29 SEO 方案第 119 行已列为「立即」级，一直没执行
- [ ] tarmeer.com 同样加页脚回链（Tarmeer 的案例页和访问链接**已经有了**，只差这条回链）

### 2. 演示页标识条 + 中文案例区 ★ 最高优先
**设计已定稿（用户从预览中选定，属 Phase 1 通过）**：`顶部细条 + 底部案例区`

- 顶部：36px 深色细条，常驻页面最顶（**非 fixed**，避免与各站 sticky nav 的 `top:0` 打架），
  内容 `◆ YOYANT 样板站 · <行业>独立站演示` + 右侧 `查看案例 →`
- 底部：页脚之后加「关于这个样板站」区，300-500 字**中文原创**说明（该行业客户痛点 + 这个站怎么解决），
  + 按钮 `[查看外贸独立站服务]` `[更多案例: ×2 相关演示]`
- 实现约定：样式用 `yo-` 前缀类 + 独立 `<style>` 注入，**不碰各演示站自身 CSS**；
  7 个站视觉方案各异，标识条要统一成 YOYANT 深色"外壳感"，不融进品牌配色
- 完成后走 Phase 2：截图验收（含 375px 移动端），通过再报完成

### 3. 假身份清理（用户已确认「全部改」）
- [ ] 邮箱域名换 `.example` 保留域名：
      `export@sunvolt-energy.com` → `export@sunvolt.example`；
      `export@vitalink-med.com` → `export@vitalink.example`；
      `sales@goldenfields-food.com` → `sales@goldenfields.example`
      （老 demo 页 BEDROCK/NORTHBEAM 当初就是 `.example`，沿用它们的做法）
- [ ] 认证声明改措辞，**保留视觉效果只改文字**，示例：
      `CE (MDR) · ISO 13485 · FDA registered` → `认证资质展示区（CE / ISO / FDA 位置示意）`
- [ ] 已盘点的待改清单（上次会话已 grep 出全量，重跑此命令即可复现）：
      `grep -oE '>[^<>]{4,150}<' work/{sunvolt,vitalink,goldenfields}/index.html | grep -iE 'certif|IEC|TÜV|ISO ?[0-9]|HACCP|BRC|Halal|FDA|MDR'`
      重点：sunvolt `IEC · TÜV · UL · CE certified`、`since 2010`；
      vitalink `CE · ISO 13485 · FDA registered`、`FDA 510(k)`、`CE / FDA clearance for global sale`；
      goldenfields `HACCP · ISO 22000 · BRC · Halal · FDA`、`audited to BRC`

### 4. h1 结构修复（本次未做完）
- [ ] `aveline / reson / yunshang` 首页各有 **2 个 h1**，第二个是商品名（`The Wool Coat` / `RESON One` / `Crimson Silk Qipao`，
      均为 `<h1 class="serif">`）→ 降为 h2，**改前先确认 CSS 是否有裸 `h1{}` 规则**，避免字号视觉回归
- [ ] `aveline/about/`、`reson/about/`、`yunshang/about/` **一个 h1 都没有**（首个大标题是 `<h2 class="serif">`）→ 提升为 h1

### 5. 内链网补齐
- [ ] 新 7 页目前只有一条 `/#cases` 出链（老案例页有全站导航 + About + 服务页 + 3 个相关案例）
- [ ] 把新 7 个案例接进老案例页的「相关案例」模块
- [ ] `/services/web/` 正文列出「外贸独立站案例」清单链去这 7 页
      → 形成 **服务页（核心词）← 案例页（长尾词）→ 演示（转化）** 三层结构

### 6. 站外（用户亲自执行，杠杆最大）
- [ ] **Search Console 提交 sitemap**（若还没提交，站内所有改动的收效会晚 1-2 周才看得到）
- [ ] 每个案例 = 1 篇 Behance/Dribbble 视觉帖 + 1 篇知乎复盘 + 1 篇 Medium/LinkedIn 英文版（canonical 回官网）
      → 7 个案例正好够撑两个月的分发节奏，详见 `docs/plans/seo-and-strength-plan.md` 第五章

---

## 新增演示案例的标准流程（以后每加一个都照做）

1. 做站（现有流程不变，图片一律过 `scripts/imgctl.py`）
2. head 配置：GA4 + favicon + robots + canonical + og(含 og:url) + 中文关键词 title/desc + JSON-LD
   —— **锚一个还没被占用的长尾词**（对照上面的分工表）
3. 加顶部标识条 + 底部中文案例区
4. 假身份检查：邮箱必须 `.example`，不写虚假认证/成立年份声明
5. 进 sitemap；接进首页 `#cases` + 相关案例互链
6. push 后 curl 线上确认 200 且改动可见

---

## 待确认 / 用户决策项

- 是否要给 7 个演示各建**独立中文案例页**（`/work/<name>-case/`）承接业务词？
  上次讨论时用户倾向"演示页本身被抓就行"，故当前方案是**就地改造**（下一步第 2、3 条）。
  若后续想更大化长尾覆盖，再上独立案例页这条路。
