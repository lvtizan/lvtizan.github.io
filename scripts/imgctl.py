#!/usr/bin/env python3
"""
imgctl — 站点统一图片质量控制器（"秒开 + 视网膜"）
单一来源：所有案例封面 / hero / UI 截图的出图规格都走这里，别再手写 cwebp 参数。

原则：
  1. 清晰不靠图做大，靠"尺寸 = 显示宽 × 2(设备像素比)"。卡片显示 ~430px → 出到 860px 就是视网膜，再大肉眼看不到、纯浪费。
  2. 照片走 webp 高质量(q80~86)= 视觉无损、体积 1/10；只有 UI 截图低质量+缩小才会糊。
  3. 绝不上采样(源比目标小就保持原尺寸)。
  4. 原始大图(PNG 母版)留在仓库，脚本只产出 web 版；不删源。

用法：
  # 案例封面 / hero 大图(照片)：出 2 档 webp + 打印 srcset 片段
  python3 scripts/imgctl.py cover <源图> <key>
      → uploads/webp/c-<key>-sm.webp (760w q80)  普通屏
      → uploads/webp/c-<key>-lg.webp (1400w q84) 视网膜屏

  # UI 截图(要点开全屏放大看细节)：出灯箱高清源 + 网格缩略 + 打印 <figure> 片段
  python3 scripts/imgctl.py shot <源图> <name> [--crop 顶部裁剪高度px]
      → uploads/webp/<name>.webp       (1200w q86)  网格缩略
      → uploads/webp/<name>-full.webp  (≤2400w q92) 灯箱 data-full 高清源

  # 通用单张照片 → webp
  python3 scripts/imgctl.py photo <源图> <输出名> [--w 1400] [--q 84]

  批量：对多个源重复调用即可（封面每张一个 key）。
可选参数见下方 argparse。源图支持 PNG / JPEG / WebP。
"""
import argparse, os, sys
try:
    from PIL import Image
except ImportError:
    sys.exit("需要 Pillow：pip3 install pillow")

RESAMPLE = getattr(Image, "Resampling", Image).LANCZOS  # type: ignore[attr-defined]  # Pillow 10+ 与旧版兼容
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_OUT = os.path.join(REPO, "uploads", "webp")
SIZES = '(max-width:560px) 92vw, (max-width:900px) 46vw, 30vw'  # 3列/2列/1列 网格


def _load(src):
    im = Image.open(src)
    if im.mode not in ("RGB",):
        im = im.convert("RGB")
    return im


def _emit(im, out_path, width, q):
    """写一张 webp：只缩不放，LANCZOS，method=6。返回 (宽, KB)。"""
    w, h = im.size
    im2 = im
    if width and w > width:
        im2 = im.resize((width, round(h * width / w)), RESAMPLE)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    im2.save(out_path, "WEBP", quality=q, method=6)
    return im2.size[0], os.path.getsize(out_path) // 1024


def _web(path):
    """本地路径 → 站点绝对路径(/uploads/...)。"""
    rel = os.path.relpath(path, REPO).replace(os.sep, "/")
    return "/" + rel


def cmd_cover(a):
    im = _load(a.src)
    sm = os.path.join(a.out, f"c-{a.key}-sm.webp")
    lg = os.path.join(a.out, f"c-{a.key}-lg.webp")
    ws, ks = _emit(im, sm, a.sm, a.qsm)
    wl, kl = _emit(im, lg, a.lg, a.qlg)
    print(f"OK cover {a.key}: sm {ws}w {ks}KB  |  lg {wl}w {kl}KB")
    print("\n--- 贴进 HTML(封面 <img>) ---")
    print(f'<img src="{_web(sm)}" srcset="{_web(sm)} {ws}w, {_web(lg)} {wl}w" '
          f'sizes="{SIZES}" alt="{a.alt}" loading="lazy">')


def cmd_shot(a):
    im = _load(a.src)
    if a.crop and im.size[1] > a.crop:
        im = im.crop((0, 0, im.size[0], a.crop))
    cap = a.full if im.size[0] <= 3000 else max(a.full, 2600)
    thumb = os.path.join(a.out, f"{a.name}.webp")
    full = os.path.join(a.out, f"{a.name}-full.webp")
    wt, kt = _emit(im, thumb, a.thumb, a.qthumb)
    wf, kf = _emit(im, full, cap, a.qfull)
    print(f"OK shot {a.name}: thumb {wt}w {kt}KB  |  full {wf}w {kf}KB (灯箱高清源)")
    print("\n--- 贴进 HTML(灯箱 <figure>, 需引入 /assets/lightbox.js) ---")
    print(f'<figure><img loading="lazy" src="{_web(thumb)}" data-full="{_web(full)}" '
          f'alt="{a.alt}"><figcaption>{a.cap}</figcaption></figure>')


def cmd_photo(a):
    out = a.outfile if a.outfile.endswith(".webp") else a.outfile + ".webp"
    out = out if os.path.isabs(out) else os.path.join(a.out, out)
    w, k = _emit(_load(a.src), out, a.w, a.q)
    print(f"OK photo: {w}w {k}KB → {_web(out)}")


def main():
    p = argparse.ArgumentParser(description="站点图片质量控制器")
    p.add_argument("--out", default=DEFAULT_OUT, help="输出目录(默认 uploads/webp)")
    sub = p.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("cover", help="案例封面/hero(照片)→ srcset 两档")
    c.add_argument("src"); c.add_argument("key")
    c.add_argument("--sm", type=int, default=760); c.add_argument("--lg", type=int, default=1400)
    c.add_argument("--qsm", type=int, default=80); c.add_argument("--qlg", type=int, default=84)
    c.add_argument("--alt", default="案例封面"); c.set_defaults(func=cmd_cover)

    s = sub.add_parser("shot", help="UI 截图 → 缩略 + 灯箱高清源")
    s.add_argument("src"); s.add_argument("name")
    s.add_argument("--crop", type=int, default=0, help="顶部裁剪高度px(超长整页截图用)")
    s.add_argument("--full", type=int, default=2400); s.add_argument("--thumb", type=int, default=1200)
    s.add_argument("--qfull", type=int, default=92); s.add_argument("--qthumb", type=int, default=86)
    s.add_argument("--alt", default=""); s.add_argument("--cap", default=""); s.set_defaults(func=cmd_shot)

    ph = sub.add_parser("photo", help="通用单张照片 → webp")
    ph.add_argument("src"); ph.add_argument("outfile")
    ph.add_argument("--w", type=int, default=1400); ph.add_argument("--q", type=int, default=84)
    ph.set_defaults(func=cmd_photo)

    a = p.parse_args()
    a.func(a)


if __name__ == "__main__":
    main()
