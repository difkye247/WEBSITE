/*
 * 无人机 3D 模型（纯 WebGL，无外部依赖）
 * 用法：Drone3D.mount(容器元素) → 返回 { start, stop, ok }
 * 模型是一台 5 寸 FPV 穿越机：碳板机架、电机、三叶桨、图传相机、电池、天线。
 * 尺寸单位：厘米；y 轴向上，机头朝 -z。
 */
(function () {
  "use strict";

  /* ---------------- 矩阵（列主序） ---------------- */
  function I() { return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
  function mul(a, b) {
    var o = new Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function T(x, y, z) { var m = I(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function RX(a) { var c = Math.cos(a), s = Math.sin(a); return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]; }
  function RY(a) { var c = Math.cos(a), s = Math.sin(a); return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]; }
  function RZ(a) { var c = Math.cos(a), s = Math.sin(a); return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]; }
  function chain() { var m = I(); for (var i = 0; i < arguments.length; i++) m = mul(m, arguments[i]); return m; }
  function persp(fovy, asp, n, f) {
    var t = 1 / Math.tan(fovy / 2), nf = 1 / (n - f);
    return [t / asp,0,0,0, 0,t,0,0, 0,0,(f + n) * nf,-1, 0,0,2 * f * n * nf,0];
  }
  function lookAt(e, c, u) {
    var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], l = Math.hypot(zx, zy, zz);
    zx /= l; zy /= l; zz /= l;
    var xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx; l = Math.hypot(xx, xy, xz);
    xx /= l; xy /= l; xz /= l;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return [xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
      -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
  }
  function nmat(m) { return [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]; }

  /* ---------------- 几何体 ---------------- */
  function G() { return { p: [], n: [] }; }
  function quad(g, a, b, c, d, n) { [a, b, c, a, c, d].forEach(function (v) { g.p.push(v[0], v[1], v[2]); g.n.push(n[0], n[1], n[2]); }); }
  function box(w, h, d, taper) {
    var g = G(), x = w / 2, y = h / 2, z = d / 2;
    quad(g, [x,-y,-z],[x,y,-z],[x,y,z],[x,-y,z],[1,0,0]);
    quad(g, [-x,-y,z],[-x,y,z],[-x,y,-z],[-x,-y,-z],[-1,0,0]);
    quad(g, [-x,y,-z],[-x,y,z],[x,y,z],[x,y,-z],[0,1,0]);
    quad(g, [-x,-y,z],[-x,-y,-z],[x,-y,-z],[x,-y,z],[0,-1,0]);
    quad(g, [-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z],[0,0,1]);
    quad(g, [x,-y,-z],[-x,-y,-z],[-x,y,-z],[x,y,-z],[0,0,-1]);
    if (taper) for (var i = 0; i < g.p.length; i += 3) if (g.p[i] > 0) g.p[i + 2] *= taper; // 桨叶尖部收窄
    return g;
  }
  function cyl(r, h, seg, r2) {
    var g = G(), y = h / 2, rt = r2 === undefined ? r : r2;
    seg = seg || 28;
    for (var i = 0; i < seg; i++) {
      var a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
      var c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      [[r*c0,-y,r*s0,c0,s0],[rt*c0,y,rt*s0,c0,s0],[rt*c1,y,rt*s1,c1,s1],[r*c0,-y,r*s0,c0,s0],[rt*c1,y,rt*s1,c1,s1],[r*c1,-y,r*s1,c1,s1]]
        .forEach(function (v) { g.p.push(v[0], v[1], v[2]); g.n.push(v[3], 0, v[4]); });
      g.p.push(0,y,0, rt*c0,y,rt*s0, rt*c1,y,rt*s1); g.n.push(0,1,0, 0,1,0, 0,1,0);
      g.p.push(0,-y,0, r*c1,-y,r*s1, r*c0,-y,r*s0); g.n.push(0,-1,0, 0,-1,0, 0,-1,0);
    }
    return g;
  }

  /* ---------------- 材质（sRGB 颜色） ---------------- */
  var MAT = {
    carbon:  { c: "#30343A", shin: 36,  spec: 0.45, metal: 0 },
    accent:  { c: "#2F7BF0", shin: 70,  spec: 0.9,  metal: 0.75 },
    bell:    { c: "#B8BFC7", shin: 90,  spec: 1.1,  metal: 0.9 },
    dark:    { c: "#17191C", shin: 30,  spec: 0.35, metal: 0 },
    pcb:     { c: "#1F5C46", shin: 50,  spec: 0.4,  metal: 0 },
    battery: { c: "#3A3E44", shin: 18,  spec: 0.2,  metal: 0 },
    label:   { c: "#E8710A", shin: 30,  spec: 0.3,  metal: 0 },
    yellow:  { c: "#E3B526", shin: 40,  spec: 0.4,  metal: 0 },
    glass:   { c: "#1B2A5C", shin: 220, spec: 1.6,  metal: 0.5 },
    prop:    { c: "#56606B", shin: 50,  spec: 0.6,  metal: 0 },
  };
  function lin(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) { return Math.pow(v / 255, 2.2); });
  }

  /* ---------------- 搭建模型 ---------------- */
  var MOTOR = [[7.78, -7.78, 1], [-7.78, -7.78, -1], [7.78, 7.78, -1], [-7.78, 7.78, 1]]; // x, z, 旋转方向
  function build() {
    var parts = {};
    function add(mat, g, m) {
      var P = parts[mat] || (parts[mat] = { p: [], n: [] }), nm = nmat(m);
      for (var i = 0; i < g.p.length; i += 3) {
        var x = g.p[i], y = g.p[i + 1], z = g.p[i + 2];
        P.p.push(m[0]*x + m[4]*y + m[8]*z + m[12], m[1]*x + m[5]*y + m[9]*z + m[13], m[2]*x + m[6]*y + m[10]*z + m[14]);
        var a = g.n[i], b = g.n[i + 1], c = g.n[i + 2];
        P.n.push(nm[0]*a + nm[3]*b + nm[6]*c, nm[1]*a + nm[4]*b + nm[7]*c, nm[2]*a + nm[5]*b + nm[8]*c);
      }
    }
    // 机臂 + 电机座
    MOTOR.forEach(function (mo) {
      var ang = Math.atan2(mo[0], mo[1]);
      add("carbon", box(1.8, 0.5, 11.2), chain(RY(ang), T(0, 0, 5.4)));
      add("carbon", cyl(1.75, 0.5, 32), T(mo[0], 0, mo[1]));
      add("dark",   cyl(1.45, 0.5, 32), T(mo[0], 0.5, mo[1]));       // 电机底座
      add("bell",   cyl(1.45, 1.5, 32), T(mo[0], 1.5, mo[1]));       // 电机钟罩
      add("accent", cyl(1.48, 0.18, 32), T(mo[0], 1.0, mo[1]));      // 色环
      add("dark",   cyl(1.15, 0.16, 32), T(mo[0], 2.3, mo[1]));
      add("bell",   cyl(0.25, 0.7, 12),  T(mo[0], 2.65, mo[1]));     // 电机轴
    });
    // 底板 / 顶板 / 铜柱
    add("carbon", box(5.4, 0.4, 10.4), T(0, 0, 0));
    add("carbon", box(4.6, 0.3, 8.8), T(0, 3.45, 0.2));
    [[1.9, -3.6], [-1.9, -3.6], [1.9, 3.8], [-1.9, 3.8]].forEach(function (s) { add("accent", cyl(0.28, 3.1, 14), T(s[0], 1.75, s[1])); });
    // 飞控叠层
    [1.05, 2.1].forEach(function (y, i) {
      add("pcb", box(3.6, 0.16, 3.6), T(0, y, 0.4));
      add("dark", box(1.1, 0.25, 1.1), T(i ? 0.5 : -0.4, y + 0.2, 0.2));
      add("dark", box(0.6, 0.2, 0.9), T(i ? -0.9 : 0.9, y + 0.18, 1.2));
    });
    add("dark", cyl(0.5, 1.8, 18), chain(T(0, 0.75, 4.6), RZ(Math.PI / 2))); // 电容
    // 图传相机（机头朝 -z，上仰 25°）
    add("carbon", box(0.25, 2.9, 2.6), T(1.25, 1.75, -4.4));
    add("carbon", box(0.25, 2.9, 2.6), T(-1.25, 1.75, -4.4));
    var cam = chain(T(0, 1.8, -4.4), RX(0.44));
    add("dark", box(2.0, 2.0, 2.0), cam);
    add("dark", cyl(0.75, 0.9, 28), chain(cam, T(0, 0, -1.3), RX(Math.PI / 2)));
    add("glass", cyl(0.55, 0.06, 28), chain(cam, T(0, 0, -1.78), RX(Math.PI / 2)));
    add("bell", cyl(0.78, 0.12, 28), chain(cam, T(0, 0, -1.72), RX(Math.PI / 2)));
    // 电池 + 绑带 + XT60
    add("battery", box(3.4, 3.1, 7.4), T(0, 5.2, 0.4));
    add("label", box(3.46, 0.7, 7.46), T(0, 6.0, 0.4));
    add("dark", box(3.5, 3.22, 0.7), T(0, 5.17, -1.2));
    add("dark", box(3.5, 3.22, 0.7), T(0, 5.17, 2.0));
    add("yellow", box(1.6, 0.8, 1.0), T(0, 4.0, 4.6));
    // 天线
    [1, -1].forEach(function (sd) {
      var a = chain(T(sd * 1.4, 3.5, 4.3), RZ(-sd * 0.45), RX(0.75));
      add("dark", cyl(0.17, 3.6, 10), chain(a, T(0, 1.8, 0)));
      add("accent", cyl(0.36, 1.0, 16), chain(a, T(0, 3.9, 0)));
    });
    // 桨：三叶
    var prop = { p: [], n: [] };
    (function () {
      var keep = parts; parts = { prop: prop };
      add("prop", cyl(0.65, 0.6, 20), T(0, 0, 0));
      for (var k = 0; k < 3; k++) add("prop", box(5.8, 0.12, 1.35, 0.55), chain(RY(k * Math.PI * 2 / 3), T(3.45, 0, 0), RX(0.18)));
      parts = keep;
    })();
    return { parts: parts, prop: prop, disc: cyl(6.35, 0.02, 64) };
  }

  /* ---------------- 着色器 ---------------- */
  var VS = "attribute vec3 aP;attribute vec3 aN;uniform mat4 uVP;uniform mat4 uM;uniform mat3 uNM;varying vec3 vN;varying vec3 vW;" +
    "void main(){vec4 w=uM*vec4(aP,1.0);vW=w.xyz;vN=uNM*aN;gl_Position=uVP*w;}";
  var FS = "precision mediump float;uniform vec3 uC;uniform vec3 uCam;uniform float uShin;uniform float uSpec;uniform float uMetal;uniform float uA;" +
    "varying vec3 vN;varying vec3 vW;" +
    "vec3 lit(vec3 N,vec3 V,vec3 L,vec3 lc){float d=max(dot(N,L),0.0);vec3 H=normalize(L+V);float s=pow(max(dot(N,H),0.0),uShin)*uSpec;" +
    "return lc*(uC*d*(1.0-uMetal*0.6)+mix(vec3(1.0),uC*1.6,uMetal)*s*d);}" +
    "void main(){vec3 N=normalize(vN);vec3 V=normalize(uCam-vW);if(dot(N,V)<0.0)N=-N;" +
    "vec3 col=uC*mix(vec3(0.05,0.055,0.065),vec3(0.36,0.38,0.43),N.y*0.5+0.5);" +
    "col+=lit(N,V,normalize(vec3(0.45,0.9,0.5)),vec3(2.4,2.33,2.2));" +
    "col+=lit(N,V,normalize(vec3(-0.9,0.35,0.1)),vec3(0.5,0.58,0.75));" +
    "col+=lit(N,V,normalize(vec3(0.2,0.5,-1.0)),vec3(1.1,1.15,1.25));" +
    "col+=pow(1.0-max(dot(N,V),0.0),4.0)*vec3(0.22,0.3,0.42);" +
    "col=vec3(1.0)-exp(-col*1.15);gl_FragColor=vec4(pow(col,vec3(1.0/2.2))*uA,uA);}";
  // 地面光斑
  var VS2 = "attribute vec2 aQ;uniform mat4 uVP;uniform float uR;uniform float uY;varying vec2 vQ;void main(){vQ=aQ;gl_Position=uVP*vec4(aQ.x*uR,uY,aQ.y*uR,1.0);}";
  var FS2 = "precision mediump float;varying vec2 vQ;uniform float uI;void main(){float r=length(vQ);float a=(1.0-smoothstep(0.0,1.0,r));a=a*a*uI;" +
    "gl_FragColor=vec4(vec3(0.55,0.72,1.0)*a,a);}";

  function compile(gl, vs, fs) {
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p: p, u: u };
  }
  function buf(gl, g) {
    var pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.p), gl.STATIC_DRAW);
    var nb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, nb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.n), gl.STATIC_DRAW);
    return { pb: pb, nb: nb, count: g.p.length / 3 };
  }

  /* ---------------- 挂载 ---------------- */
  function mount(host, opts) {
    opts = opts || {};
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "可拖动旋转的 FPV 无人机 3D 模型");
    host.appendChild(canvas);
    var gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: true }) ||
             canvas.getContext("experimental-webgl", { antialias: true, alpha: true });
    if (!gl) { canvas.remove(); return { ok: false, start: function () {}, stop: function () {} }; }

    var prog, glow, model, meshes = {}, propMesh, discMesh, quadBuf;
    try {
      prog = compile(gl, VS, FS); glow = compile(gl, VS2, FS2);
      model = build();
      Object.keys(model.parts).forEach(function (k) { meshes[k] = buf(gl, model.parts[k]); });
      propMesh = buf(gl, model.prop); discMesh = buf(gl, model.disc);
      quadBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1]), gl.STATIC_DRAW);
    } catch (e) { if (window.console) console.warn("3D 模型初始化失败：", e); canvas.remove(); return { ok: false, start: function () {}, stop: function () {} }; }
    var aP = gl.getAttribLocation(prog.p, "aP"), aN = gl.getAttribLocation(prog.p, "aN"), aQ = gl.getAttribLocation(glow.p, "aQ");
    var colors = {}; Object.keys(MAT).forEach(function (k) { colors[k] = lin(MAT[k].c); });

    // 视角状态
    var yaw = Math.PI - 0.6, pitch = 0.4, vYaw = 0, dragging = false, lastX = 0, lastY = 0, idleAt = 0;
    var spin = 0, t0 = performance.now(), last = t0, raf = 0, running = false, visible = true;
    var W = 0, H = 0;

    function resize() {
      var r = host.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    }

    function drawMesh(m, M, matKey, alpha) {
      var mt = MAT[matKey];
      gl.uniformMatrix4fv(prog.u.uM, false, M);
      gl.uniformMatrix3fv(prog.u.uNM, false, nmat(M));
      gl.uniform3fv(prog.u.uC, colors[matKey]);
      gl.uniform1f(prog.u.uShin, mt.shin); gl.uniform1f(prog.u.uSpec, mt.spec); gl.uniform1f(prog.u.uMetal, mt.metal);
      gl.uniform1f(prog.u.uA, alpha === undefined ? 1 : alpha);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.pb); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.nb); gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, m.count);
    }

    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var t = (now - t0) / 1000;
      resize();
      // 自动旋转 + 惯性
      if (!dragging) {
        yaw += vYaw * dt; vYaw *= Math.pow(0.04, dt);
        if (!reduce && now - idleAt > 2500) yaw += 0.22 * dt;
      }
      if (!reduce) spin += dt * 9;

      var asp = W / H;
      var dist = Math.max(44, 18.5 / (0.266 * asp)); // 窄屏自动拉远，保证整机完整入镜
      var target = [0, 0.3, 0];
      var eye = [0, target[1] + Math.sin(pitch) * dist, Math.cos(pitch) * dist];
      var VP = mul(persp(0.52, asp, 1, 400), lookAt(eye, target, [0, 1, 0]));
      var bob = reduce ? 0 : Math.sin(t * 1.5) * 0.35;
      var D = chain(T(0, bob, 0), RY(yaw), RZ(reduce ? 0 : Math.sin(t * 1.1) * 0.025), RX(reduce ? 0 : Math.sin(t * 0.8) * 0.02));

      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // 地面光斑
      gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(glow.p); gl.enableVertexAttribArray(aQ);
      gl.uniformMatrix4fv(glow.u.uVP, false, VP); gl.uniform1f(glow.u.uR, 19); gl.uniform1f(glow.u.uY, -6);
      gl.uniform1f(glow.u.uI, 0.22 - bob * 0.05);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf); gl.vertexAttribPointer(aQ, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(aQ);

      // 实体
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.disable(gl.BLEND);
      gl.useProgram(prog.p); gl.enableVertexAttribArray(aP); gl.enableVertexAttribArray(aN);
      gl.uniformMatrix4fv(prog.u.uVP, false, VP); gl.uniform3fv(prog.u.uCam, eye);
      Object.keys(meshes).forEach(function (k) { drawMesh(meshes[k], D, k); });
      MOTOR.forEach(function (mo) { drawMesh(propMesh, chain(D, T(mo[0], 3.0, mo[1]), RY(spin * mo[2])), "prop"); });
      // 桨盘虚影
      if (!reduce) {
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
        MOTOR.forEach(function (mo) { drawMesh(discMesh, chain(D, T(mo[0], 3.0, mo[1])), "bell", 0.07); });
        gl.depthMask(true);
      }
      gl.disableVertexAttribArray(aP); gl.disableVertexAttribArray(aN);

      if (running && visible) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && running && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    // 拖动旋转（横向拖动转、纵向调俯仰；不拦截页面滚动）
    canvas.style.touchAction = "pan-y";
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY; vYaw = 0; idleAt = performance.now();
      canvas.setPointerCapture(e.pointerId); host.classList.add("grabbing");
      if (opts.onInteract) opts.onInteract();
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      yaw += dx * 0.009; vYaw = dx * 0.55;
      if (e.pointerType === "mouse") pitch = Math.max(0.08, Math.min(1.0, pitch + dy * 0.006));
      idleAt = performance.now(); kick();
    });
    function end() { dragging = false; idleAt = performance.now(); host.classList.remove("grabbing"); }
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    // 键盘：左右键旋转
    canvas.tabIndex = 0;
    canvas.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { yaw += e.key === "ArrowLeft" ? -0.2 : 0.2; idleAt = performance.now(); kick(); e.preventDefault(); }
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; kick(); }).observe(host);
    }
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; kick(); });
    if ("ResizeObserver" in window) new ResizeObserver(function () { if (!raf && !(running && visible)) requestAnimationFrame(frame); }).observe(host);

    return {
      ok: true,
      start: function () { running = true; kick(); },
      stop: function () { running = false; },
    };
  }

  window.Drone3D = { mount: mount };
})();
