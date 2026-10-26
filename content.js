/*
 * ===========================================================
 *  网站内容都在这个文件里 —— 改文字、加产品、换图片，只改这里
 * ===========================================================
 *
 *  图片：把照片放进 images/ 文件夹，然后写 "images/文件名.jpg"。
 *        没有照片的地方留空 ""，页面会用线稿图代替。
 *        这种大图版式非常吃照片：有实物照片后效果会好很多。
 *        - 轮播大图：横图 16:9，宽 1920px，500KB 以内
 *        - 配件卡片：白底或浅灰底的产品照最好看，4:3，宽 1200px，300KB 以内
 *
 *  配件里的内容是【示例】，请换成你自己的真实产品。
 */

window.SITE = {
  /* ---------- 基本信息 ---------- */
  name: "Vincent",
  title: "Vincent | 无人机配件与产品设计",   // 浏览器标签页标题
  intro: "我设计并制作 FPV 无人机配件和各种硬件产品：从建模、打样、试飞到小批量交付，一个人跑完整条线。",
  location: "常驻城市：待填（可接受出差）",
  status: "接受定制合作，也在看全职机会",

  /* ---------- 首页轮播大图 ----------
   * image: 背景照片（可以是 images/ 里的，也可以是网址）；不填就用 drawing 线稿
   * model: "fpv" 显示可拖动的 3D 无人机模型
   * drawing: "frame" 机架线稿 / "" 不要线稿
   * duration: 这一张停留几秒（默认 6 秒）
   * theme: "dark" 深色背景白字 / "light" 浅色背景黑字
   * links: 按钮。video 填 B 站 BV 号会弹出视频；href 填 "#parts" 之类跳到页面位置
   */
  hero: [
    {
      title: "5 寸竞速机架 V2",
      tagline: "T700 碳板，机臂单独可换，可小批量供货",
      model: "fpv",          // 3D 无人机模型（可拖动旋转）。不想要就删掉这一行，改成 drawing: "frame"
      duration: 12,          // 这一张停留 12 秒
      theme: "dark",
      links: [
        { text: "了解更多", part: "5 寸竞速机架 V2" },
        { text: "咨询定制", href: "#contact" },
      ],
    },
    {
      title: "模块化光伏板清洗车",
      tagline: "产品设计作品：现场清洗作业与交付验收实录",
      image: "https://i1.hdslb.com/bfs/archive/08e211427172574d6eb919876871472f331684e9.jpg@1920w_1080h",
      theme: "dark",
      links: [
        { text: "看工作实录", video: "BV1Sjn96XEcd" },
        { text: "看验收实录", video: "BV1Ujn96XEfv" },
      ],
    },
    {
      title: "你好，我是 Vincent",
      tagline: "结构、电子、试飞到量产，一个人跑完整条线",
      image: "",
      drawing: "",
      theme: "light",
      links: [
        { text: "了解我", href: "#about" },
        { text: "合作方式", href: "#cooperate" },
      ],
    },
  ],

  /* ---------- 联系方式（不想公开的留空 "" 就不显示） ---------- */
  contact: {
    email: "vincnetwork237@gmail.com",
    wechat: "Changing_Yeh",
    wechatQR: "",                 // 例如 "images/wechat-qr.png"
    phone: "",                    // 例如 "138 0000 0000"
    resume: "",                   // 简历 PDF，例如 "files/Vincent-简历.pdf"
    github: "",                   // 例如 "https://github.com/xxx"
    bilibili: "",                 // B 站个人主页，例如 "https://space.bilibili.com/xxx"
  },

  /* ---------- 无人机配件 ----------
   * category 只能用下面 categories 里的 key
   * specs 是规格表，想写几行写几行（点“了解详情”时显示）
   * badge 可选："在售" "可定制" "样品" "新品" 之类
   */
  categories: {
    frame: "机架",
    mount: "安装件",
    power: "动力",
    electronics: "电子",
  },

  parts: [
    {
      name: "5 寸竞速机架 V2",
      category: "frame",
      image: "",
      badge: "可小批量",
      summary: "真 X 布局，机臂可单独更换，炸机后 5 分钟换好。",
      specs: { "轴距": "220 mm", "材料": "T700 碳板 5 mm 机臂", "重量": "102 g", "适配": "20×20 / 30.5 飞控" },
    },
    {
      name: "3.5 寸涵道穿越机架",
      category: "frame",
      image: "",
      badge: "样品",
      summary: "带全包涵道，适合室内和近人拍摄。",
      specs: { "轴距": "155 mm", "材料": "碳板 + TPU 涵道", "重量": "68 g", "适配": "1404 电机" },
    },
    {
      name: "GoPro 可调角度相机座",
      category: "mount",
      image: "",
      badge: "在售",
      summary: "0–40° 每 5° 一档，TPU 一体打印，减震不发冻。",
      specs: { "材料": "TPU 95A", "重量": "9 g", "适配": "GoPro 9–12 / 大疆 Action" },
    },
    {
      name: "天线固定座（双 T 型）",
      category: "mount",
      image: "",
      badge: "在售",
      summary: "接收机天线 45° 固定，摔机不断线。",
      specs: { "材料": "TPU 95A", "重量": "2 g", "适配": "30 mm 立柱" },
    },
    {
      name: "电机座保护套",
      category: "power",
      image: "",
      badge: "可定制",
      summary: "保护电机底部线圈，按电机型号改孔位。",
      specs: { "材料": "TPU / PETG", "重量": "1.5 g × 4", "适配": "2207 / 2306 电机" },
    },
    {
      name: "XT60 加长转接线",
      category: "power",
      image: "",
      badge: "在售",
      summary: "硅胶线 + 镀金头，长度可按需求裁。",
      specs: { "线规": "12 AWG", "长度": "80 / 120 mm", "持续电流": "60 A" },
    },
    {
      name: "LED 尾灯与蜂鸣器板",
      category: "electronics",
      image: "",
      badge: "样品",
      summary: "自己画的小板，炸机后找飞机用，独立供电。",
      specs: { "尺寸": "20 × 12 mm", "供电": "5 V", "功能": "WS2812 ×4 + 失联报警" },
    },
    {
      name: "飞控转接板",
      category: "electronics",
      image: "",
      badge: "可定制",
      summary: "20×20 转 30.5 孔位，顺手把 GPS 和接收机焊盘引出来。",
      specs: { "尺寸": "36 × 36 mm", "板厚": "1.0 mm", "工艺": "沉金" },
    },
  ],

  /* ---------- 产品设计作品 ----------
   * videos：B 站视频，bvid 是网址里 BV 开头那串；cover 是封面（可选）
   * problem / approach / result 三段可选，写了会显示在大图下面
   */
  projects: [
    {
      name: "模块化光伏板清洗车",
      year: "2026",
      summary: "模块化结构的光伏板清洗车，两段视频分别记录了现场清洗作业和交付验收。",
      cover: "https://i2.hdslb.com/bfs/archive/f45f6f0fd91d5d810182e3f12d689e41469a22db.jpg@1920w_1080h",
      videos: [
        { label: "工作实录", bvid: "BV1Sjn96XEcd" },
        { label: "验收实录", bvid: "BV1Ujn96XEfv" },
      ],
      // 建议补上这三句，老板和 HR 最想看的就是这个：
      problem: "",   // 例如：人工清洗大面积光伏板效率低、有安全风险
      approach: "",  // 例如：你负责的部分、模块怎么拆分、用了什么驱动和清洗方式
      result: "",    // 例如：清洗效率、续航、交付给了谁、验收结论
    },
  ],

  /* ---------- 关于我（主要给 HR 看） ---------- */
  about: {
    heading: "把想法做成能交付的产品",
    text: "我做过竞速机架、各种安装件和电子小板，也做过光伏板清洗车这样的整机产品设计。习惯从建模一路做到试飞和小批量交付，每个环节都亲手过一遍。",
  },
  skills: [
    { icon: "cad", title: "结构设计", detail: "Fusion 360 / SolidWorks，熟悉公差、装配和碳板、3D 打印件的设计规则。" },
    { icon: "pcb", title: "电子", detail: "KiCad 画板、焊接，飞控与图传的接线和调试。" },
    { icon: "code", title: "固件与调参", detail: "Betaflight / INAV 参数调校，看 Blackbox 日志解决共振，会写简单脚本。" },
    { icon: "factory", title: "打样与量产", detail: "3D 打印、桌面 CNC、PCB 打样，能把样品推到稳定的小批量。" },
  ],

  /* ---------- 工作流程（真实的先后顺序） ---------- */
  process: [
    { step: "建模", detail: "出 3D 和图纸，先算好重量和重心。" },
    { step: "打样", detail: "3D 打印验证装配，碳板用 CNC 切，电路板找厂打样。" },
    { step: "试飞", detail: "装机实飞，看黑盒日志，改到没有共振和松动。" },
    { step: "交付", detail: "定版出图，小批量生产，附装配说明和备件。" },
  ],

  tools: [
    "Fusion 360", "SolidWorks", "KiCad", "Bambu Lab 3D 打印", "桌面 CNC",
    "Betaflight", "INAV", "Blackbox 日志分析", "ESP32 / Arduino", "焊台与热风枪",
  ],

  /* ---------- 合作方式（主要给合作老板看） ---------- */
  cooperate: [
    { icon: "drawing", title: "按图定制", detail: "机架、安装件、转接件，按你的图纸或样机改尺寸和孔位。" },
    { icon: "proto", title: "快速打样", detail: "3D 打印、CNC 碳板、小批量 PCB，打样一般 3–7 天。" },
    { icon: "box", title: "小批量供货", detail: "定版后稳定供货，每一款交付前都装机试飞过。" },
  ],

  /* ---------- 页脚 ---------- */
  // 用自定义域名在国内访问需要 ICP 备案，备案号填这里，例如 "粤ICP备2026000000号"
  icp: "",
};
