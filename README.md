# Vincent 的 DIY 工坊（个人网站）

纯静态网站：不需要安装任何东西，没有构建步骤。

## 本地预览

直接双击 `index.html`，在浏览器里打开就行。

## 改内容

**只改 `content.js` 一个文件**：首页轮播大图、配件、产品设计、关于我、合作方式、联系方式都在里面，每一项都有中文注释。

- **首页轮播**：改 `hero`。每一张可以放一张大照片（16:9，宽 1920px），按钮可以弹出 B 站视频、打开某个配件的详情，或跳到页面某个位置。
- **这种大图版式非常依赖照片**：现在没有照片的地方用的是线稿图。拍几张干净背景的产品照换上，效果会提升很多。

- **加照片**：把照片放进 `images/`，然后在对应条目写 `image: "images/文件名.jpg"`。
  横图 4:3，宽 1200px 左右，每张尽量压到 300KB 以内（可以用 tinypng.com 压）。
- **加简历**：把 PDF 放进 `files/`，然后写 `resume: "files/文件名.pdf"`。页面会自动出现“下载简历”按钮。
- **微信二维码**：图片放进 `images/`，写 `wechatQR: "images/wechat-qr.png"`。
- **不想公开的联系方式**：留空 `""` 就不显示。
- **加一个配件**：复制 `parts` 里的一整段 `{ ... },`，粘贴后改内容。`category` 只能用 `frame` / `mount` / `power` / `electronics`（想加新类别，在 `categories` 里加一行）。

改完刷新浏览器就能看到效果。

### ⚠️ 每次更新后改一下版本号

`index.html` 里引用 CSS/JS 的地方都带着 `?v=20261026-pbr` 这样的版本号。**每次推送更新前，把它们统一改成一个新的**（比如当天日期 `?v=20261103`）。
否则 EdgeOne 的 CDN 和访客的浏览器可能继续用旧缓存，新功能（比如 3D 模型）就显示不出来。
自己检查线上效果时，用 `Cmd + Shift + R`（Windows 用 `Ctrl + F5`）强制刷新。

## 文件结构

```
index.html          页面骨架
content.js          ← 所有内容在这里
assets/css/style.css  样式
assets/js/main.js     把 content.js 渲染到页面
assets/favicon.svg    标签页小图标
images/             放照片
files/              放简历等文件
```

## 部署：GitHub + EdgeOne Pages

1. 在 GitHub 新建一个仓库（公开或私有都可以），把这个文件夹里的全部文件上传到仓库根目录。
   用命令行的话：
   ```bash
   cd 这个文件夹
   git init
   git add .
   git commit -m "first version"
   git branch -M main
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```
2. 打开腾讯云 EdgeOne Pages 控制台 → 新建项目 → 导入 Git 仓库 → 授权 GitHub → 选这个仓库。
3. 构建设置：
   - 框架预设：选“其他 / Other”（没有框架）
   - 构建命令：**留空**
   - 安装命令：**留空**
   - 输出目录：**`./`**（根目录）
4. 选加速区域 → 开始部署。以后每次 push 到 main 分支都会自动重新部署。

### ⚠️ 关于域名（国内访问很重要）

- EdgeOne Pages 给的默认域名，**在中国大陆只能通过控制台生成的预览链接访问，3 小时后失效**。所以要发给国内的老板 / HR，需要绑定**自己的域名**。
- 加速区域选“中国大陆可用区”或“全球可用区（含大陆）”：自定义域名**必须先做 ICP 备案**。备案好后把备案号填到 `content.js` 的 `icp`，页脚会自动显示并链接到工信部网站。
- 加速区域选“全球可用区（不含中国大陆）”：自定义域名**不需要备案**，国内也能打开，只是速度会慢一些。没备案的话可以先用这个方案上线。
