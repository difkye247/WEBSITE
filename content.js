/*
 * ===========================================================
 *  网站内容都在这个文件里 —— 改文字、加产品、换图片，只改这里
 * ===========================================================
 *
 *  图片：把照片放进 images/ 文件夹，然后在下面写 "images/文件名.jpg"
 *        没有照片的条目留空 ""，页面会显示一张线稿占位图。
 *        建议：照片横图 4:3，宽 1200px 左右，单张 300KB 以内（加载快）。
 *
 *  下面的产品、项目都是【示例】，请换成你自己的真实内容。
 */

window.SITE = {
  /* ---------- 基本信息 ---------- */
  name: "Vincent",
  title: "Vincent 的 DIY 工坊",           // 浏览器标签页标题
  intro: "我设计并制作 FPV 无人机配件和各种小硬件：从建模、打样、试飞到小批量交付，一个人跑完整条线。",
  location: "常驻城市：待填（可接受出差）",
  status: "接受定制合作，也在看全职机会",  // 一句话说明你现在的状态

  /* ---------- 联系方式（不想公开的留空 "" 就不显示） ---------- */
  contact: {
    email: "vincnetwork237@gmail.com",
    wechat: "Changing_Yeh",
    wechatQR: "",                 // 例如 "images/wechat-qr.png"
    phone: "",                    // 例如 "138 0000 0000"
    resume: "",                   // 简历 PDF，例如 "files/Vincent-简历.pdf"
    github: "",                   // 例如 "https://github.com/xxx"
    bilibili: "",                 // 例如 "https://space.bilibili.com/xxx"
  },

  /* ---------- 给两类访客的速览 ---------- */
  forPartners: {
    heading: "如果你在找供应或定制",
    points: [
      "机架、安装件、转接件可按图纸或样机定制",
      "3D 打印 / CNC 碳板 / 小批量 PCB 都能打样",
      "打样周期一般 3–7 天，可小批量稳定供货",
      "交付前每一款都装机试飞过",
    ],
  },
  forRecruiters: {
    heading: "如果你在招人",
    points: [
      "结构设计：Fusion 360 / SolidWorks，熟悉公差与装配",
      "电子：KiCad 画板、焊接、飞控与图传调试",
      "固件：Betaflight / INAV 参数调校，会写简单脚本",
      "能独立把一个想法做成可量产的东西",
    ],
  },

  /* ---------- 无人机配件 ----------
   * category 只能用下面 categories 里的 key
   * specs 是规格表，想写几行写几行
   * badge 可选："在售" "可定制" "样品" 之类
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

  /* ---------- 其他作品 ----------
   * 可以放照片（image），也可以放 B 站视频（videos）。有视频时优先显示视频。
   * videos 里每一段：label 是切换按钮上的字，bvid 是视频网址里 BV 开头那串，
   *   cover 是封面图（可选；也可以把封面存到 images/ 里写本地路径，更稳）。
   * problem / approach / result 三段可选，写了就会显示成“问题 / 做法 / 结果”。
   */
  projects: [
    {
      name: "模块化光伏板清洗车",
      year: "2026",
      summary: "产品设计作品。模块化结构的光伏板清洗车，两段视频分别记录了现场清洗作业和交付验收。",
      videos: [
        { label: "工作实录", bvid: "BV1Sjn96XEcd", cover: "https://i1.hdslb.com/bfs/archive/08e211427172574d6eb919876871472f331684e9.jpg@960w_540h" },
        { label: "验收实录", bvid: "BV1Ujn96XEfv", cover: "https://i2.hdslb.com/bfs/archive/f45f6f0fd91d5d810182e3f12d689e41469a22db.jpg@960w_540h" },
      ],
      // 建议补上这三句，老板和 HR 最想看的就是这个：
      problem: "",   // 例如：人工清洗大面积光伏板效率低、有安全风险
      approach: "",  // 例如：你负责的部分、模块怎么拆分、用了什么驱动和清洗方式
      result: "",    // 例如：清洗效率、续航、交付给了谁、验收结论
    },
  ],

  /* ---------- 工作流程（真实的先后顺序） ---------- */
  process: [
    { step: "建模", detail: "Fusion 360 / SolidWorks 出 3D 和图纸，先算好重量和重心。" },
    { step: "打样", detail: "3D 打印验证装配，碳板件用 CNC 切，电路板找嘉立创打样。" },
    { step: "试飞", detail: "装机实飞，看黑盒日志，改到没有共振和松动。" },
    { step: "交付", detail: "定版出图，小批量生产，附装配说明和备件。" },
  ],

  tools: [
    "Fusion 360", "SolidWorks", "KiCad", "Bambu Lab 3D 打印", "桌面 CNC",
    "Betaflight", "INAV", "Blackbox 日志分析", "ESP32 / Arduino", "焊台 & 热风枪",
  ],

  /* ---------- 页脚 ---------- */
  // 用自定义域名在国内访问需要 ICP 备案，备案号填这里，例如 "粤ICP备2026000000号"
  icp: "",
};
