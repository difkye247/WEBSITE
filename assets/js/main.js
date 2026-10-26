/* 根据 content.js 渲染页面。一般不需要改这个文件。 */
(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  /* ---------- 线稿占位图（没有照片时显示） ---------- */
  var ICONS = {
    frame: '<svg viewBox="0 0 100 100"><circle cx="22" cy="22" r="13"/><circle cx="78" cy="22" r="13"/><circle cx="22" cy="78" r="13"/><circle cx="78" cy="78" r="13"/><path d="M31 31l12 12M69 31L57 43M31 69l12-12M69 69L57 57"/><rect x="40" y="36" width="20" height="28" rx="3"/><circle cx="22" cy="22" r="4"/><circle cx="78" cy="22" r="4"/><circle cx="22" cy="78" r="4"/><circle cx="78" cy="78" r="4"/></svg>',
    mount: '<svg viewBox="0 0 100 100"><rect x="24" y="30" width="52" height="38" rx="5"/><circle cx="50" cy="49" r="11"/><circle cx="50" cy="49" r="5"/><path d="M34 68v12h32V68M30 80h40"/><path d="M66 36h5"/></svg>',
    power: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="26"/><circle cx="50" cy="50" r="17"/><circle cx="50" cy="50" r="4"/><path d="M50 24V14M50 86V76M24 50H14M86 50H76"/><path d="M38 38l-4-4M62 62l4 4M62 38l4-4M38 62l-4 4"/></svg>',
    electronics: '<svg viewBox="0 0 100 100"><rect x="20" y="26" width="60" height="48" rx="3"/><rect x="40" y="40" width="20" height="20"/><path d="M44 40v-6M50 40v-6M56 40v-6M44 60v6M50 60v6M56 60v6M40 44h-6M40 50h-6M40 56h-6M60 44h6M60 50h6M60 56h6"/><circle cx="27" cy="33" r="2.5"/><circle cx="73" cy="33" r="2.5"/><circle cx="27" cy="67" r="2.5"/><circle cx="73" cy="67" r="2.5"/></svg>',
    project: '<svg viewBox="0 0 100 100"><rect x="10" y="36" width="80" height="10" rx="1"/><path d="M14 46v28l8-8V46"/><path d="M46 30h16v16H46zM46 46v28l8-8V46"/><path d="M22 36v-4M30 36v-3M38 36v-4M70 36v-4M78 36v-3M86 36v-4"/><circle cx="54" cy="38" r="2"/></svg>',
  };
  function media(src, alt, icon) {
    var box = el("div", { class: "media" });
    if (src) {
      box.appendChild(el("img", { src: src, alt: alt, loading: "lazy", decoding: "async" }));
    } else {
      box.appendChild(el("div", { class: "ph", html: ICONS[icon] || ICONS.project, role: "img", "aria-label": alt + "（示意图）" }));
    }
    return box;
  }

  /* ---------- 简单文字绑定 ---------- */
  document.querySelectorAll("[data-bind]").forEach(function (n) {
    var v = get(S, n.getAttribute("data-bind"));
    if (v) n.textContent = v; else if (n.textContent.trim() === "") n.hidden = true;
  });
  document.querySelectorAll("[data-list]").forEach(function (n) {
    (get(S, n.getAttribute("data-list")) || []).forEach(function (t) { n.appendChild(el("li", { text: t })); });
  });
  if (S.title) document.title = S.title;

  /* ---------- 配件 + 筛选 ---------- */
  var cats = S.categories || {};
  var parts = S.parts || [];
  var grid = $("#parts-grid");
  var cards = parts.map(function (p) {
    var catName = cats[p.category] || "";
    var specs = el("dl", { class: "specs" });
    Object.keys(p.specs || {}).forEach(function (k) {
      specs.appendChild(el("dt", { text: k }));
      specs.appendChild(el("dd", { text: p.specs[k] }));
    });
    var m = media(p.image, p.name, p.category);
    if (catName) m.appendChild(el("span", { class: "tape", text: catName }));
    var card = el("article", { class: "part-card", "data-cat": p.category }, [
      m,
      el("div", { class: "part-body" }, [
        el("div", { class: "part-title" }, [
          el("h3", { text: p.name }),
          p.badge ? el("span", { class: "badge", text: p.badge }) : null,
        ]),
        p.summary ? el("p", { class: "part-summary", text: p.summary }) : null,
        specs.childNodes.length ? specs : null,
        p.link ? el("a", { class: "text-link part-link", href: p.link, target: "_blank", rel: "noopener", text: p.linkText || "查看详情" }) : null,
      ]),
    ]);
    grid.appendChild(card);
    return card;
  });

  var filters = $("#filters");
  var keys = ["all"].concat(Object.keys(cats).filter(function (k) {
    return parts.some(function (p) { return p.category === k; });
  }));
  function setFilter(key) {
    filters.querySelectorAll(".filter").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.key === key));
    });
    cards.forEach(function (c) { c.hidden = !(key === "all" || c.dataset.cat === key); });
  }
  if (keys.length > 2) {
    keys.forEach(function (k) {
      var n = k === "all" ? parts.length : parts.filter(function (p) { return p.category === k; }).length;
      var b = el("button", { type: "button", class: "filter", "data-key": k, "aria-pressed": String(k === "all") }, [
        document.createTextNode(k === "all" ? "全部" : cats[k]),
        el("span", { class: "count", text: String(n) }),
      ]);
      b.addEventListener("click", function () { setFilter(k); });
      filters.appendChild(b);
    });
  } else {
    filters.hidden = true;
  }
  if (!parts.length) grid.appendChild(el("p", { class: "empty", text: "配件还在整理中。" }));

  /* ---------- 作品 ---------- */
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
  function bvUrl(bvid) { return "https://www.bilibili.com/video/" + bvid + "/"; }

  // 视频区：先显示封面，点了才加载 B 站播放器（页面打开更快）
  function videoBlock(p) {
    var vids = p.videos;
    var cur = 0, playing = false;
    var box = el("div", { class: "media video" });
    var tabs = el("div", { class: "vtabs", role: "group", "aria-label": "切换视频" });
    var open = el("a", { class: "text-link vlink", target: "_blank", rel: "noopener", text: "在 B 站打开" });

    function cover() {
      var v = vids[cur];
      var btn = el("button", { type: "button", class: "play", "aria-label": "播放：" + p.name + " " + v.label });
      if (v.cover) {
        var img = el("img", { src: v.cover, alt: "", loading: "lazy", decoding: "async", referrerpolicy: "no-referrer" });
        img.addEventListener("error", function () { img.replaceWith(el("div", { class: "ph", html: ICONS.project })); });
        btn.appendChild(img);
      } else {
        btn.appendChild(el("div", { class: "ph", html: ICONS.project }));
      }
      btn.appendChild(el("span", { class: "play-icon", html: PLAY }));
      btn.addEventListener("click", function () { playing = true; render(); });
      return btn;
    }
    function player() {
      var v = vids[cur];
      return el("iframe", {
        src: "https://player.bilibili.com/player.html?bvid=" + v.bvid + "&autoplay=1&high_quality=1&danmaku=0",
        title: p.name + " " + v.label, allowfullscreen: "true", allow: "autoplay; fullscreen; picture-in-picture",
        scrolling: "no", frameborder: "0",
      });
    }
    function render() {
      box.replaceChildren(playing ? player() : cover());
      open.href = bvUrl(vids[cur].bvid);
      tabs.querySelectorAll("button").forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === cur)); });
    }
    if (vids.length > 1) {
      vids.forEach(function (v, i) {
        var b = el("button", { type: "button", class: "vtab", text: v.label });
        b.addEventListener("click", function () { if (i !== cur) { cur = i; render(); } });
        tabs.appendChild(b);
      });
    }
    render();
    return { media: box, controls: el("div", { class: "vcontrols" }, [vids.length > 1 ? tabs : null, open]) };
  }

  var plist = $("#projects-list");
  (S.projects || []).forEach(function (p) {
    var story = el("dl", { class: "story" });
    [["问题", p.problem], ["做法", p.approach], ["结果", p.result]].forEach(function (r) {
      if (!r[1]) return;
      story.appendChild(el("dt", { text: r[0] }));
      story.appendChild(el("dd", { text: r[1] }));
    });
    var v = (p.videos && p.videos.length) ? videoBlock(p) : null;
    plist.appendChild(el("article", { class: "project" + (v ? " has-video" : "") }, [
      v ? v.media : media(p.image, p.name, "project"),
      el("div", { class: "project-body" }, [
        el("div", { class: "project-head" }, [
          el("h3", { text: p.name }),
          p.year ? el("span", { class: "year", text: p.year }) : null,
        ]),
        p.summary ? el("p", { class: "project-summary", text: p.summary }) : null,
        story.childNodes.length ? story : null,
        v ? v.controls : null,
      ]),
    ]));
  });
  if (!(S.projects || []).length) $("#projects").hidden = true;

  /* ---------- 流程与工具 ---------- */
  var proc = $("#process-list");
  (S.process || []).forEach(function (s) {
    proc.appendChild(el("li", {}, [el("h3", { text: s.step }), el("p", { text: s.detail })]));
  });
  var tools = $("#tools-list");
  (S.tools || []).forEach(function (t) { tools.appendChild(el("li", { text: t })); });
  if (!(S.tools || []).length) $(".tools-title").hidden = true;

  /* ---------- 联系方式 ---------- */
  var c = S.contact || {};
  var list = $("#contact-list");
  function copyBtn(value, label) {
    var b = el("button", { type: "button", class: "copy", text: "复制", "aria-label": "复制" + label });
    b.addEventListener("click", function () {
      var done = function () { b.textContent = "已复制"; setTimeout(function () { b.textContent = "复制"; }, 1600); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(value).then(done, fallback);
      else fallback();
      function fallback() {
        var t = el("textarea", { readonly: "" }); t.value = value; t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); done(); } catch (e) { b.textContent = "请手动复制"; }
        document.body.removeChild(t);
      }
    });
    return b;
  }
  function row(k, valueNode, extra) {
    list.appendChild(el("div", { class: "contact-row" }, [el("span", { class: "k", text: k }), valueNode].concat(extra || [])));
  }
  if (c.email) row("邮箱", el("a", { class: "v", href: "mailto:" + c.email, text: c.email }), [copyBtn(c.email, "邮箱")]);
  if (c.wechat) {
    row("微信", el("span", { class: "v", text: c.wechat }), [copyBtn(c.wechat, "微信号")]);
    if (c.wechatQR) list.lastChild.appendChild(el("img", { class: "qr", src: c.wechatQR, alt: "微信二维码", loading: "lazy" }));
  }
  if (c.phone) row("电话", el("a", { class: "v", href: "tel:" + c.phone.replace(/\s/g, ""), text: c.phone }), [copyBtn(c.phone, "电话")]);
  if (c.github) row("GitHub", el("a", { class: "v", href: c.github, target: "_blank", rel: "noopener", text: c.github.replace(/^https?:\/\//, "") }));
  if (c.bilibili) row("B 站", el("a", { class: "v", href: c.bilibili, target: "_blank", rel: "noopener", text: "看飞行视频" }));
  if (c.resume) {
    list.appendChild(el("a", { class: "btn btn-resume", href: c.resume, target: "_blank", rel: "noopener", text: "下载简历（PDF）" }));
    var top = $("#resume-link-top");
    if (top) { top.href = c.resume; top.target = "_blank"; top.textContent = "下载我的简历"; }
  }

  /* ---------- 页脚 ---------- */
  $("#year").textContent = new Date().getFullYear();
  if (S.icp) {
    $("#icp").appendChild(el("a", { href: "https://beian.miit.gov.cn/", target: "_blank", rel: "noopener", text: S.icp }));
  }
})();
