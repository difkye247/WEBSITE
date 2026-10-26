/*
 * 无人机 3D 模型（纯 WebGL，无外部依赖）
 * - 物理材质（GGX 高光 + 清漆层），程序化碳纤维纹理、拉丝铝、阳极氧化
 * - 影棚柔光箱环境反射、主光阴影、地面倒影
 * - 拖动旋转、拆解视图
 * 用法：var v = Drone3D.mount(容器元素, { onInteract }) → { ok, start, stop, setExploded, isExploded }
 * 尺寸单位：厘米；y 轴向上，机头朝 -z。
 */
(function () {
  "use strict";
  var PI = Math.PI;

  /* ================= 矩阵（列主序） ================= */
  function I() { return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
  function mul(a, b) {
    var o = new Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++)
      o[c*4+r] = a[r]*b[c*4] + a[4+r]*b[c*4+1] + a[8+r]*b[c*4+2] + a[12+r]*b[c*4+3];
    return o;
  }
  function T(x, y, z) { var m = I(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function S(x, y, z) { return [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]; }
  function RX(a) { var c = Math.cos(a), s = Math.sin(a); return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]; }
  function RY(a) { var c = Math.cos(a), s = Math.sin(a); return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]; }
  function RZ(a) { var c = Math.cos(a), s = Math.sin(a); return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]; }
  function chain() { var m = I(); for (var i = 0; i < arguments.length; i++) m = mul(m, arguments[i]); return m; }
  function persp(f, a, n, fa) { var t = 1 / Math.tan(f / 2), nf = 1 / (n - fa); return [t/a,0,0,0, 0,t,0,0, 0,0,(fa+n)*nf,-1, 0,0,2*fa*n*nf,0]; }
  function ortho(l, r, b, t, n, f) { return [2/(r-l),0,0,0, 0,2/(t-b),0,0, 0,0,-2/(f-n),0, -(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]; }
  function lookAt(e, c, u) {
    var z = norm([e[0]-c[0], e[1]-c[1], e[2]-c[2]]), x = norm(cross(u, z)), y = cross(z, x);
    return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,e),-dot(y,e),-dot(z,e),1];
  }
  function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
  function cross(a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
  function norm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; }
  function nmat(m) {
    // 逆转置的 3x3（支持镜像）
    var a = m[0], b = m[1], c = m[2], d = m[4], e = m[5], f = m[6], g = m[8], h = m[9], i = m[10];
    var A = e*i - f*h, B = -(d*i - f*g), C = d*h - e*g, det = a*A + b*B + c*C || 1;
    return [A/det, B/det, C/det, -(b*i - c*h)/det, (a*i - c*g)/det, -(a*h - b*g)/det, (b*f - c*e)/det, -(a*f - c*d)/det, (a*e - b*d)/det];
  }

  /* ================= 几何体 ================= */
  // 网格曲面（自动平滑法线），f(i,j) 返回顶点
  function grid(R, C, f, wrap) {
    var P = [], N = [], i, j;
    for (i = 0; i < R; i++) for (j = 0; j < C; j++) { P.push(f(i, j)); N.push([0, 0, 0]); }
    var tris = [], cols = wrap ? C : C - 1;
    for (i = 0; i < R - 1; i++) for (j = 0; j < cols; j++) {
      var a = i*C + j, b = i*C + (j+1) % C, c = (i+1)*C + (j+1) % C, d = (i+1)*C + j;
      tris.push([a, b, c], [a, c, d]);
    }
    tris.forEach(function (t) {
      var p0 = P[t[0]], p1 = P[t[1]], p2 = P[t[2]];
      var n = cross([p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]], [p2[0]-p0[0], p2[1]-p0[1], p2[2]-p0[2]]);
      t.forEach(function (k) { N[k][0] += n[0]; N[k][1] += n[1]; N[k][2] += n[2]; });
    });
    var g = { p: [], n: [] };
    tris.forEach(function (t) { t.forEach(function (k) { var nn = norm(N[k]); g.p.push(P[k][0], P[k][1], P[k][2]); g.n.push(nn[0], nn[1], nn[2]); }); });
    return g;
  }
  // 车削体：profile = [[半径, y], ...]；重复点 = 锐边
  function lathe(prof, seg) {
    seg = seg || 48;
    return grid(prof.length, seg, function (i, j) {
      var a = j / seg * PI * 2, r = prof[i][0];
      return [r * Math.cos(a), prof[i][1], r * Math.sin(a)];
    }, true);
  }
  function sharp(prof) { var o = []; prof.forEach(function (p) { o.push(p, p); }); return o; }
  // 圆角盒
  function rbox(w, h, d, r, n) {
    n = n || 5;
    var hx = w/2, hy = h/2, hz = d/2; r = Math.min(r, hx, hy, hz);
    function co(hh) {
      if (r <= 0) return [-hh, hh];
      var o = [], k;
      for (k = 0; k <= n; k++) o.push(-hh + r - r * Math.cos(k / n * PI / 2));
      for (k = 0; k <= n; k++) o.push(hh - r + r * Math.sin(k / n * PI / 2));
      return o;
    }
    var cx = co(hx), cy = co(hy), cz = co(hz), g = { p: [], n: [] };
    function put(x, y, z) {
      var ix = Math.max(-hx + r, Math.min(hx - r, x)), iy = Math.max(-hy + r, Math.min(hy - r, y)), iz = Math.max(-hz + r, Math.min(hz - r, z));
      var nn = norm([x - ix, y - iy, z - iz]);
      return [ix + nn[0]*r, iy + nn[1]*r, iz + nn[2]*r, nn];
    }
    function face(A, B, mk) {
      for (var i = 0; i < A.length - 1; i++) for (var j = 0; j < B.length - 1; j++) {
        var q = [mk(A[i], B[j]), mk(A[i+1], B[j]), mk(A[i+1], B[j+1]), mk(A[i], B[j+1])].map(function (v) { return put(v[0], v[1], v[2]); });
        [0, 1, 2, 0, 2, 3].forEach(function (k) { g.p.push(q[k][0], q[k][1], q[k][2]); g.n.push(q[k][3][0], q[k][3][1], q[k][3][2]); });
      }
    }
    face(cy, cz, function (a, b) { return [hx, a, b]; });  face(cy, cz, function (a, b) { return [-hx, a, b]; });
    face(cx, cz, function (a, b) { return [a, hy, b]; });  face(cx, cz, function (a, b) { return [a, -hy, b]; });
    face(cx, cy, function (a, b) { return [a, b, hz]; });  face(cx, cy, function (a, b) { return [a, b, -hz]; });
    return g;
  }
  // 管线：沿折线扫掠圆截面
  function tube(pts, r, seg) {
    seg = seg || 14;
    var frames = pts.map(function (p, i) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      var t = norm([b[0]-a[0], b[1]-a[1], b[2]-a[2]]);
      var u = norm(cross(t, Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0])), v = cross(t, u);
      return [u, v];
    });
    return grid(pts.length, seg, function (i, j) {
      var a = j / seg * PI * 2, u = frames[i][0], v = frames[i][1], c = Math.cos(a) * r, s = Math.sin(a) * r;
      return [pts[i][0] + u[0]*c + v[0]*s, pts[i][1] + u[1]*c + v[1]*s, pts[i][2] + u[2]*c + v[2]*s];
    }, true);
  }
  // 桨叶：翼型截面放样，带扭转和后掠
  function blade() {
    var ST = 18, K = 16, r0 = 0.62, r1 = 6.35;
    return grid(ST, K, function (i, k) {
      var s = i / (ST - 1), r = r0 + (r1 - r0) * s;
      var chord = (0.95 + 0.75 * Math.sin(Math.min(1, s * 2.6) * PI / 2) - 1.15 * Math.pow(s, 2.2)) * (s > 0.92 ? Math.sqrt(Math.max(0.02, (1 - s) / 0.08)) : 1);
      chord = Math.max(0.12, chord);
      var thick = 0.17 - 0.12 * s, tw = (24 - 15 * s) * PI / 180, sweep = 0.35 * s * s;
      var a = k / K * PI * 2, x = 0.5 * chord * Math.cos(a);
      var yy = Math.sin(a) * thick * (Math.sin(a) > 0 ? 0.62 : 0.28) + 0.06 * chord * (1 - 4 * (x / chord) * (x / chord));
      var z = x * Math.cos(tw) - yy * Math.sin(tw) + sweep, y = x * Math.sin(tw) + yy * Math.cos(tw);
      return [r, y, z];
    }, true);
  }

  /* ================= 材质 ================= */
  // base: sRGB；metal 金属度；rough 粗糙度；coat 清漆；pat 纹理（1 碳纤维，2 拉丝金属，3 电池标签）
  var MAT = {
    carbon:  { base: "#141518", metal: 0, rough: 0.42, coat: 1.0, coatR: 0.07, pat: 1 },
    alu:     { base: "#C8CCD2", metal: 1, rough: 0.28, coat: 0,   coatR: 0,    pat: 2 },
    ti:      { base: "#5A5E64", metal: 1, rough: 0.36, coat: 0,   coatR: 0,    pat: 2 },
    anod:    { base: "#1F5FD8", metal: 1, rough: 0.26, coat: 0,   coatR: 0,    pat: 0 },
    black:   { base: "#0E0F11", metal: 0, rough: 0.5,  coat: 0,   coatR: 0,    pat: 0 },
    rubber:  { base: "#0B0C0D", metal: 0, rough: 0.78, coat: 0,   coatR: 0,    pat: 0 },
    pcb:     { base: "#0C0D0F", metal: 0, rough: 0.32, coat: 0.6, coatR: 0.12, pat: 0 },
    gold:    { base: "#F2C46A", metal: 1, rough: 0.22, coat: 0,   coatR: 0,    pat: 0 },
    glass:   { base: "#05070C", metal: 0, rough: 0.03, coat: 1.0, coatR: 0.02, pat: 0 },
    lensc:   { base: "#3A48B8", metal: 1, rough: 0.12, coat: 0,   coatR: 0,    pat: 0 },
    battery: { base: "#1A1C20", metal: 0, rough: 0.34, coat: 0.5, coatR: 0.15, pat: 3 },
    yellow:  { base: "#E2B526", metal: 0, rough: 0.4,  coat: 0.3, coatR: 0.2,  pat: 0 },
    prop:    { base: "#20252C", metal: 0, rough: 0.18, coat: 1.0, coatR: 0.05, pat: 0 },
  };
  function lin(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) { return Math.pow(v / 255, 2.2); }); }

  /* ================= 模型 =================
   * 每个零件归入一个“层”，拆解视图时各层按偏移量浮起
   */
  var LAYERS = [
    { off: [0, 0, 0],      delay: 0 },     // 0 机架底板、机臂、相机侧板、线材
    { off: [0, 1.8, 0],    delay: 0.25 },  // 1 电机
    { off: [0, 4.0, 0],    delay: 0.3 },   // 2 桨
    { off: [0, 1.8, 0],    delay: 0.15 },  // 3 下层板（电调）
    { off: [0, 3.4, 0],    delay: 0.1 },   // 4 上层板（飞控）
    { off: [0, 5.2, 0],    delay: 0.05 },  // 5 顶板与螺丝
    { off: [0, 8.2, 0],    delay: 0 },     // 6 电池
    { off: [0, 0.8, -3.6], delay: 0.2 },   // 7 相机
    { off: [0, 5.2, 1.8],  delay: 0.05 },  // 8 天线
  ];
  var MOTOR = [[7.78, -7.78, 1], [-7.78, -7.78, -1], [7.78, 7.78, -1], [-7.78, 7.78, 1]];

  function build() {
    var groups = {};
    function add(mat, layer, g, m) {
      var key = mat + "|" + layer, P = groups[key] || (groups[key] = { mat: mat, layer: layer, p: [], n: [] }), nm = nmat(m);
      for (var i = 0; i < g.p.length; i += 3) {
        var x = g.p[i], y = g.p[i+1], z = g.p[i+2], a = g.n[i], b = g.n[i+1], c = g.n[i+2];
        P.p.push(m[0]*x + m[4]*y + m[8]*z + m[12], m[1]*x + m[5]*y + m[9]*z + m[13], m[2]*x + m[6]*y + m[10]*z + m[14]);
        var n = norm([nm[0]*a + nm[3]*b + nm[6]*c, nm[1]*a + nm[4]*b + nm[7]*c, nm[2]*a + nm[5]*b + nm[8]*c]);
        P.n.push(n[0], n[1], n[2]);
      }
    }
    var Y0 = 0.225; // 底板上表面

    // ---- 机架 ----
    add("carbon", 0, rbox(5.4, 0.45, 10.6, 0.16), I());
    MOTOR.forEach(function (mo) {
      var ang = Math.atan2(mo[0], mo[1]);
      add("carbon", 0, rbox(1.95, 0.45, 11.2, 0.16), chain(RY(ang), T(0, 0, 5.5)));
      add("carbon", 0, lathe(sharp([[0, Y0], [1.72, Y0]]).concat([[1.8, Y0 - 0.07], [1.84, 0], [1.8, -Y0 + 0.07]]).concat(sharp([[1.72, -Y0], [0, -Y0]])), 48), T(mo[0], 0, mo[1]));
      // 电机线（编织套管）
      var dx = mo[0] / 11, dz = mo[1] / 11;
      add("rubber", 0, tube([[dx*6.6, 0.42, dz*6.6], [dx*5.2, 0.44, dz*5.2], [dx*3.8, 0.46, dz*3.8], [dx*2.9, 0.62, dz*2.9], [dx*2.3, 0.95, dz*2.3]], 0.17, 12), I());
    });
    // ---- 电机（2207）----
    MOTOR.forEach(function (mo) {
      var M = T(mo[0], Y0, mo[1]);
      add("ti", 1, lathe(sharp([[0, 0], [1.22, 0]]).concat([[1.3, 0.06], [1.3, 0.4], [1.24, 0.47]]).concat(sharp([[1.0, 0.5], [0, 0.5]])), 56), M);
      add("alu", 1, lathe([[1.33, 0.52], [1.41, 0.58], [1.43, 0.7], [1.43, 1.66], [1.4, 1.76], [1.3, 1.82], [1.1, 1.85], [0.9, 1.86], [0.9, 1.86], [0.86, 1.9], [0, 1.9]], 64), M);
      add("anod", 1, lathe([[1.44, 1.02], [1.445, 1.05], [1.445, 1.19], [1.44, 1.22]], 64), M);
      add("black", 1, lathe([[1.435, 0.72], [1.44, 0.74], [1.44, 0.84], [1.435, 0.86]], 64), M);
      add("ti", 1, lathe(sharp([[0, 1.9], [0.25, 1.9]]).concat(sharp([[0.25, 2.5], [0, 2.5]])), 20), M);
    });
    // ---- 立柱、顶板、螺丝 ----
    var STAND = [[1.95, -3.75], [-1.95, -3.75], [1.95, 3.95], [-1.95, 3.95]];
    STAND.forEach(function (s) {
      add("anod", 0, lathe(sharp([[0, Y0], [0.3, Y0]]).concat([[0.3, Y0 + 0.02], [0.3, 3.28]]).concat(sharp([[0.3, 3.3], [0, 3.3]])), 6), T(s[0], 0, s[1]));
      add("ti", 5, lathe([[0, 3.6], [0.36, 3.6], [0.4, 3.64], [0.4, 3.7], [0.34, 3.79], [0.2, 3.83], [0, 3.84]], 32), T(s[0], 0, s[1]));
      add("black", 5, lathe([[0, 3.845], [0.15, 3.845]], 6), T(s[0], 0, s[1]));
    });
    add("carbon", 5, rbox(4.8, 0.3, 9.2, 0.13), T(0, 3.45, 0.1));
    // ---- 飞控叠层 ----
    [[3, 1.0], [4, 2.15]].forEach(function (b, idx) {
      var L = b[0], y = b[1];
      add("pcb", L, rbox(3.6, 0.16, 3.6, 0.07, 2), T(0, y, 0.3));
      for (var k = 0; k < 7; k++) {
        var t = -1.3 + k * 0.43;
        add("gold", L, rbox(0.22, 0.04, 0.16, 0.02, 1), T(1.62, y + 0.09, 0.3 + t));
        add("gold", L, rbox(0.22, 0.04, 0.16, 0.02, 1), T(-1.62, y + 0.09, 0.3 + t));
      }
      if (idx === 0) {
        [[0.75, 0.75], [-0.75, 0.75], [0.75, -0.75], [-0.75, -0.75]].forEach(function (c) { add("black", L, rbox(0.62, 0.14, 0.62, 0.04, 2), T(c[0], y + 0.15, 0.3 + c[1])); });
      } else {
        add("black", L, rbox(1.05, 0.16, 1.05, 0.05, 2), T(0, y + 0.16, 0.3));
        add("black", L, rbox(0.4, 0.12, 0.4, 0.03, 2), T(0.95, y + 0.14, -0.6));
        add("alu", L, rbox(0.9, 0.3, 0.5, 0.05, 2), T(-0.6, y + 0.23, 1.6));
      }
    });
    // 电容
    add("black", 0, lathe(sharp([[0, -1], [0.5, -1]]).concat([[0.5, 0.85]]).concat(sharp([[0.48, 0.92], [0, 0.92]])), 28), chain(T(0, 0.78, 4.9), RZ(PI / 2)));
    add("alu", 0, lathe([[0.49, 0.92], [0.4, 1.0], [0, 1.02]], 28), chain(T(0, 0.78, 4.9), RZ(PI / 2)));
    // ---- 相机 ----
    [1.28, -1.28].forEach(function (x) {
      add("carbon", 0, rbox(0.25, 2.9, 2.7, 0.08), T(x, 1.75, -4.55));
      add("ti", 0, lathe([[0, 0], [0.3, 0], [0.32, 0.06], [0.28, 0.12], [0, 0.14]], 24), chain(T(x, 1.85, -4.5), RZ(x > 0 ? -PI / 2 : PI / 2)));
    });
    var cam = chain(T(0, 1.85, -4.5), RX(0.44));
    add("black", 7, rbox(2.0, 2.0, 2.0, 0.32), cam);
    var lensM = chain(cam, T(0, 0, -0.98), RX(-PI / 2));
    var barrel = [[0.8, 0], [0.84, 0.04]];
    for (var q = 0; q < 6; q++) barrel.push([0.84, 0.08 + q * 0.07], [0.8, 0.115 + q * 0.07]);
    barrel.push([0.84, 0.52], [0.82, 0.56], [0.74, 0.58]);
    add("black", 7, lathe(barrel, 48), lensM);
    add("alu", 7, lathe([[0.74, 0.58], [0.76, 0.62], [0.76, 0.66], [0.66, 0.69], [0.62, 0.69]], 48), lensM);
    add("lensc", 7, lathe([[0.62, 0.66], [0.6, 0.67]], 48), lensM);
    add("glass", 7, lathe([[0.6, 0.67], [0.5, 0.715], [0.34, 0.745], [0.17, 0.76], [0, 0.765]], 48), lensM);
    // ---- 电池 ----
    add("battery", 6, rbox(3.4, 3.1, 7.4, 0.42, 6), T(0, 5.18, 0.4));
    [-1.3, 2.05].forEach(function (z) {
      add("rubber", 6, rbox(3.56, 3.24, 0.62, 0.46, 6), T(0, 5.17, z));
      add("ti", 6, rbox(0.9, 0.1, 0.7, 0.04, 2), T(0, 6.83, z));
    });
    add("rubber", 6, tube([[0.5, 4.7, 4.1], [0.55, 4.6, 4.7], [0.4, 4.35, 5.2], [0.2, 4.2, 5.45]], 0.2, 12), I());
    add("yellow", 6, rbox(1.05, 0.6, 1.6, 0.12, 3), chain(T(0, 4.15, 5.9), RX(0.3)));
    // ---- 天线 ----
    [1, -1].forEach(function (sd) {
      var a = chain(T(sd * 1.55, 3.6, 4.35), RZ(-sd * 0.42), RX(0.78));
      add("rubber", 8, lathe(sharp([[0, 0], [0.17, 0]]).concat(sharp([[0.17, 3.4], [0, 3.4]])), 16), a);
      add("anod", 8, lathe([[0, 3.3], [0.3, 3.3], [0.36, 3.42], [0.36, 4.2], [0.3, 4.36], [0.15, 4.42], [0, 4.44]], 24), a);
    });
    // ---- 桨（单片中心为原点，三叶） ----
    var prop = { p: [], n: [] };
    (function () {
      var keep = groups; groups = {};
      add("prop", 2, lathe(sharp([[0, -0.18], [0.72, -0.18]]).concat([[0.76, -0.12], [0.76, 0.1], [0.7, 0.16]]).concat(sharp([[0.5, 0.16], [0, 0.16]])), 40), I());
      var bl = blade();
      for (var k = 0; k < 3; k++) add("prop", 2, bl, RY(k * PI * 2 / 3));
      prop.prop = groups["prop|2"];
      add("anod", 2, lathe([[0, 0.16], [0.46, 0.16], [0.46, 0.5], [0.38, 0.6], [0.2, 0.66], [0, 0.68]], 6), I());
      prop.nut = groups["anod|2"];
      groups = keep;
    })();
    return { groups: groups, prop: prop };
  }

  /* ================= 着色器 ================= */
  var HEAD = "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n";
  var VS = "attribute vec3 aP;attribute vec3 aN;uniform mat4 uVP;uniform mat4 uM;uniform mat3 uNM;uniform mat4 uLVP;" +
    "varying vec3 vW;varying vec3 vN;varying vec3 vO;varying vec3 vNO;varying vec4 vL;" +
    "void main(){vec4 w=uM*vec4(aP,1.0);vW=w.xyz;vN=uNM*aN;vO=aP;vNO=aN;vL=uLVP*w;gl_Position=uVP*w;}";

  var ENV =
    "vec3 sbox(vec3 d,vec3 ax,vec3 up,vec2 sz,float I,float r,vec3 tint){float k=dot(d,ax);if(k<=0.0)return vec3(0.0);" +
    "vec3 u=normalize(cross(ax,up));vec3 v=cross(u,ax);vec2 p=vec2(dot(d,u),dot(d,v))/k;float s=0.015+r*r*2.2+r*0.25;" +
    "vec2 q=abs(p)-sz;float m=(1.0-smoothstep(-s,s,q.x))*(1.0-smoothstep(-s,s,q.y));" +
    "return tint*I*m*(sz.x*sz.y)/((sz.x+s)*(sz.y+s));}" +
    "vec3 env(vec3 d,float r){" +
    "vec3 c=mix(vec3(0.006,0.0065,0.007),vec3(0.07,0.074,0.08),smoothstep(-0.3,0.9,d.y));" +
    "c+=sbox(d,normalize(vec3(0.15,1.0,0.35)),vec3(0.0,0.0,1.0),vec2(1.15,0.75),4.6,r,vec3(1.0,0.98,0.95));" +
    "c+=sbox(d,normalize(vec3(-1.0,0.25,0.45)),vec3(0.0,1.0,0.0),vec2(0.1,0.85),4.5,r,vec3(0.92,0.96,1.0));" +
    "c+=sbox(d,normalize(vec3(1.0,0.2,-0.15)),vec3(0.0,1.0,0.0),vec2(0.08,0.7),3.6,r,vec3(1.0,0.97,0.93));" +
    "c+=sbox(d,normalize(vec3(0.0,0.3,-1.0)),vec3(0.0,1.0,0.0),vec2(1.1,0.06),3.2,r,vec3(0.85,0.92,1.0));" +
    "c+=sbox(d,normalize(vec3(0.0,0.05,1.0)),vec3(0.0,1.0,0.0),vec2(1.4,0.035),1.6,r,vec3(1.0));" +
    "return c;}" +
    "vec3 irr(vec3 n){vec3 c=mix(vec3(0.01),vec3(0.07,0.075,0.085),n.y*0.5+0.5);" +
    "c+=0.95*max(dot(n,normalize(vec3(0.15,1.0,0.35))),0.0)*vec3(1.0,0.98,0.95);" +
    "c+=0.22*max(dot(n,normalize(vec3(-1.0,0.25,0.45))),0.0)+0.16*max(dot(n,normalize(vec3(1.0,0.2,-0.15))),0.0)+0.12*max(dot(n,normalize(vec3(0.0,0.3,-1.0))),0.0);" +
    "return c;}" +
    "vec3 envBRDF(vec3 F0,float r,float NoV){vec4 c0=vec4(-1.0,-0.0275,-0.572,0.022);vec4 c1=vec4(1.0,0.0425,1.04,-0.04);" +
    "vec4 q=r*c0+c1;float a=min(q.x*q.x,exp2(-9.28*NoV))*q.x+q.y;vec2 AB=vec2(-1.04,1.04)*a+q.zw;return F0*AB.x+AB.y;}" +
    "float unpack(vec4 c){return dot(c,vec4(1.0,1.0/255.0,1.0/65025.0,1.0/16581375.0));}" +
    "float shadowAt(sampler2D sm,vec4 l,float texel,float spread,float bias){vec3 p=l.xyz/l.w*0.5+0.5;if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0)return 1.0;" +
    "float s=0.0;for(int i=-2;i<=2;i++){for(int j=-2;j<=2;j++){float d=unpack(texture2D(sm,p.xy+vec2(float(i),float(j))*texel*spread));s+=(p.z-bias>d)?0.0:1.0;}}return s/25.0;}" +
    "vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}";

  var FS = HEAD + "uniform vec3 uCam;uniform vec3 uBase;uniform float uMetal;uniform float uRough;uniform float uCoat;uniform float uCoatR;uniform float uPat;" +
    "uniform mat4 uM;uniform sampler2D uSM;uniform float uShadowOn;uniform float uTexel;uniform vec3 uKey;uniform float uRefl;uniform float uFloorY;uniform float uExpo;" +
    "varying vec3 vW;varying vec3 vN;varying vec3 vO;varying vec3 vNO;varying vec4 vL;" + ENV +
    "float D_GGX(float NoH,float a){float a2=a*a;float d=NoH*NoH*(a2-1.0)+1.0;return a2/(3.14159*d*d);}" +
    "float V_SK(float NoV,float NoL,float r){float k=(r+1.0)*(r+1.0)/8.0;return 0.25/((NoV*(1.0-k)+k)*(NoL*(1.0-k)+k));}" +
    "void main(){" +
    "vec3 N=normalize(vN);vec3 V=normalize(uCam-vW);if(dot(N,V)<0.0)N=-N;" +
    "vec3 base=uBase;float rough=uRough;float metal=uMetal;float coat=uCoat;float sheen=0.0;" +
    // 碳纤维：2x2 斜纹，纤维方向随格子交替，切边为哑光层压纹
    "if(uPat>0.5&&uPat<1.5){vec3 no=normalize(vNO);" +
    " if(abs(no.y)>0.6){vec2 g=vO.xz/0.3;vec2 c=floor(g);vec2 f=fract(g);float dir=mod(c.x+c.y,4.0)<2.0?0.0:1.0;" +
    "  vec3 tO=dir<0.5?vec3(1.0,0.0,0.0):vec3(0.0,0.0,1.0);vec3 tW=normalize((uM*vec4(tO,0.0)).xyz);" +
    "  vec3 H=normalize(normalize(uKey)+V);float an=1.0-abs(dot(tW,H));an=an*an;" +
    "  float ff=dir<0.5?f.y:f.x;float fib=0.85+0.15*sin(ff*3.14159*14.0);float gap=smoothstep(0.0,0.06,ff)*smoothstep(1.0,0.94,ff);" +
    "  base=vec3(0.012,0.013,0.015)+vec3(0.05,0.052,0.058)*an*fib*gap;rough=mix(0.55,0.28,an)*(1.0+0.1*(1.0-gap));sheen=an*gap;" +
    " }else{base=vec3(0.03,0.031,0.034);rough=0.72;coat=0.0;}}" +
    // 拉丝金属：细密环纹
    "if(uPat>1.5&&uPat<2.5){float h=fract(sin(floor(vO.y*260.0)*12.9898)*43758.5453);rough=clamp(rough+(h-0.5)*0.12,0.05,1.0);base*=0.94+0.06*h;}" +
    // 电池：橙色标签带
    "if(uPat>2.5){float b=step(abs(vO.y-5.95),0.24);base=mix(base,vec3(0.8,0.17,0.006),b);rough=mix(rough,0.42,b);" +
    " float b2=step(abs(vO.y-5.95),0.27)-b;base=mix(base,vec3(0.6),b2*0.6);}" +
    "rough=clamp(rough,0.03,1.0);" +
    "vec3 F0=mix(vec3(0.04),base,metal);vec3 dc=base*(1.0-metal);float NoV=max(dot(N,V),0.001);" +
    "vec3 R=reflect(-V,N);" +
    "float sh=1.0;if(uShadowOn>0.5){sh=shadowAt(uSM,vL,uTexel,1.0,0.0015);}" +
    "float ao=mix(0.55,1.0,smoothstep(-0.6,0.8,N.y));" +
    "vec3 col=irr(N)*dc*ao+env(R,rough)*envBRDF(F0,rough,NoV)*mix(0.6,1.0,sh);" +
    "vec3 L=normalize(uKey);float NoL=max(dot(N,L),0.0);" +
    "if(NoL>0.0){vec3 H=normalize(L+V);float NoH=max(dot(N,H),0.0);float VoH=max(dot(V,H),0.0);vec3 F=F0+(1.0-F0)*pow(1.0-VoH,5.0);" +
    " float a=rough*rough;col+=(dc/3.14159+D_GGX(NoH,a)*V_SK(NoV,NoL,rough)*F)*NoL*vec3(2.6,2.55,2.45)*sh;" +
    " if(coat>0.0){float ac=uCoatR*uCoatR;float Fc=0.04+0.96*pow(1.0-VoH,5.0);col+=D_GGX(NoH,ac)*V_SK(NoV,NoL,uCoatR)*Fc*coat*NoL*vec3(2.6,2.55,2.45)*sh;}}" +
    "if(coat>0.0){float Fv=0.04+0.96*pow(1.0-NoV,5.0);col=col*(1.0-Fv*coat)+env(R,uCoatR)*Fv*coat;}" +
    "col+=sheen*0.02;" +
    "float a=1.0;if(uRefl>0.5){float dd=uFloorY-vW.y;a=0.22*exp(-dd*0.32);}" +
    "col=aces(col*uExpo);col=pow(col,vec3(1.0/2.2));gl_FragColor=vec4(col*a,a);}";

  // 阴影贴图（深度打包进 RGBA）
  var VS_D = "attribute vec3 aP;uniform mat4 uLVP;uniform mat4 uM;void main(){gl_Position=uLVP*uM*vec4(aP,1.0);}";
  var FS_D = HEAD + "void main(){vec4 e=vec4(1.0,255.0,65025.0,16581375.0)*gl_FragCoord.z;e=fract(e);e-=e.yzww*vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);gl_FragColor=e;}";
  // 地面：柔光圈 + 接触阴影，半透明让倒影透出来
  var VS_F = "attribute vec2 aQ;uniform mat4 uVP;uniform mat4 uLVP;uniform float uR;uniform float uY;varying vec2 vQ;varying vec4 vL;" +
    "void main(){vec4 w=vec4(aQ.x*uR,uY,aQ.y*uR,1.0);vQ=aQ;vL=uLVP*w;gl_Position=uVP*w;}";
  var FS_F = HEAD + "uniform sampler2D uSM;uniform float uShadowOn;uniform float uTexel;varying vec2 vQ;varying vec4 vL;" + ENV +
    "void main(){float r=length(vQ);float pool=exp(-r*r*4.0);float edge=1.0-smoothstep(0.55,1.0,r);" +
    "float sh=1.0;if(uShadowOn>0.5){sh=shadowAt(uSM,vL,uTexel,4.5,0.002);}" +
    "vec3 c=vec3(0.065,0.07,0.08)*pool*mix(0.3,1.0,sh);c=pow(aces(c),vec3(1.0/2.2));" +
    "float a=edge*(0.55+0.35*pool);gl_FragColor=vec4(c*a,a);}";

  function compile(gl, vs, fs) {
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p: p, u: u, aP: gl.getAttribLocation(p, "aP"), aN: gl.getAttribLocation(p, "aN"), aQ: gl.getAttribLocation(p, "aQ") };
  }
  function buf(gl, g) {
    var pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.p), gl.STATIC_DRAW);
    var nb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, nb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.n), gl.STATIC_DRAW);
    return { pb: pb, nb: nb, count: g.p.length / 3, mat: g.mat, layer: g.layer };
  }
  function ease(t) { t = Math.max(0, Math.min(1, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ================= 挂载 ================= */
  function mount(host, opts) {
    opts = opts || {};
    var fail = { ok: false, start: function () {}, stop: function () {}, setExploded: function () {}, isExploded: function () { return false; } };
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "可拖动旋转的 FPV 无人机 3D 模型");
    host.appendChild(canvas);
    var gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) { canvas.remove(); return fail; }

    var P, PD, PF, model, meshes = [], propM, nutM, quad, fbo, smTex, SM = 2048;
    try {
      P = compile(gl, VS, FS); PD = compile(gl, VS_D, FS_D); PF = compile(gl, VS_F, FS_F);
      model = build();
      Object.keys(model.groups).forEach(function (k) { meshes.push(buf(gl, model.groups[k])); });
      propM = buf(gl, model.prop.prop); nutM = buf(gl, model.prop.nut);
      quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1]), gl.STATIC_DRAW);
      // 阴影贴图
      if (Math.min(screen.width, screen.height) < 600) SM = 1024;
      smTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, smTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SM, SM, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      var rb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, SM, SM);
      fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, smTex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) fbo = null;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } catch (e) { if (window.console) console.warn("3D 模型初始化失败：", e); canvas.remove(); return fail; }

    var mats = {}; Object.keys(MAT).forEach(function (k) { var m = MAT[k]; mats[k] = { base: lin(m.base), metal: m.metal, rough: m.rough, coat: m.coat, coatR: m.coatR, pat: m.pat }; });
    var KEY = norm([0.22, 1.0, 0.32]);
    var FLOOR = -4.6;

    // 状态
    var yaw = PI - 0.62, pitch = 0.32, vYaw = 0, dragging = false, lastX = 0, lastY = 0, idleAt = 0;
    var spin = 0, t0 = performance.now(), last = t0, raf = 0, running = false, visible = true, W = 0, H = 0;
    var explode = 0, explodeTo = 0, intro = reduce ? 1 : 0;

    function resize() {
      var r = host.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    }
    function layerOffset(L) {
      var ly = LAYERS[L], e = ease((explode - ly.delay * 0.6) / (1 - 0.3));
      if (explode >= 1) e = 1; if (explode <= 0) e = 0;
      return T(ly.off[0] * e, ly.off[1] * e, ly.off[2] * e);
    }
    function setMat(prog, name) {
      var m = mats[name];
      gl.uniform3fv(prog.u.uBase, m.base); gl.uniform1f(prog.u.uMetal, m.metal); gl.uniform1f(prog.u.uRough, m.rough);
      gl.uniform1f(prog.u.uCoat, m.coat); gl.uniform1f(prog.u.uCoatR, m.coatR); gl.uniform1f(prog.u.uPat, m.pat);
    }
    function bindMesh(prog, m) {
      gl.bindBuffer(gl.ARRAY_BUFFER, m.pb); gl.vertexAttribPointer(prog.aP, 3, gl.FLOAT, false, 0, 0);
      if (prog.aN >= 0) { gl.bindBuffer(gl.ARRAY_BUFFER, m.nb); gl.vertexAttribPointer(prog.aN, 3, gl.FLOAT, false, 0, 0); }
    }
    // 遍历所有要画的物体：fn(mesh, 模型矩阵, 材质名)
    function each(D, fn) {
      var offs = LAYERS.map(function (_, i) { return layerOffset(i); });
      meshes.forEach(function (m) { fn(m, mul(D, mul(offs[m.layer], I())), m.mat); });
      MOTOR.forEach(function (mo) {
        var base = chain(D, offs[2], T(mo[0], 2.75, mo[1]), RY(spin * mo[2]), mo[2] < 0 ? S(1, 1, -1) : I());
        fn(propM, base, "prop"); fn(nutM, base, "anod");
      });
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var t = (now - t0) / 1000;
      resize();
      if (!dragging) { yaw += vYaw * dt; vYaw *= Math.pow(0.04, dt); if (!reduce && now - idleAt > 2500 && intro >= 1) yaw += 0.2 * dt; }
      if (!reduce) spin += dt * 1.2;
      intro = Math.min(1, intro + dt / 1.8);
      var k = explodeTo > explode ? 1 : -1;
      if (explode !== explodeTo) { explode += k * dt / 1.3; if ((k > 0 && explode > explodeTo) || (k < 0 && explode < explodeTo)) explode = explodeTo; }
      if (reduce) explode = explodeTo;
      var ex = ease(explode), it = ease(intro);

      // 相机
      var asp = W / H, fov = 0.42;
      var dist = Math.max(50, (asp < 1 ? 15.5 : 19.5) / (Math.tan(fov / 2) * asp)) * (1 + 0.5 * ex) * (1 + 0.35 * (1 - it));
      var target = [0, 0.9 + 3.6 * ex, 0];
      var ya = yaw + (1 - it) * 0.9;
      var eye = [0, target[1] + Math.sin(pitch) * dist, Math.cos(pitch) * dist];
      var VP = mul(persp(fov, asp, 2, 600), lookAt(eye, target, [0, 1, 0]));
      var bob = reduce ? 0 : Math.sin(t * 1.4) * 0.22;
      var D = chain(T(0, bob, 0), RY(ya), RZ(reduce ? 0 : Math.sin(t * 1.1) * 0.018), RX(reduce ? 0 : Math.sin(t * 0.8) * 0.015));

      // 阴影
      var LVP = mul(ortho(-17, 17, -17, 17, 1, 90), lookAt([KEY[0] * 45, KEY[1] * 45, KEY[2] * 45], [0, 2, 0], [0, 0, -1]));
      if (fbo) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, SM, SM);
        gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
        gl.useProgram(PD.p); gl.enableVertexAttribArray(PD.aP); gl.uniformMatrix4fv(PD.u.uLVP, false, LVP);
        each(D, function (m, M) { gl.uniformMatrix4fv(PD.u.uM, false, M); bindMesh(PD, m); gl.drawArrays(gl.TRIANGLES, 0, m.count); });
        gl.disableVertexAttribArray(PD.aP);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }

      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, smTex);

      function drawScene(refl) {
        gl.useProgram(P.p); gl.enableVertexAttribArray(P.aP); gl.enableVertexAttribArray(P.aN);
        gl.uniformMatrix4fv(P.u.uVP, false, VP); gl.uniform3fv(P.u.uCam, eye); gl.uniformMatrix4fv(P.u.uLVP, false, LVP);
        gl.uniform1i(P.u.uSM, 0); gl.uniform1f(P.u.uShadowOn, fbo && !refl ? 1 : 0); gl.uniform1f(P.u.uTexel, 1 / SM);
        gl.uniform3fv(P.u.uKey, KEY); gl.uniform1f(P.u.uRefl, refl ? 1 : 0); gl.uniform1f(P.u.uFloorY, FLOOR); gl.uniform1f(P.u.uExpo, 1.05);
        var MR = refl ? chain(T(0, FLOOR, 0), S(1, -1, 1), T(0, -FLOOR, 0)) : I();
        each(D, function (m, M) {
          var MM = mul(MR, M);
          gl.uniformMatrix4fv(P.u.uM, false, MM); gl.uniformMatrix3fv(P.u.uNM, false, nmat(MM));
          setMat(P, m === propM ? "prop" : m === nutM ? "anod" : m.mat); bindMesh(P, m); gl.drawArrays(gl.TRIANGLES, 0, m.count);
        });
        gl.disableVertexAttribArray(P.aP); gl.disableVertexAttribArray(P.aN);
      }

      // 1) 倒影
      gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      drawScene(true);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      // 2) 地面
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(PF.p); gl.enableVertexAttribArray(PF.aQ);
      gl.uniformMatrix4fv(PF.u.uVP, false, VP); gl.uniformMatrix4fv(PF.u.uLVP, false, LVP);
      gl.uniform1f(PF.u.uR, 26); gl.uniform1f(PF.u.uY, FLOOR); gl.uniform1i(PF.u.uSM, 0);
      gl.uniform1f(PF.u.uShadowOn, fbo ? 1 : 0); gl.uniform1f(PF.u.uTexel, 1 / SM);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.vertexAttribPointer(PF.aQ, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6); gl.disableVertexAttribArray(PF.aQ);
      // 3) 本体
      gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      drawScene(false);

      var busy = explode !== explodeTo || intro < 1;
      if (running && visible && (!reduce || busy || dragging)) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    // 交互：横向拖动旋转、纵向调俯仰（鼠标）；不拦截手机竖向滚动
    canvas.style.touchAction = "pan-y";
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY; vYaw = 0; idleAt = performance.now();
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      host.classList.add("grabbing"); if (opts.onInteract) opts.onInteract(); kick();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      yaw += dx * 0.009; vYaw = dx * 0.55;
      if (e.pointerType === "mouse") pitch = Math.max(0.05, Math.min(1.05, pitch + dy * 0.006));
      idleAt = performance.now(); kick();
    });
    function end() { dragging = false; idleAt = performance.now(); host.classList.remove("grabbing"); }
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    canvas.tabIndex = 0;
    canvas.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { yaw += e.key === "ArrowLeft" ? -0.2 : 0.2; idleAt = performance.now(); kick(); e.preventDefault(); }
    });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (running) kick(); }).observe(host);
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; if (running) kick(); });
    if ("ResizeObserver" in window) new ResizeObserver(function () { kick(); }).observe(host);

    return {
      ok: true,
      start: function () { running = true; kick(); },
      stop: function () { running = false; },
      setExploded: function (on) { explodeTo = on ? 1 : 0; idleAt = performance.now(); kick(); },
      isExploded: function () { return explodeTo === 1; },
    };
  }

  window.Drone3D = { mount: mount };
})();
