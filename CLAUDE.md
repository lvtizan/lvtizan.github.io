# YOYANT 站点 · 开发规范

本仓库 = **部署源本身**（push 即上线 GitHub Pages + Cloudflare Pages / yoyant.com），不是副本。改完只改本地、按用户节奏 push。

## 图片质量控制器（强制 · 所有案例复用）

**唯一出图入口 = `scripts/imgctl.py`。** 禁止再手写 `cwebp` 参数、禁止把大 PNG / 未处理大图直接挂到页面。做任何新案例、换任何图，图片一律先过这个控制器。

一句话原则：**清晰不靠图做大，靠"输出宽 = 显示宽 × 2(设备像素比)"**。卡片显示 ~430px → 出到 ~860px 就是视网膜，再大肉眼看不到、纯浪费流量（国内走 CF 境外节点尤其吃亏）。照片走 webp q80~86 = 视觉无损、体积 1/10；只有 UI 截图用低质量 + 缩小才会糊。

### 三种图对应三条命令

1) **案例封面 / hero（照片）** → 出 srcset 两档，普通屏拿小图、视网膜屏自动拿 2× 图：
```bash
python3 scripts/imgctl.py cover <源图> <key> --alt "说明"
# → uploads/webp/c-<key>-sm.webp (760w q80) + c-<key>-lg.webp (1400w q84)，并打印现成 <img> 片段
```
片段形如（浏览器按设备自动挑档）：
```html
<img src="/uploads/webp/c-KEY-sm.webp"
     srcset="/uploads/webp/c-KEY-sm.webp 760w, /uploads/webp/c-KEY-lg.webp 1400w"
     sizes="(max-width:560px) 92vw, (max-width:900px) 46vw, 30vw"
     alt="..." loading="lazy">
```

2) **UI 截图 / 要点开全屏放大看细节的图** → 出灯箱高清源 + 网格缩略（近无损、原尺寸不缩不糊）：
```bash
python3 scripts/imgctl.py shot <源图> <name> [--crop 顶部裁剪px] --cap "图注"
# → uploads/webp/<name>.webp (1200w q86 缩略) + <name>-full.webp (≤2400w q92 灯箱源)
```
必须放进 `<figure>` 并引入 `/assets/lightbox.js`；灯箱读 `data-full`，**点图开全屏看细节**：
```html
<figure><img loading="lazy" src="/uploads/webp/NAME.webp" data-full="/uploads/webp/NAME-full.webp" alt="..."><figcaption>图注</figcaption></figure>
```

3) **通用单张照片** → `python3 scripts/imgctl.py photo <源图> <输出名> [--w 1400] [--q 84]`

### 铁律
- **绝不上采样**：源比目标小就保持原尺寸（脚本已内置）。
- **原始大图（PNG 母版）留仓库不删**，脚本只产 web 版。母版放 `uploads/`，web 版放 `uploads/webp/`。
- 封面/hero 用 `cover`；能点开看细节的截图用 `shot` + 灯箱；别混。
- 新案例封面接进首页 `#cases` 网格时，`<img>` 必须是上面的 srcset 形态，不许直接 `src=` 一张大图。

## sitemap（新增/删除页面后必跑）

```bash
python3 scripts/gen_sitemap.py          # 重新生成 sitemap.xml
python3 scripts/gen_sitemap.py --check  # 只报差异不写（有差异退出码 1）
git config core.hooksPath .githooks     # 启用 pre-push 检查（换机器 clone 后跑一次）
```

`.githooks/pre-push` 会在 push 前自动跑 `--check`——本仓库 push 即上线、没有构建步骤兜底，漏更新 sitemap 不会报错，要等索引量不涨才察觉。

**只有「页面增删」才拦截，`lastmod` 漂移只提示不拦**（2026-08-02 修）。因为 `lastmod` 取 git 提交日期，一旦提交了 HTML 它必然变化；若也拦，等于每次改文案都要「提交 → 重跑生成器 → amend」两轮。而真正会造成损失的失败模式只有一个：**新页面没进 sitemap，搜索引擎永远发现不了**。lastmod 会在下次有人增删页面时一并刷新。

**唯一真相来源 = 页面自己的 `noindex` 标记**：脚本扫描全站 `index.html`，`<head>` 里带 `<meta name="robots" content="...noindex...">` 的一律跳过，其余全收。所以**不需要单独维护 sitemap 名单**——要排除某页，给它加 `noindex` 即可，两处自动一致。

- 已有条目的 `priority`/`changefreq` 原样保留（尊重手工调过的值），只刷新 `lastmod`；新页面按脚本里的 `RULES` 给默认值。
- `lastmod` 取该文件的 **git 最后提交日期**，页面没改日期就不动，符合语义。
- 当前有意排除的：`/go/`、`work/demo-*`（样板站）、各 demo 站的 `cart/` 与 `product/`（`?p=` 参数驱动，无参数时是空壳）。
- **新建 demo 电商站时记得给 `cart/` 和 `product/` 都加 `noindex`**——2026-08-02 就出过 cart 加了、product 漏了的情况。

## ⚠️ push 即公开（2026-08-02 踩坑）

**本仓库直接部署根目录、没有构建步骤过滤，所以 push 的任何文件都会公开在 `https://yoyant.com/<路径>`。**

当天实测发现 `/CLAUDE.md`、`/TODO.md`、`/docs/plans/*.md`（SEO 关键词策略）、`/scripts/deploy-ecs.sh`（含 `HOST` 与 `USER="root"`）全部返回 **200**，在公网可读。已用根目录 `_redirects` 挡成 404。

**三条铁律：**
1. **新增"非站点内容"的目录，必须同步在 `_redirects` 里加一条**，否则一 push 就公开
2. **真正的密钥永远不进仓库**——走环境变量（`deploy-ecs.sh` 读 `DEPLOY_SSH_PASSWORD` 就是对的做法）。`_redirects` 只防随手翻到，**不是保险箱**，文件仍在 CDN 上
3. **`_redirects` 的状态码只能用 301/302/303/307/308 或 200，绝不能写 404**——CF Pages 不支持 404，写了会让**整份规则失效、一条都不生效**。当天就踩过：表现是所有内部文件照常 200，极易误判成"规则没部署"或"静态资源优先级更高"。排查手法：加一条指向**不存在路径**的金丝雀规则，看它是否跳转，就能区分"规则未生效"与"规则生效但没匹配上"。

不能拦的：`.nojekyll`（GitHub Pages 需要）、`uploads/*`（母版被 `work/reson/` 引用）。

## 文案与排版规范

**① 能一行放下就不要两行。** 标题、副标题、按钮、卡片描述——凡是换行了先问"能不能把字砍短"，而不是先去加宽容器。加宽只是把松散藏起来，字还是那么多。砍不动再调容器。

**② 内容主体必须中文，装饰性 kicker 可以英文。**
- **主体**（大标题、正文、列表项、按钮）——中文站就用中文，不要突然崩出一句英文
- **kicker**（`.kick` 那类 11px 等宽大写 + `letter-spacing` 的小标签，如 `OUR APPROACH` / `GET STARTED`）——保持英文，这是全站统一的设计语言，不是"崩出来的英文"
- 同一区块内的并列项要么全中文要么全英文，**不要一条英文三条中文**

**③ 中文排版不能直接套英文的度量。**
- `max-width` 用 **`em` 不用 `ch`**——`ch` 基于 `0` 字符宽度，是为拉丁字母设计的；中文全角字符宽度 = `1em`，用 `em` 才能精确控制每行字数
- `line-height` 中文要比英文松：拉丁字母有大量 x-height 以下留白，中文字面占满字框，英文的 `1.14` 放到中文会挤。**中文大标题建议 ≥ 1.2**
- 2026-08-02 首页 `.method .quote` 就是这么改的：`19ch` → `13em`，`1.14` → `1.22`

## 案例页 / demo 规范
- demo 要**完整多页架构**、一切按实战走（电商需 首页/shop/product?p=/cart/about/journal + localStorage 购物车，独立 `<brand>_cart` 键防串）。
- 导航当前项要有**选中态下划线**（`.active` / 滚动高亮）。
- 不写"概念稿 / Concept"，直接当真实案例呈现；但不编造虚假客户名 / 客户评价 / 真实品牌 LOGO，只用原创设计。
- 分享图 `og-card.webp` 是**代码渲染**的字标图（`/tmp/og-card.html` 风格），不用 AI 生文字图。

## 部署与坑
- push main = 同步 GitHub Pages + CF Pages（voyant 项目，绑 yoyant.com）。CF 免费版对国内走境外节点、慢+不稳，是已知短板；治本需备案 + 国内 CDN。
- 微信分享强缓存 OG：改完旧卡还在，破缓存加从没用过的 `?参数`（如 `?wx=0731`）当新链接重抓；朋友圈只显示 og:title、不显示描述。
- RTK hook 会改写部分 Bash（cat/grep 显示类）；读文件用 Read 工具。
