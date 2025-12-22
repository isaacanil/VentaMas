import {
  require_react
} from "./chunk-YW5IJWHK.js";
import {
  __toESM
} from "./chunk-OL46QLBJ.js";

// node_modules/react-scan/dist/index.mjs
var e = __toESM(require_react(), 1);
var t;
var n;
var o;
var r;
var i;
var s;
var l;
var a;
var c;
var u;
var d;
var m;
var p;
var f;
var h = Object.create;
var g = Object.defineProperty;
var b = Object.getOwnPropertyDescriptor;
var y = Object.getOwnPropertyNames;
var w = Object.getPrototypeOf;
var x = Object.prototype.hasOwnProperty;
var v = (e2, t2) => function() {
  return e2 && (t2 = (0, e2[y(e2)[0]])(e2 = 0)), t2;
};
var O = v({ "src/core/utils.ts"() {
  t = () => {
  }, n = (e2) => {
    let t2 = "";
    const n2 = /* @__PURE__ */ new Map();
    for (let t3 = 0, o3 = e2.length; t3 < o3; t3++) {
      const o4 = e2[t3], r3 = o4.name;
      if (!(r3 == null ? void 0 : r3.trim())) continue;
      const { count: i2, trigger: s2, forget: l2 } = n2.get(r3) ?? { count: 0, trigger: false, forget: false };
      n2.set(r3, { count: i2 + o4.count, trigger: s2 || o4.trigger, forget: l2 || o4.forget });
    }
    const o2 = Array.from(n2.entries()).sort(([, e3], [, t3]) => t3.count - e3.count), r2 = [];
    for (const [e3, { count: t3, trigger: n3, forget: i2 }] of o2) {
      let o3 = e3;
      t3 > 1 && (o3 += ` ×${t3}`), n3 && (o3 = `🔥 ${o3}`), i2 && (o3 = `${o3} ✨`), r2.push(o3);
    }
    return t2 = r2.join(" "), t2.length ? (t2.length > 20 && (t2 = `${t2.slice(0, 20)}…`), t2) : null;
  };
} });
var C = v({ "src/core/instrumentation/fiber.ts"() {
  O(), o = ({ onCommitFiberRoot: e2 }) => {
    let n2 = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    const o2 = /* @__PURE__ */ new Map();
    let r2 = 0;
    n2 || (n2 = { checkDCE: t, supportsFiber: true, renderers: o2, onScheduleFiberRoot: t, onCommitFiberRoot: t, onCommitFiberUnmount: t, inject(e3) {
      const t2 = ++r2;
      return o2.set(t2, e3), t2;
    } }, globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ = n2);
    const i2 = n2.onCommitFiberRoot;
    return n2.onCommitFiberRoot = (t2, n3) => {
      i2 && i2(t2, n3), e2(t2, n3);
    }, n2;
  }, r = (e2, t2) => {
    var _a;
    const n2 = e2.dependencies, o2 = (_a = e2.alternate) == null ? void 0 : _a.dependencies;
    if (!n2 || !o2) return false;
    if ("object" != typeof n2 || !("firstContext" in n2) || "object" != typeof o2 || !("firstContext" in o2)) return false;
    let r2 = n2.firstContext, i2 = o2.firstContext;
    for (; r2 && "object" == typeof r2 && "memoizedValue" in r2 && i2 && "object" == typeof i2 && "memoizedValue" in i2; ) {
      if (true === t2(r2, i2)) return true;
      r2 = r2.next, i2 = i2.next;
    }
    return true;
  }, i = (e2) => 5 === e2.tag || 26 === e2.tag || 27 === e2.tag, s = /* @__PURE__ */ new WeakSet(), l = /* @__PURE__ */ new WeakMap(), a = (e2) => {
    var _a;
    let t2 = e2.memoizedProps;
    const n2 = s.has(t2);
    t2 && "object" == typeof t2 && s.add(t2);
    let o2 = false;
    if (r(e2, (t3, n3) => {
      const r2 = l.get(e2) ?? /* @__PURE__ */ new WeakMap(), i3 = r2.get(n3.context);
      r2.has(n3.context) && Object.is(i3, n3.memoizedValue) || (o2 = true), r2.set(n3.context, n3.memoizedValue), l.set(e2, r2);
    }), !o2 && n2) return false;
    t2 ?? (t2 = {});
    const i2 = ((_a = e2.alternate) == null ? void 0 : _a.memoizedProps) || {}, a2 = e2.flags ?? e2.effectTag ?? 0;
    switch (e2.tag) {
      case 1:
      case 0:
      case 9:
      case 11:
      case 14:
      case 15:
        return !(1 & ~a2);
      default:
        return !e2.alternate || (i2 !== t2 || e2.alternate.memoizedState !== e2.memoizedState || e2.alternate.ref !== e2.ref);
    }
  }, c = (e2) => {
    let t2 = u(e2, i);
    return t2 || (t2 = u(e2, i, true)), t2;
  }, u = (e2, t2, n2 = false) => {
    if (!e2) return null;
    if (true === t2(e2)) return e2;
    let o2 = n2 ? e2.return : e2.child;
    for (; o2; ) {
      const e3 = u(o2, t2, n2);
      if (e3) return e3;
      o2 = n2 ? null : o2.sibling;
    }
    return null;
  }, d = (e2) => {
    const t2 = (e2 == null ? void 0 : e2.actualDuration) ?? 0;
    let n2 = t2, o2 = (e2 == null ? void 0 : e2.child) ?? null;
    for (; t2 > 0 && null != o2; ) n2 -= o2.actualDuration ?? 0, o2 = o2.sibling;
    return n2;
  }, m = (e2) => {
    var _a;
    return Boolean((_a = e2.updateQueue) == null ? void 0 : _a.memoCache);
  };
} });
((e2, t2, n2) => {
  n2 = null != e2 ? h(w(e2)) : {}, ((e3, t3, n3, o2) => {
    if (t3 && "object" == typeof t3 || "function" == typeof t3) for (let r2 of y(t3)) x.call(e3, r2) || r2 === n3 || g(e3, r2, { get: () => t3[r2], enumerable: !(o2 = b(t3, r2)) || o2.enumerable });
  })(e2 && e2.__esModule ? n2 : g(n2, "default", { value: e2, enumerable: true }), e2);
})((p = { "src/core/instrumentation/placeholder.ts"() {
  C(), o({ onCommitFiberRoot() {
  } });
} }, function() {
  return f || (0, p[y(p)[0]])((f = { exports: {} }).exports, f), f.exports;
})());
var T = (t2) => {
  switch (typeof t2) {
    case "function":
      return t2.toString();
    case "string":
      return t2;
    case "object":
      if (null === t2) return "null";
      if (Array.isArray(t2)) return t2.length > 0 ? "[…]" : "[]";
      if (e.isValidElement(t2) && "$$typeof" in t2 && "symbol" == typeof t2.$$typeof && "Symbol(react.element)" === String(t2.$$typeof)) return `<${S(t2.type) ?? ""}${Object.keys(t2.props || {}).length > 0 ? " …" : ""}>`;
      if ("object" == typeof t2 && null !== t2 && t2.constructor === Object) {
        for (const e2 in t2) if (Object.prototype.hasOwnProperty.call(t2, e2)) return "{…}";
        return "{}";
      }
      const n2 = Object.prototype.toString.call(t2).slice(8, -1);
      if ("Object" === n2) {
        const e2 = Object.getPrototypeOf(t2), n3 = e2 == null ? void 0 : e2.constructor;
        if ("function" == typeof n3) return `${n3.displayName || n3.name || ""}{…}`;
      }
      return `${n2}{…}`;
    default:
      return String(t2);
  }
};
var $ = (e2) => "function" == typeof e2 ? e2 : "object" == typeof e2 && e2 ? $(e2.type || e2.render) : null;
var S = (e2) => (e2 = $(e2)) && (e2.displayName || e2.name) || null;
C();
var A = ["function", "object"];
var F = ({ onCommitStart: t2, onRender: n2, onCommitFinish: i2 }) => {
  const s2 = (o2, s3) => {
    if (N.isPaused) return;
    t2();
    const l2 = (t3, o3) => {
      const i3 = $(t3.type);
      if (!i3) return null;
      if (!a(t3)) return null;
      const s4 = ((t4, n3) => {
        var _a;
        const o4 = [], r2 = (_a = t4.alternate) == null ? void 0 : _a.memoizedProps, i4 = t4.memoizedProps;
        for (const t5 in { ...r2, ...i4 }) {
          const n4 = r2 == null ? void 0 : r2[t5], s5 = i4 == null ? void 0 : i4[t5];
          if (Object.is(n4, s5) || e.isValidElement(n4) || e.isValidElement(s5) || "children" === t5) continue;
          const l4 = { name: t5, prevValue: n4, nextValue: s5, unstable: false };
          o4.push(l4);
          const a2 = T(n4), c3 = T(s5);
          A.includes(typeof n4) && A.includes(typeof s5) && a2 === c3 && (l4.unstable = true);
        }
        return { type: "props", count: 1, trigger: false, changes: o4, name: S(n3), time: d(t4), forget: m(t4) };
      })(t3, i3), l3 = ((e2, t4) => {
        const n3 = [];
        return r(e2, (e3, t5) => {
          const o4 = e3.memoizedValue, r2 = t5.memoizedValue, i4 = { name: "", prevValue: o4, nextValue: r2, unstable: false };
          n3.push(i4);
          const s5 = T(o4), l4 = T(r2);
          A.includes(typeof o4) && A.includes(typeof r2) && s5 === l4 && (i4.unstable = true);
        }) ? { type: "context", count: 1, trigger: false, changes: n3, name: S(t4), time: d(e2), forget: m(e2) } : null;
      })(t3, i3);
      if (!s4 && !l3) return null;
      const c2 = N.componentAllowList, p2 = (c2 == null ? void 0 : c2.has(t3.type)) ?? (c2 == null ? void 0 : c2.has(t3.elementType));
      if (p2) {
        if (!u(t3, (e2) => {
          const t4 = (c2 == null ? void 0 : c2.get(e2.type)) ?? (c2 == null ? void 0 : c2.get(e2.elementType));
          return t4 == null ? void 0 : t4.includeChildren;
        }, true) && !p2) return null;
      }
      s4 && (s4.trigger = o3, n2(t3, s4)), l3 && (l3.trigger = o3, n2(t3, l3));
    };
    if (s3.memoizedUpdaters) for (const e2 of s3.memoizedUpdaters) l2(e2, true);
    u(s3.current, (e2) => {
      l2(e2, false);
    }), i2();
  };
  N.onCommitFiberRoot = (e2, t3) => {
    try {
      s2(0, t3);
    } catch (e3) {
      console.error("[React Scan] Error instrumenting: ", e3);
    }
  }, o({ onCommitFiberRoot: N.onCommitFiberRoot });
};
C(), O();
var M = (e2) => {
  for (let t2 = 0, n2 = e2.renders.length; t2 < n2; t2++) {
    const n3 = e2.renders[t2];
    if (n3.changes) for (let e3 = 0, t3 = n3.changes.length; e3 < t3; e3++) {
      if (n3.changes[e3].unstable) return true;
    }
  }
  return false;
};
var P = (e2) => {
  const t2 = document.createElement("template");
  return t2.innerHTML = e2.trim(), t2.content.firstElementChild;
};
O();
O();
var j = "Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace";
var E = { current: "115,97,230" };
var R = (e2) => `${e2.rect.top}-${e2.rect.left}-${e2.rect.width}-${e2.rect.height}`;
var k = /* @__PURE__ */ new Map();
var V = (e2) => {
  const t2 = k.get(e2);
  if (t2 && t2.timestamp > performance.now() - 16) return t2.rect;
  const n2 = window.getComputedStyle(e2);
  if ("none" === n2.display || "hidden" === n2.visibility || "0" === n2.opacity) return null;
  const o2 = e2.getBoundingClientRect();
  return o2.top >= 0 && o2.left >= 0 && o2.bottom <= window.innerHeight && o2.right <= window.innerWidth && o2.width && o2.height ? (k.set(e2, { rect: o2, timestamp: performance.now() }), o2) : null;
};
var _ = /* @__PURE__ */ ((e2, t2) => {
  let n2 = 0;
  return (...o2) => {
    const r2 = Date.now();
    if (r2 - n2 >= t2) return n2 = r2, e2(...o2);
  };
})(() => {
  const { scheduledOutlines: e2, activeOutlines: t2 } = N;
  for (let t3 = e2.length - 1; t3 >= 0; t3--) {
    const n2 = e2[t3], o2 = V(n2.domNode);
    o2 ? n2.rect = o2 : e2.splice(t3, 1);
  }
  for (let e3 = t2.length - 1; e3 >= 0; e3--) {
    const n2 = t2[e3];
    if (!n2) continue;
    const { outline: o2 } = n2, r2 = V(o2.domNode);
    r2 ? o2.rect = r2 : t2.splice(e3, 1);
  }
}, 16);
var z = (e2, t2 = /* @__PURE__ */ new Map(), n2 = null, o2 = null) => {
  if (!N.scheduledOutlines.length) return;
  const r2 = N.scheduledOutlines;
  N.scheduledOutlines = [], requestAnimationFrame(() => {
    o2 && ((e3) => {
      const { longTaskThreshold: t3 } = N.options, n3 = t3 ?? 50;
      let o3 = 0;
      for (let t4 = 0, n4 = e3.length; t4 < n4; t4++) {
        const n5 = e3[t4].duration;
        n5 > o3 && (o3 = n5);
      }
      E.current = o3 > n3 ? "185,49,115" : "115,97,230";
    })(o2.takeRecords()), _(), (async () => {
      const i2 = N.scheduledOutlines;
      N.scheduledOutlines = [];
      const s2 = i2 ? ((e3) => {
        const t3 = /* @__PURE__ */ new Map();
        for (let n3 = 0, o3 = e3.length; n3 < o3; n3++) {
          const o4 = e3[n3], r3 = R(o4), i3 = t3.get(r3);
          i3 ? i3.renders.push(...o4.renders) : t3.set(r3, o4);
        }
        return Array.from(t3.values());
      })([...r2, ...i2]) : r2, l2 = /* @__PURE__ */ new Map();
      if (n2) {
        let e3 = 0, t3 = 0;
        for (let n3 = 0, o4 = s2.length; n3 < o4; n3++) {
          const o5 = s2[n3];
          for (let n4 = 0, r3 = o5.renders.length; n4 < r3; n4++) {
            const r4 = o5.renders[n4];
            t3 += r4.time, e3 += r4.count;
          }
        }
        let o3 = `×${e3}`;
        t3 > 0 && (o3 += ` (${t3.toFixed(2)}ms)`), n2.textContent = `${o3} · react-scan`;
      }
      await Promise.all(s2.map(async (n3) => {
        const o3 = R(n3);
        t2.has(o3) || (await I(e2, n3), l2.set(o3, n3));
      })), N.scheduledOutlines.length && z(e2, l2, n2, o2);
    })();
  });
};
var L = null;
var I = (e2, t2) => new Promise((o2) => {
  var _a;
  const r2 = M(t2) ? 60 : 5, { options: i2 } = N;
  (_a = i2.onPaintStart) == null ? void 0 : _a.call(i2, t2), i2.log && ((e3) => {
    const t3 = /* @__PURE__ */ new Map();
    for (let o3 = 0, r3 = e3.length; o3 < r3; o3++) {
      const r4 = e3[o3];
      if (!r4.name) continue;
      const i3 = t3.get(r4.name) ?? [], s3 = n([r4]);
      if (s3) {
        if ("props" === r4.type) {
          let e4 = null, t4 = null;
          if (r4.changes) for (let n2 = 0, o4 = r4.changes.length; n2 < o4; n2++) {
            const { name: o5, prevValue: i4, nextValue: s4, unstable: l3 } = r4.changes[n2];
            l3 && (e4 ?? (e4 = {}), t4 ?? (t4 = {}), e4[`${o5} (prev)`] = i4, t4[`${o5} (next)`] = s4);
          }
          if (!e4 || !t4) continue;
          i3.push({ prev: e4, next: t4, type: "props" });
        }
        if ("context" === r4.type && r4.changes) for (let e4 = 0, t4 = r4.changes.length; e4 < t4; e4++) {
          const { prevValue: t5, nextValue: n2, unstable: o4 } = r4.changes[e4];
          o4 && i3.push({ prev: t5, next: n2, type: "context" });
        }
        t3.set(s3, i3);
      }
    }
    for (const [e4, n2] of Array.from(t3.entries())) {
      console.group(`%c${e4}`, "background: hsla(0,0%,70%,.3); border-radius:3px; padding: 0 2px;"), console.log("Memoize these values:");
      for (const { type: e5, prev: t4, next: o3 } of n2) console.log(`${e5}:`, t4, "!==", o3);
      console.groupEnd();
    }
  })(t2.renders);
  const s2 = R(t2), l2 = N.activeOutlines.find((e3) => R(e3.outline) === s2), a2 = t2.renders.length, c2 = N.options.maxRenders, u2 = Math.min(a2 / (c2 ?? 20), 1), d2 = 115, m2 = 97, p2 = 230, f2 = 185, h2 = 49, g2 = 115, b2 = { r: Math.round(d2 + u2 * (f2 - d2)), g: Math.round(m2 + u2 * (h2 - m2)), b: Math.round(p2 + u2 * (g2 - p2)) };
  if (l2) l2.outline.renders.push(...t2.renders), l2.outline.rect = t2.rect, l2.frame = 0, l2.totalFrames = r2, l2.alpha = 0.8, l2.text = n(l2.outline.renders), l2.color = b2;
  else {
    const e3 = 0;
    N.activeOutlines.push({ outline: t2, alpha: 0.8, frame: e3, totalFrames: r2, resolve: () => {
      var _a2;
      o2(), (_a2 = i2.onPaintFinish) == null ? void 0 : _a2.call(i2, t2);
    }, text: n(t2.renders), color: b2 });
  }
  L || (L = requestAnimationFrame(() => D(e2)));
});
var D = (e2) => {
  const { activeOutlines: t2 } = N;
  e2.clearRect(0, 0, e2.canvas.width, e2.canvas.height);
  const n2 = new Path2D();
  let o2 = 0, r2 = 0;
  const i2 = [];
  for (let e3 = t2.length - 1; e3 >= 0; e3--) {
    const s2 = t2[e3];
    if (!s2) continue;
    const { outline: l2, frame: a2, totalFrames: c2 } = s2;
    requestAnimationFrame(() => {
      if (!l2) return;
      const e4 = V(l2.domNode);
      e4 && (l2.rect = e4);
    });
    const { rect: u2 } = l2, d2 = M(l2), m2 = d2 ? 0.8 : 0.2;
    s2.alpha = m2 * (1 - a2 / c2), o2 = Math.max(o2, s2.alpha), r2 = Math.max(r2, 0.1 * s2.alpha), n2.rect(u2.x, u2.y, u2.width, u2.height), d2 && i2.push({ alpha: s2.alpha, outline: l2, text: s2.text }), s2.frame++, s2.frame > s2.totalFrames && t2.splice(e3, 1);
  }
  e2.save(), e2.strokeStyle = `rgba(${E.current}, ${o2})`, e2.lineWidth = 1, e2.fillStyle = `rgba(${E.current}, ${r2})`, e2.stroke(n2), e2.fill(n2), e2.restore();
  for (let t3 = 0, n3 = i2.length; t3 < n3; t3++) {
    const { alpha: n4, outline: o3, text: r3 } = i2[t3], { rect: s2 } = o3;
    if (e2.save(), r3) {
      e2.font = `10px ${j}`;
      const t4 = e2.measureText(r3).width, o4 = 10, i3 = s2.x, l2 = s2.y - o4 - 4;
      e2.fillStyle = `rgba(${E.current},${n4})`, e2.fillRect(i3, l2, t4 + 4, o4 + 4), e2.fillStyle = `rgba(255,255,255,${n4})`, e2.fillText(r3, i3 + 2, l2 + o4);
    }
    e2.restore();
  }
  L = t2.length ? requestAnimationFrame(() => D(e2)) : null;
};
var q = () => {
  const e2 = P('<canvas id="react-scan-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483646" aria-hidden="true"/>'), t2 = e2.getContext("2d");
  let n2 = false;
  const o2 = () => {
    const o3 = window.devicePixelRatio;
    e2.width = o3 * window.innerWidth, e2.height = o3 * window.innerHeight, t2 && (t2.resetTransform(), t2.scale(o3, o3)), n2 = false;
  };
  var r2;
  return o2(), window.addEventListener("resize", () => {
    _(), n2 || (n2 = true, requestAnimationFrame(() => {
      o2();
    }));
  }), window.addEventListener("scroll", () => {
    _();
  }), r2 = () => {
    const t3 = document.getElementById("react-scan-overlay");
    t3 && t3.remove(), document.documentElement.appendChild(e2);
  }, "scheduler" in globalThis ? globalThis.scheduler.postTask(r2, { priority: "background" }) : "requestIdleCallback" in window ? requestIdleCallback(r2) : setTimeout(r2, 0), t2;
};
var N = { onCommitFiberRoot: (e2, t2) => {
}, get isProd() {
  return "_self" in e.createElement("div") && !N.options.runInProduction;
}, isInIframe: window.self !== window.top, isPaused: false, componentAllowList: null, options: { enabled: true, includeChildren: true, runInProduction: false, playSound: false, log: false, showToolbar: true, longTaskThreshold: 50, report: false }, reportData: {}, scheduledOutlines: [], activeOutlines: [] };
var B = () => N.reportData;
var W = (e2) => {
  N.options = { ...N.options, ...e2 };
};
var H = () => N.options;
var G = false;
var U = () => {
  if (G) return;
  G = true;
  const { options: e2 } = N, n2 = q(), o2 = e2.showToolbar ? (() => {
    const e3 = P(`<div id="react-scan-toolbar" title="Number of unnecessary renders and time elapsed" style="position:fixed;bottom:3px;right:3px;background:rgba(0,0,0,0.5);padding:4px 8px;border-radius:4px;color:white;z-index:2147483647;font-family:${j}" aria-hidden="true">react-scan</div>`);
    let t2 = "localStorage" in globalThis && "true" === localStorage.getItem("react-scan-hidden");
    const n3 = () => {
      const n4 = document.getElementById("react-scan-overlay");
      n4 && (n4.style.display = t2 ? "none" : "block", e3.textContent = t2 ? "start ►" : "stop ⏹", N.isPaused = t2, N.isPaused && (N.activeOutlines = [], N.scheduledOutlines = []), "localStorage" in globalThis && localStorage.setItem("react-scan-hidden", t2.toString()));
    };
    n3(), e3.addEventListener("click", () => {
      t2 = !t2, n3();
    }), e3.addEventListener("mouseenter", () => {
      e3.textContent = t2 ? "start ►" : "stop ⏹", e3.style.backgroundColor = "rgba(0,0,0,1)";
    }), e3.addEventListener("mouseleave", () => {
      e3.style.backgroundColor = "rgba(0,0,0,0.5)";
    });
    const o3 = document.getElementById("react-scan-toolbar");
    return o3 && o3.remove(), document.documentElement.appendChild(e3), e3;
  })() : null, r2 = (() => {
    const e3 = new PerformanceObserver(t);
    return e3.observe({ entryTypes: ["longtask"] }), e3;
  })(), i2 = "undefined" != typeof window ? new (window.AudioContext || window.webkitAudioContext)() : null;
  n2 && (console.log("%cTry Million Lint to automatically optimize your app: https://million.dev", `font-weight:bold;font-size:14px;font-weight:bold;font-family:${j}`), globalThis.__REACT_SCAN__ = { ReactScanInternals: N }, F({ onCommitStart() {
    var _a;
    (_a = e2.onCommitStart) == null ? void 0 : _a.call(e2);
  }, onRender(t2, s2) {
    var _a;
    (_a = e2.onRender) == null ? void 0 : _a.call(e2, t2, s2);
    const l2 = ((e3, t3) => {
      const n3 = c(e3);
      if (!n3) return null;
      const o3 = n3.stateNode;
      if (!(o3 instanceof HTMLElement)) return null;
      let r3 = false, i3 = o3;
      for (; i3; ) {
        if (i3.hasAttribute("data-react-scan-ignore")) {
          r3 = true;
          break;
        }
        i3 = i3.parentElement;
      }
      if (r3) return null;
      const s3 = V(o3);
      return s3 ? { rect: s3, domNode: o3, renders: [t3] } : null;
    })(t2, s2);
    if (l2) {
      if (N.scheduledOutlines.push(l2), e2.playSound && i2) {
        const e3 = 10, t3 = Math.min(1, (s2.time - e3) / (2 * e3));
        ((e4, t4) => {
          const n3 = Math.max(0.5, t4), o3 = 1e-3, r3 = 440 + 200 * t4, i3 = e4.createOscillator();
          i3.type = "sine", i3.frequency.setValueAtTime(r3, e4.currentTime), i3.frequency.exponentialRampToValueAtTime(220, e4.currentTime + o3);
          const s3 = e4.createGain();
          s3.gain.setValueAtTime(n3, e4.currentTime), s3.gain.exponentialRampToValueAtTime(0.01, 5e-4), i3.connect(s3), s3.connect(e4.destination), i3.start(), i3.stop(e4.currentTime + o3);
        })(i2, t3);
      }
      if (s2.name) {
        const e3 = N.reportData[s2.name];
        e3 && e3.renders.push(s2), N.reportData[s2.name] = { count: ((e3 == null ? void 0 : e3.count) ?? 0) + s2.count, time: ((e3 == null ? void 0 : e3.time) ?? 0) + s2.time, renders: (e3 == null ? void 0 : e3.renders) || [] };
      }
      requestAnimationFrame(() => {
        z(n2, /* @__PURE__ */ new Map(), o2, r2);
      });
    }
  }, onCommitFinish() {
    var _a;
    (_a = e2.onCommitFinish) == null ? void 0 : _a.call(e2);
  } }));
};
var K = (e2, t2 = {}) => {
  W(t2);
  const { isInIframe: n2, isProd: o2, componentAllowList: r2 } = N;
  return n2 || o2 || false === t2.enabled || (r2 || (N.componentAllowList = /* @__PURE__ */ new WeakMap()), r2 && r2.set(e2, { ...t2 }), U()), e2;
};
var Q = (e2 = {}) => {
  W(e2);
  const { isInIframe: t2, isProd: n2 } = N;
  t2 || n2 || false === e2.enabled || U();
};
export {
  N as ReactScanInternals,
  H as getOptions,
  B as getReport,
  Q as scan,
  W as setOptions,
  U as start,
  K as withScan
};
//# sourceMappingURL=react-scan.js.map
