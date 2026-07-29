# YOYANT 远洋数字 — SEO 审计 + 实力感提升方案

> 日期：2026-07-29 · 域名：yoyant.com（当日新购，权重 0）· 静态站，GitHub Pages + Cloudflare Pages
> 本文档：现状审计 → 差距 → 关键词策略 → 优先级（P0 已落地 / P1 建议 / P2 大改待确认）

---

## 一、SEO 逐项现状与差距

### 1. 内容与元信息

| 项目 | 现状 | 差距/动作 |
|---|---|---|
| title 唯一性 | 首页/资源页/5 个真实案例页均唯一、含品牌名、描述准确 | 达标 |
| meta description | 各页唯一、1-3 句 | 达标（首页描述偏长但可接受） |
| meta keywords | **首页有 300+ 词的巨型 keywords 标签**，资源页 + 5 案例页也各有一个 | Google 不使用，且是堆砌信号 → **P0 全部删除（已做）** |
| h1/标题层级 | 每页唯一 h1，层级语义化 | 达标 |
| 图片 alt | 全站 img 均有描述性中文 alt | 达标 |
| 内链锚文本 | 描述性（"查看 Tarmeer 设计详情"等），无"点这里" | 达标；案例页之间互链缺失 → P1 |

### 2. 收录与规范化

| 项目 | 现状 | 差距/动作 |
|---|---|---|
| canonical | 首页/资源/5 案例/demo-ecommerce 均有且指向 yoyant.com | 达标 |
| **孤儿 demo 页** | work/demo-construction、demo-finance、demo-roofing：**无 canonical、无 robots 指令、不在 sitemap、无任何内链**（虚构英文品牌 BEDROCK/Aperture/NORTHBEAM） | 保留文件（可作提案演示素材），**P0 加 canonical + noindex（已做）**，确保不进 sitemap。不删的理由：可能被线下引用；noindex 后对 SEO 零影响 |
| sitemap.xml | 8 个真实 URL，均 200，含 lastmod | 达标 |
| robots.txt | Allow all + 两个 sitemap 声明 | 达标；`/me/sitemap.xml` 中 URL 为 yoyant.com/me/* 而 /me 页 canonical 指向 lvtizan.github.io，存在口径矛盾 → P1 待确认（/me 不动） |
| 重复内容 | 无 | 达标 |

### 3. 结构化数据（JSON-LD）

| 项目 | 现状 | 差距/动作 |
|---|---|---|
| 首页 | ProfessionalService + WebSite + OfferCatalog | 缺 **Organization 实体节点**（品牌实体识别的根）→ **P0 已补**（含 alternateName/founding/knowsLanguage/contactPoint，与 ProfessionalService 通过 @id 关联） |
| 案例页 | CreativeWork + BreadcrumbList，齐全 | 达标；**但 og:image 与 JSON-LD image 指向 lvtizan.github.io 旧域** → **P0 已改为 yoyant.com** |
| 资源页 | CollectionPage + BreadcrumbList | 达标；文章成独立 URL 后可加 Article/FAQPage → P1 |
| 首页 og:image / twitter:image | **缺失**（声明了 summary_large_image 却没图） | **P0 已补** |

### 4. 技术与体验

- 手写静态、无框架、字体 preconnect：Core Web Vitals 基线好，达标。
- 移动端响应式完整；lang 正确（中文页 zh-CN，demo 页 en）。
- 内联 CSS 每页独立（非阻塞外链），可接受；不属 SEO 问题。

---

## 二、实力感评估：现在像什么？

**结论：整体品质高于典型个人站，但多处措辞暴露"个人/工作室"身份，不足以支撑"中型公司"印象。**

暴露点（P0 文案已修，见下）：
1. 首页 meta description 与 hero："数字产品**工作室**"、"Digital Product **Studio**"。
2. About 区："**创始成员**计算机与美术学院双专业出身"——单数口吻。
3. 5 个案例页统一写"**我的**工作 · Contribution"——第一人称单数，最直接的个人信号。
4. 联系方式仅 gmail（bbtizan@gmail.com）+ 个人微信号 lvtizan——无企业邮箱/座机/地址。
5. 无公司维度信息：无成立时间、团队规模、职能分工、合作流程条款（合同/验收/售后）。

已具备的公司感资产（保持）：透明报价体系、五步交付流程、7 个多行业案例、资源学堂内容、明确交付标准（Lighthouse/源码交付/CDN）、大厂背景背书。

---

## 三、务实关键词策略

前提共识：**新域名权重 0，"建站/网站建设/软件设计"这类大词 3-6 个月内进不了 Google 前 5，更进不了百度前 5（百度对 GitHub Pages/Cloudflare 收录差且需要 ICP 备案生态）。**

策略分层：
1. **品牌词（第 1 个月就该拿下）**：`YOYANT`、`远洋数字`、`yoyant`。动作：Search Console 提交 + Organization schema（已做）+ 外部一致署名。
2. **长尾组合词（3 个月主战场，Google 为主）**：
   - 外贸独立站 + 修饰：`外贸独立站 手写静态`、`外贸独立站 建站 多语言`、`独立站 Lighthouse 优化`
   - 软件设计 + 场景：`工业软件界面设计`、`设备软件 UI 设计`、`B2B 供应链 App 设计`、`SaaS 中后台设计 外包`
   - 疑问词（资源学堂承接）：`新站 google 收录慢 怎么办`、`外贸网站 为什么不用 wordpress`
3. **中期词（6-12 个月）**：`外贸建站公司`、`高端网站定制`、`软件界面设计公司`。靠内容量 + 外链。
4. **市场判断**：目标客户找"出海/外贸/软件设计"服务时 Google 与微信生态并重；百度短期性价比低（无备案、无百度生态），**不投入专门百度优化，仅保证可收录**。真正的百度替代是微信内转化（已有微信咨询组件）。

---

## 四、优先级清单

### P0（本次已全部落地）
1. 删除全站 7 个 meta keywords 标签（首页巨型标签 + 资源页 + 5 案例页）。
2. 孤儿 demo 页 ×3：加 self-canonical + `noindex`，确认不在 sitemap。
3. 首页补 og:image / og:site_name / og:locale / twitter:image。
4. 5 个案例页 og:image + JSON-LD image 域名从 lvtizan.github.io 改为 yoyant.com。
5. 首页 JSON-LD 补 Organization 节点（实体识别），与 ProfessionalService/WebSite 关联。
6. 公司口径文案升级：工作室→公司、Studio→Company、"创始成员"→"核心团队"、案例页"我的工作"→"我们的工作"、导航 Studio→About。
7. 报价区下方加合作与交付说明（签约合作/分阶段验收/源码与设计文件交付/上线后支持）——真实、不夸大。

### P1（建议做，需少量确认/外部动作）
1. **Search Console + Bing Webmaster 提交 sitemap**（用户操作，最高杠杆；已有 google 验证文件）。
2. **企业邮箱**：Cloudflare Email Routing 免费做 `hello@yoyant.com` 转发到 gmail，全站替换展示邮箱（DNS 操作需用户授权）。
3. 资源学堂文章拆成独立 URL（现在是单页锚点，锚点不产生独立收录页；每篇独立 URL = 独立长尾入口 + Article schema）。
4. 案例页尾部互链 2-3 个相关案例（内链网 + 停留时长）。
5. 案例卡量化成果块（`.res`）目前 CSS 隐藏（display:none），打开可直接展示量化数据——涉及卡片视觉，待确认。
6. /me 与 yoyant.com 的 sitemap 口径矛盾：建议 robots.txt 移除 `/me/sitemap.xml` 行或 /me sitemap 改回 lvtizan.github.io URL（因"/me 不动"约束，待确认后再做）。
7. 每月 1-2 篇资源学堂新文章（内容新鲜度 + 长尾覆盖）。

### P2（较大改动，等用户确认，不擅自做）
1. **独立"关于/About"页面**：公司简介、团队职能矩阵（设计/工程/增长）、里程碑时间线、合作流程详解——中型公司实力感最大单项提升。
2. 独立服务落地页（/services/website/、/services/software-design/ 等）：每个服务词一个可排名 URL，是"建站/软件设计"类词的真正承载页。
3. 客户证言/合作品牌 Logo 墙（需真实素材，不可虚构）。
4. 英文版（/en/）+ hreflang：承接 "web design agency china" 类英文询盘。
5. 案例页加可量化成果数据（询盘增长/性能对比），需用户提供真实数据。

---

## 五、排名预期（务实）

- 1-2 周：品牌词收录并进前 3（前提：提交 Search Console）。
- 1-3 个月：资源学堂长尾疑问词开始出现在 20-50 名；案例相关组合词（如"工业软件界面设计 案例"）零星进前 20。
- 3-6 个月：持续加文章 + 少量外链（目录站、设计社区、GitHub 主页、合作方页脚署名）后，中长尾组合词进前 10。
- "建站""网站建设"大词：12 个月内不设预期，靠服务页 + 内容 + 外链长期做。
- 外链起步建议：合作客户站页脚署名（kst-power.com、tarmeer.com 已上线，是现成的相关性外链）、V2EX/即刻/站酷个人页、GitHub org 主页指回 yoyant.com。
