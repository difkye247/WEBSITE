/* 根据 content.js 渲染页面。一般不需要改这个文件。 */
(function () {
  "use strict";
  var S = window.SITE || {};
  var C = S.contact || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function get(o, p) { return p.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v === undefined || v === null || v === false) continue;
      if (k === "text") n.textContent = v;
      else if (k === "html") n.innerHTML = v;
      else if (k === "on") for (var ev in v) n.addEventListener(ev, v[ev]);
      else n.setAttribute(k, v);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function svg(inner, vb) { return '<svg viewBox="' + (vb || "0 0 48 48") + '" aria-hidden="true">' + inner + "</svg>"; }

  /* ================= 图标 ================= */
  var ICON = {
    all: svg('<rect x="8" y="8" width="13" height="13" rx="2"/><rect x="27" y="8" width="13" height="13" rx="2"/><rect x="8" y="27" width="13" height="13" rx="2"/><rect x="27" y="27" width="13" height="13" rx="2"/>'),
    frame: svg('<circle cx="11" cy="11" r="6"/><circle cx="37" cy="11" r="6"/><circle cx="11" cy="37" r="6"/><circle cx="37" cy="37" r="6"/><path d="M15 15l5 5M33 15l-5 5M15 33l5-5M33 33l-5-5"/><rect x="19" y="17" width="10" height="14" rx="2"/>'),
    mount: svg('<rect x="9" y="13" width="30" height="21" rx="3"/><circle cx="24" cy="23.5" r="6"/><path d="M17 34v6h14v-6"/>'),
    power: svg('<circle cx="24" cy="24" r="13"/><circle cx="24" cy="24" r="7"/><path d="M24 6v5M24 37v5M6 24h5M37 24h5"/>'),
    electronics: svg('<rect x="9" y="12" width="30" height="24" rx="2"/><rect x="19" y="19" width="10" height="10"/><path d="M21 19v-3M27 19v-3M21 29v3M27 29v3M19 22h-3M19 26h-3M29 22h3M29 26h3"/>'),
    cad: svg('<path d="M24 6l15 8.5v17L24 40 9 31.5v-17z"/><path d="M9 14.5L24 23l15-8.5M24 23v17"/>'),
    pcb: svg('<rect x="8" y="8" width="32" height="32" rx="3"/><rect x="18" y="18" width="12" height="12"/><path d="M14 14h4v4M34 14h-4v4M14 34h4v-4M34 34h-4v-4"/>'),
    code: svg('<path d="M17 15l-9 9 9 9M31 15l9 9-9 9M27 11l-6 26"/>'),
    factory: svg('<path d="M6 40V22l10 6v-6l10 6v-6l10 6V10h6v30z"/><path d="M12 34h4M22 34h4M32 34h4"/>'),
    drawing: svg('<rect x="7" y="9" width="34" height="30" rx="2"/><path d="M13 31l9-14 6 9 4-5 6 10z" stroke-linejoin="round"/><path d="M7 15h34"/>'),
    proto: svg('<path d="M14 38V24h20v14M18 24v-8h12v8M22 16V9h4v7"/><path d="M8 38h32"/>'),
    box: svg('<path d="M24 6l16 8v20l-16 8-16-8V14z"/><path d="M8 14l16 8 16-8M24 22v20M16 10l16 8"/>'),
    mail: svg('<rect x="6" y="11" width="36" height="26" rx="3"/><path d="M7 13l17 13 17-13"/>'),
    wechat: svg('<path d="M20 9C11.7 9 5 14.6 5 21.4c0 3.8 2.1 7.2 5.4 9.4L9 36l5.6-3c1.7.5 3.5.8 5.4.8"/><path d="M29 18c7.2 0 13 4.8 13 10.6 0 3.2-1.8 6-4.6 8L38 41l-4.6-2.4c-1.4.4-2.9.6-4.4.6-7.2 0-13-4.8-13-10.6S21.8 18 29 18z"/><circle cx="15" cy="19" r="1.2"/><circle cx="24" cy="19" r="1.2"/>'),
    phone: svg('<rect x="14" y="5" width="20" height="38" rx="4"/><path d="M21 37h6"/>'),
    resume: svg('<path d="M12 5h17l9 9v29H12z"/><path d="M29 5v9h9M18 22h14M18 28h14M18 34h9"/>'),
    video: svg('<rect x="5" y="10" width="38" height="28" rx="4"/><path d="M20 18v12l10-6z"/>'),
    github: svg('<path d="M24 5a19 19 0 0 0-6 37c1 .2 1.3-.4 1.3-.9v-3.3c-5.3 1.1-6.4-2.3-6.4-2.3-.9-2.2-2.1-2.8-2.1-2.8-1.7-1.2.1-1.2.1-1.2 1.9.1 2.9 2 2.9 2 1.7 2.9 4.5 2 5.6 1.6.2-1.2.7-2 1.2-2.5-4.2-.5-8.7-2.1-8.7-9.4 0-2.1.7-3.8 2-5.1-.2-.5-.8-2.4.2-5 0 0 1.6-.5 5.2 2a18 18 0 0 1 9.5 0c3.6-2.5 5.2-2 5.2-2 1 2.6.4 4.5.2 5 1.2 1.3 2 3 2 5.1 0 7.3-4.5 8.9-8.7 9.4.7.6 1.3 1.8 1.3 3.6v5.3c0 .5.3 1.1 1.3.9A19 19 0 0 0 24 5z"/>'),
  };
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';

  /* 产品线稿（没有照片时代替产品图） */
  var RENDER = {
    frame: '<svg viewBox="0 0 300 240"><ellipse class="r-shadow" cx="150" cy="222" rx="120" ry="10"/>' +
      '<g transform="translate(150 118)"><g class="r-stroke r-fill">' +
      '<rect x="-9" y="-128" width="18" height="128" rx="9" transform="rotate(50)"/><rect x="-9" y="-128" width="18" height="128" rx="9" transform="rotate(-50)"/>' +
      '<rect x="-9" y="-128" width="18" height="128" rx="9" transform="rotate(130)"/><rect x="-9" y="-128" width="18" height="128" rx="9" transform="rotate(-130)"/>' +
      '<rect x="-36" y="-52" width="72" height="104" rx="8"/>' +
      '<circle cx="98" cy="-82" r="17"/><circle cx="-98" cy="-82" r="17"/><circle cx="98" cy="82" r="17"/><circle cx="-98" cy="82" r="17"/></g>' +
      '<rect class="r-accent" x="-17" y="-17" width="34" height="34" rx="3"/>' +
      '<g class="r-stroke"><circle cx="98" cy="-82" r="5"/><circle cx="-98" cy="-82" r="5"/><circle cx="98" cy="82" r="5"/><circle cx="-98" cy="82" r="5"/><rect x="-14" y="-66" width="28" height="22" rx="4" fill="#fff"/></g></g></svg>',
    mount: '<svg viewBox="0 0 300 240"><ellipse class="r-shadow" cx="150" cy="214" rx="96" ry="9"/>' +
      '<g class="r-stroke"><path class="r-fill" d="M70 200h160l-14-40H84z"/><path class="r-fill" d="M110 160l12-38h56l12 38"/>' +
      '<rect class="r-fill" x="86" y="36" width="128" height="88" rx="12"/><circle class="r-fill" cx="150" cy="80" r="28"/><circle cx="150" cy="80" r="15"/>' +
      '<rect x="186" y="46" width="16" height="10" rx="2"/></g><path class="r-accent" d="M128 140h44M132 150h36"/></svg>',
    power: '<svg viewBox="0 0 300 240"><ellipse class="r-shadow" cx="150" cy="214" rx="88" ry="9"/>' +
      '<g class="r-stroke"><path class="r-fill" d="M82 120v58a68 18 0 0 0 136 0v-58"/><ellipse class="r-fill" cx="150" cy="120" rx="68" ry="18"/>' +
      '<path d="M82 150a68 18 0 0 0 136 0M100 170v14M126 176v14M174 176v14M200 170v14"/>' +
      '<path class="r-fill" d="M134 120V58a16 5 0 0 1 32 0v62"/><ellipse class="r-fill" cx="150" cy="58" rx="16" ry="5"/></g>' +
      '<ellipse class="r-accent" cx="150" cy="120" rx="40" ry="10"/></svg>',
    electronics: '<svg viewBox="0 0 300 240"><ellipse class="r-shadow" cx="150" cy="210" rx="112" ry="9"/>' +
      '<g class="r-stroke"><path class="r-fill" d="M50 150l100-56 100 56-100 56z"/><path d="M50 150v8l100 56 100-56v-8M150 206v8"/>' +
      '<path class="r-fill" d="M124 146l26-15 26 15-26 15z"/><path d="M124 146v6l26 15 26-15v-6"/>' +
      '<circle cx="86" cy="150" r="5"/><circle cx="214" cy="150" r="5"/><circle cx="150" cy="114" r="5"/><circle cx="150" cy="186" r="5"/></g>' +
      '<path class="r-accent" d="M96 140l40-22M164 118l40 22M108 168l18 10"/></svg>',
  };
  function render(cat) { return el("div", { class: "render", html: RENDER[cat] || RENDER.frame, role: "img", "aria-label": "产品示意图" }); }

  /* 首页机架工程图（白线） */
  var HERO_FRAME = '<svg viewBox="-20 0 560 520" aria-hidden="true">' +
    '<g class="art-faint"><circle cx="130" cy="130" r="106"/><circle cx="390" cy="130" r="106"/><circle cx="130" cy="390" r="106"/><circle cx="390" cy="390" r="106"/></g>' +
    '<g class="art-stroke art-fill" transform="translate(260 260)">' +
    '<rect x="-13" y="-196" width="26" height="196" rx="13" transform="rotate(45)"/><rect x="-13" y="-196" width="26" height="196" rx="13" transform="rotate(-45)"/>' +
    '<rect x="-13" y="-196" width="26" height="196" rx="13" transform="rotate(135)"/><rect x="-13" y="-196" width="26" height="196" rx="13" transform="rotate(-135)"/></g>' +
    '<g class="art-stroke" style="fill:#16191C"><rect x="205" y="180" width="110" height="160" rx="10"/><rect x="238" y="160" width="44" height="34" rx="5"/>' +
    '<circle cx="130" cy="130" r="24"/><circle cx="390" cy="130" r="24"/><circle cx="130" cy="390" r="24"/><circle cx="390" cy="390" r="24"/></g>' +
    '<g class="art-stroke"><circle cx="260" cy="170" r="9"/><rect x="222" y="312" width="76" height="8" rx="3"/>' +
    '<circle cx="130" cy="130" r="7"/><circle cx="390" cy="130" r="7"/><circle cx="130" cy="390" r="7"/><circle cx="390" cy="390" r="7"/></g>' +
    '<rect class="art-accent" x="234.5" y="244.5" width="51" height="51" rx="4"/>' +
    '<g class="art-faint" style="stroke-dasharray:none"><path d="M416 130h110M416 390h110"/></g>' +
    '<path class="art-accent" d="M516 130v260" style="stroke-width:1"/>' +
    '<text transform="translate(506 260) rotate(-90)" text-anchor="middle">156 mm</text>' +
    '<text x="260" y="508" text-anchor="middle">轴距 220 mm</text></svg>';

  /* ================= 文字绑定 ================= */
  document.querySelectorAll("[data-bind]").forEach(function (n) {
    var v = get(S, n.getAttribute("data-bind"));
    if (v) n.textContent = v; else if (!n.textContent.trim()) n.hidden = true;
  });
  if (S.title) document.title = S.title;

  /* ================= 工具函数 ================= */
  var parts = S.parts || [];
  var cats = S.categories || {};
  function findPart(name) { for (var i = 0; i < parts.length; i++) if (parts[i].name === name) return parts[i]; return null; }
  function inquiryHref(name) {
    if (!C.email) return "#contact";
    return "mailto:" + C.email + "?subject=" + encodeURIComponent("咨询定制：" + name);
  }
  function bvUrl(bvid) { return "https://www.bilibili.com/video/" + bvid + "/"; }
  function bg(src) {
    var img = el("img", { src: src, alt: "", decoding: "async", referrerpolicy: "no-referrer" });
    var wrap = el("div", { class: "slide-bg" }, [img]);
    img.addEventListener("error", function () { wrap.remove(); });
    return wrap;
  }
  function more(text, attrs) {
    var a = attrs || {};
    a.class = "more"; a.text = text;
    if (a.href) return el("a", a);
    a.type = "button";
    return el("button", a);
  }
  function copy(value, btn) {
    var old = btn.textContent;
    var done = function () { btn.textContent = "已复制"; setTimeout(function () { btn.textContent = old; }, 1600); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(value).then(done, fb); else fb();
    function fb() {
      var t = el("textarea"); t.value = value; t.style.position = "fixed"; t.style.opacity = "0";
      document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); done(); } catch (e) { btn.textContent = "请手动复制"; }
      t.remove();
    }
  }

  /* ================= 弹窗 ================= */
  var modal = $("#modal"), modalBody = $("#modal-body");
  function openModal(node, cls) {
    modal.className = "modal" + (cls ? " " + cls : "");
    modalBody.replaceChildren(node);
    if (!modal.open) {
      if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
    }
    document.body.classList.add("locked");
  }
  function closeModal() { if (modal.open) modal.close(); }
  modal.addEventListener("close", function () { modalBody.replaceChildren(); document.body.classList.remove("locked"); });
  $("#modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

  function openPart(p) {
    var specs = el("dl", { class: "specs" });
    Object.keys(p.specs || {}).forEach(function (k) { specs.append(el("dt", { text: k }), el("dd", { text: p.specs[k] })); });
    openModal(el("div", { class: "detail" }, [
      el("div", { class: "detail-media" }, [p.image ? el("img", { src: p.image, alt: p.name }) : render(p.category)]),
      el("div", { class: "detail-body" }, [
        p.badge ? el("span", { class: "badge", text: p.badge }) : null,
        el("h2", { id: "modal-title", text: p.name }),
        p.summary ? el("p", { class: "summary", text: p.summary }) : null,
        specs.childNodes.length ? specs : null,
        el("a", { class: "btn", href: inquiryHref(p.name), text: "咨询定制" }),
        C.email ? el("p", { class: "detail-note", text: "会打开邮件，标题已经帮你填好。" + (C.wechat ? "也可以加微信 " + C.wechat + " 直接聊。" : "") }) : null,
      ]),
    ]));
  }

  function projectOf(bvid) {
    var out = null;
    (S.projects || []).forEach(function (p) { (p.videos || []).forEach(function (v) { if (v.bvid === bvid) out = { p: p, v: v }; }); });
    return out;
  }
  function labelFor(bvid) { var r = projectOf(bvid); return r ? r.p.name + "：" + r.v.label : "视频"; }
  function openVideo(bvid) {
    var r = projectOf(bvid);
    var others = r ? r.p.videos.filter(function (v) { return v.bvid !== bvid; }) : [];
    var bar = el("div", { class: "video-bar" }, [
      el("span", { id: "modal-title", text: labelFor(bvid) }),
      el("div", { class: "links" }, others.map(function (v) {
        return more("看" + v.label, { on: { click: function () { openVideo(v.bvid); } } });
      }).concat([more("在 B 站打开", { href: bvUrl(bvid), target: "_blank", rel: "noopener" })])),
    ]);
    openModal(el("div", {}, [
      el("div", { class: "video-frame" }, [el("iframe", {
        src: "https://player.bilibili.com/player.html?bvid=" + bvid + "&autoplay=1&high_quality=1&danmaku=0",
        title: labelFor(bvid), allow: "autoplay; fullscreen; picture-in-picture", allowfullscreen: "true", scrolling: "no", frameborder: "0",
      })]),
      bar,
    ]), "video");
  }

  function linkFor(l) {
    if (l.video) return more(l.text, { on: { click: function () { openVideo(l.video); } } });
    if (l.part) { var p = findPart(l.part); if (p) return more(l.text, { on: { click: function () { openPart(p); } } }); return more(l.text, { href: "#parts" }); }
    var ext = /^https?:/.test(l.href || "");
    return more(l.text, { href: l.href || "#", target: ext ? "_blank" : null, rel: ext ? "noopener" : null });
  }

  /* ================= 顶栏 ================= */
  var menuBtn = $("#menu-btn"), navLinks = $("#nav-links");
  menuBtn.addEventListener("click", function () {
    var open = menuBtn.getAttribute("aria-expanded") !== "true";
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    navLinks.classList.toggle("open", open);
  });
  navLinks.addEventListener("click", function (e) {
    if (e.target.tagName === "A") { menuBtn.setAttribute("aria-expanded", "false"); navLinks.classList.remove("open"); }
  });
  if (C.resume) { var rs = $("#nav-resume"); rs.hidden = false; rs.href = C.resume; rs.target = "_blank"; }

  /* ================= 轮播 ================= */
  var hero = $("#hero"), slidesBox = $("#slides"), dotsBox = $("#dots"), pauseBtn = $("#pause");
  var heroData = S.hero || [];
  var slides = heroData.map(function (h, i) {
    var theme = h.theme === "light" ? "light" : "dark";
    var kids = [
      h.image ? bg(h.image) : null,
      el(i === 0 ? "h1" : "h2", { text: h.title }),
      h.tagline ? el("p", { class: "tagline", text: h.tagline }) : null,
      (h.links || []).length ? el("div", { class: "links" }, h.links.map(linkFor)) : null,
    ];
    var stage = null;
    if (!h.image && h.model) {
      stage = el("div", { class: "slide-3d" });
      var exBtn = el("button", { type: "button", class: "explode-btn", "aria-pressed": "false",
        html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v5M12 16v5M5 12H3M21 12h-2"/><rect x="8" y="9" width="8" height="6" rx="1.5"/></svg><span>拆解视图</span>' });
      kids.push(stage, el("div", { class: "ctrl-3d" }, [
        el("p", { class: "hint-3d", html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 4 0 0 0 16 0M20 12a8 4 0 0 0-16 0"/><path d="M17 15.5l3-3.5 1 4"/></svg>按住拖动，360° 查看' }),
        exBtn,
      ]));
    } else if (!h.image && h.drawing === "frame") kids.push(el("div", { class: "slide-art", html: HERO_FRAME }));
    if (!h.image && !h.drawing && theme === "light") {
      var facts = el("ul", { class: "intro-facts" }, (S.skills || []).map(function (s) { return el("li", { text: s.title }); }));
      if (S.status) facts.appendChild(el("li", { text: S.status }));
      kids.push(el("div", { class: "intro-art" }, [facts]));
    }
    var s = el("div", { class: "slide " + theme + (theme === "dark" ? " on-dark" : "") + (stage ? " has-3d" : ""), role: "group", "aria-roledescription": "slide", "aria-label": (i + 1) + " / " + heroData.length }, kids);
    slidesBox.appendChild(s);
    s._dur = h.duration ? h.duration * 1000 : 6000;
    if (stage) {
      var v = window.Drone3D ? window.Drone3D.mount(stage, { onInteract: function () { setPaused(true); } }) : { ok: false };
      if (v.ok) {
        s._viewer = v;
        exBtn.addEventListener("click", function () {
          var on = !v.isExploded(); v.setExploded(on); setPaused(true);
          exBtn.setAttribute("aria-pressed", String(on));
          exBtn.querySelector("span").textContent = on ? "组装还原" : "拆解视图";
        });
      } else { stage.className = "slide-art"; stage.innerHTML = HERO_FRAME; var cn = s.querySelector(".ctrl-3d"); if (cn) cn.remove(); }
    }
    return s;
  });
  var cur = 0, timer = null, paused = reduceMotion;
  function show(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle("is-active", k === cur); s.setAttribute("aria-hidden", String(k !== cur)); s.inert = k !== cur; });
    dotsBox.querySelectorAll(".dot").forEach(function (d, k) { d.setAttribute("aria-current", String(k === cur)); });
    hero.classList.toggle("is-light", slides[cur].classList.contains("light"));
    slides.forEach(function (s, k) { if (s._viewer) { if (k === cur) s._viewer.start(); else s._viewer.stop(); } });
  }
  function stopTimer() { clearTimeout(timer); }
  function schedule() {
    stopTimer();
    if (!paused && slides.length > 1) timer = setTimeout(function () { show(cur + 1); schedule(); }, slides[cur]._dur);
  }
  slides.forEach(function (_, i) {
    dotsBox.appendChild(el("button", { type: "button", class: "dot", "aria-label": "第 " + (i + 1) + " 张", on: { click: function () { show(i); schedule(); } } }));
  });
  function setPaused(p) {
    paused = p; pauseBtn.classList.toggle("is-paused", p);
    pauseBtn.setAttribute("aria-label", p ? "播放轮播" : "暂停轮播"); schedule();
  }
  pauseBtn.addEventListener("click", function () { setPaused(!paused); });
  slidesBox.addEventListener("mouseenter", stopTimer);
  slidesBox.addEventListener("mouseleave", schedule);
  slidesBox.addEventListener("focusin", stopTimer);
  slidesBox.addEventListener("focusout", schedule);
  var x0 = null;
  slidesBox.addEventListener("touchstart", function (e) { x0 = e.target.tagName === "CANVAS" ? null : e.touches[0].clientX; }, { passive: true });
  slidesBox.addEventListener("touchend", function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) { show(cur + (dx < 0 ? 1 : -1)); schedule(); }
  });
  if (slides.length) { show(0); setPaused(paused); } else hero.hidden = true;
  if (slides.length < 2) $(".hero-ctrl").hidden = true;

  /* ================= 配件 ================= */
  var tilesBox = $("#tiles"), catsBox = $("#cats");
  var tiles = parts.map(function (p) {
    var t = el("article", { class: "tile", "data-cat": p.category }, [
      el("div", { class: "tile-text" }, [
        p.badge ? el("span", { class: "badge", text: p.badge }) : null,
        el("h3", { text: p.name }),
        p.summary ? el("p", { class: "summary", text: p.summary }) : null,
        el("div", { class: "links" }, [
          more("了解详情", { on: { click: function () { openPart(p); } } }),
          more("咨询定制", { href: inquiryHref(p.name) }),
        ]),
      ]),
      el("div", { class: "tile-media" }, [p.image ? el("img", { src: p.image, alt: p.name, loading: "lazy", decoding: "async" }) : render(p.category)]),
    ]);
    tilesBox.appendChild(t);
    return t;
  });
  function filter(key) {
    catsBox.querySelectorAll(".cat").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.key === key)); });
    var shown = [];
    tiles.forEach(function (t) {
      var on = key === "all" || t.dataset.cat === key;
      t.hidden = !on; t.classList.remove("big", "rev");
      if (on) shown.push(t);
    });
    // “全部”时第一张做成大卡片；如果最后一行只剩一张，也把它做成大卡片（图片在左）
    if (key === "all" && shown.length > 1) {
      shown[0].classList.add("big");
      if ((shown.length - 1) % 3 === 1) shown[shown.length - 1].classList.add("big", "rev");
    }
  }
  var usedCats = Object.keys(cats).filter(function (k) { return parts.some(function (p) { return p.category === k; }); });
  if (usedCats.length > 1) {
    ["all"].concat(usedCats).forEach(function (k) {
      catsBox.appendChild(el("button", {
        type: "button", class: "cat", "data-key": k, "aria-pressed": "false",
        html: (ICON[k] || ICON.all) + "<span>" + (k === "all" ? "全部" : cats[k]) + "</span>",
        on: { click: function () { filter(k); } },
      }));
    });
  } else catsBox.hidden = true;
  filter("all");
  if (!parts.length) $("#parts").hidden = true;

  /* ================= 产品设计 ================= */
  var plist = $("#project-list");
  (S.projects || []).forEach(function (p) {
    var vids = p.videos || [];
    var banner = el("div", { class: "banner on-dark" }, [
      p.cover || p.image ? bg(p.cover || p.image) : null,
      el("h3", { text: p.name }),
      p.summary ? el("p", { class: "tagline", text: p.summary }) : null,
      vids.length ? el("div", { class: "links" }, vids.map(function (v) { return more("看" + v.label, { on: { click: function () { openVideo(v.bvid); } } }); })) : null,
      vids.length ? el("button", { type: "button", class: "play-big", "aria-label": "播放：" + labelFor(vids[0].bvid), html: PLAY,
        on: { click: function () { openVideo(vids[0].bvid); } } }) : null,
      p.year ? el("span", { class: "year", text: p.year }) : null,
    ]);
    var story = [["问题", p.problem], ["做法", p.approach], ["结果", p.result]].filter(function (r) { return r[1]; });
    plist.appendChild(el("article", { class: "project" }, [
      banner,
      story.length ? el("dl", { class: "story container" }, story.map(function (r) { return el("div", {}, [el("dt", { text: r[0] }), el("dd", { text: r[1] })]); })) : null,
    ]));
  });
  if (!(S.projects || []).length) $("#projects").hidden = true;

  /* ================= 关于我 ================= */
  (S.skills || []).forEach(function (s) {
    $("#skills").appendChild(el("div", { class: "skill", html: ICON[s.icon] || ICON.cad }, [el("h3", { text: s.title }), el("p", { text: s.detail })]));
  });
  (S.process || []).forEach(function (s) { $("#process").appendChild(el("li", {}, [el("h4", { text: s.step }), el("p", { text: s.detail })])); });
  (S.tools || []).forEach(function (t) { $("#tools").appendChild(el("li", { text: t })); });

  /* ================= 合作方式 ================= */
  (S.cooperate || []).forEach(function (c) {
    var card = el("div", { class: "coop-card on-dark" }, [
      el("h3", { text: c.title }),
      el("p", { text: c.detail }),
      el("div", { class: "links" }, [more("咨询", { href: inquiryHref(c.title) })]),
    ]);
    card.insertAdjacentHTML("beforeend", ICON[c.icon] || ICON.box);
    $("#coop").appendChild(card);
  });
  if (!(S.cooperate || []).length) $("#cooperate").hidden = true;

  /* ================= 联系 ================= */
  var quick = $("#quick");
  function q(icon, title, val, linkNodes, extra) {
    quick.appendChild(el("div", { class: "q", html: ICON[icon] }, [
      el("h3", { text: title }), val ? el("p", { class: "val", text: val }) : null,
      el("div", { class: "links" }, linkNodes), extra || null,
    ]));
  }
  if (C.email) {
    var cb = more("复制", {}); cb.addEventListener("click", function () { copy(C.email, cb); });
    q("mail", "邮件", C.email, [more("发邮件", { href: "mailto:" + C.email }), cb]);
  }
  if (C.wechat) {
    var wb = more("复制微信号", {}); wb.addEventListener("click", function () { copy(C.wechat, wb); });
    q("wechat", "微信", C.wechat, [wb], C.wechatQR ? el("img", { class: "qr", src: C.wechatQR, alt: "微信二维码", loading: "lazy" }) : null);
  }
  if (C.phone) q("phone", "电话", C.phone, [more("拨打", { href: "tel:" + C.phone.replace(/\s/g, "") })]);
  if (C.resume) q("resume", "简历", "PDF 版", [more("下载简历", { href: C.resume, target: "_blank", rel: "noopener" })]);
  var firstP = null;
  (S.projects || []).some(function (p) { if (p.videos && p.videos.length) { firstP = p; return true; } return false; });
  if (C.bilibili) q("video", "B 站", "作品视频都在这里", [more("去主页", { href: C.bilibili, target: "_blank", rel: "noopener" })]);
  else if (firstP) q("video", "作品视频", firstP.name, [more("播放", { on: { click: function () { openVideo(firstP.videos[0].bvid); } } })]);
  if (C.github) q("github", "GitHub", C.github.replace(/^https?:\/\//, ""), [more("查看", { href: C.github, target: "_blank", rel: "noopener" })]);

  /* ================= 页脚 ================= */
  function col(title, items) {
    var ul = el("ul");
    items.forEach(function (it) { if (it) ul.appendChild(el("li", {}, [it])); });
    if (!ul.childNodes.length) return;
    $("#foot-cols").appendChild(el("div", {}, [el("h4", { text: title }), ul]));
  }
  col("无人机配件", usedCats.map(function (k) {
    return el("a", { href: "#parts", text: cats[k], on: { click: function () { filter(k); } } });
  }));
  col("产品设计", (S.projects || []).map(function (p) { return el("a", { href: "#projects", text: p.name }); }));
  col("关于", [
    el("a", { href: "#about", text: "关于我" }),
    el("a", { href: "#cooperate", text: "合作方式" }),
    C.resume ? el("a", { href: C.resume, target: "_blank", rel: "noopener", text: "简历下载" }) : null,
  ]);
  col("联系", [
    C.email ? el("a", { href: "mailto:" + C.email, text: C.email }) : null,
    C.wechat ? el("span", { text: "微信：" + C.wechat }) : null,
    C.phone ? el("a", { href: "tel:" + C.phone.replace(/\s/g, ""), text: C.phone }) : null,
    C.bilibili ? el("a", { href: C.bilibili, target: "_blank", rel: "noopener", text: "B 站主页" }) : null,
  ]);
  $("#year").textContent = new Date().getFullYear();
  if (S.icp) $("#icp").appendChild(el("a", { href: "https://beian.miit.gov.cn/", target: "_blank", rel: "noopener", text: S.icp }));
})();
