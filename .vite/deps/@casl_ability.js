import "./chunk-OL46QLBJ.js";

// node_modules/@ucast/core/dist/es6m/index.mjs
var t = class {
  constructor(t3, e3) {
    this.operator = t3, this.value = e3, Object.defineProperty(this, "t", { writable: true });
  }
  get notes() {
    return this.t;
  }
  addNote(t3) {
    this.t = this.t || [], this.t.push(t3);
  }
};
var e = class extends t {
};
var r = class extends e {
  constructor(t3, e3) {
    if (!Array.isArray(e3)) throw new Error(`"${t3}" operator expects to receive an array of conditions`);
    super(t3, e3);
  }
};
var n = "__itself__";
var o = class extends t {
  constructor(t3, e3, r2) {
    super(t3, r2), this.field = e3;
  }
};
var s = new e("__null__", null);
var i = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);
function c(t3, e3) {
  return e3 instanceof r && e3.operator === t3;
}
function u(t3, e3) {
  return 1 === e3.length ? e3[0] : new r(t3, function t4(e4, r2, n3) {
    const o3 = n3 || [];
    for (let n4 = 0, s3 = r2.length; n4 < s3; n4++) {
      const s4 = r2[n4];
      c(e4, s4) ? t4(e4, s4.value, o3) : o3.push(s4);
    }
    return o3;
  }(t3, e3));
}
var a = (t3) => t3;
var h = () => /* @__PURE__ */ Object.create(null);
var f = Object.defineProperty(h(), "__@type@__", { value: "ignore value" });
function l(t3, e3, r2 = false) {
  if (!t3 || t3 && t3.constructor !== Object) return false;
  for (const n3 in t3) {
    if (i(t3, n3) && i(e3, n3) && (!r2 || t3[n3] !== f)) return true;
  }
  return false;
}
function d(t3) {
  const e3 = [];
  for (const r2 in t3) i(t3, r2) && t3[r2] !== f && e3.push(r2);
  return e3;
}
function p(t3, e3) {
  e3 !== s && t3.push(e3);
}
var w = (t3) => u("and", t3);
var O = { compound(t3, e3, n3) {
  const o3 = (Array.isArray(e3) ? e3 : [e3]).map((t4) => n3.parse(t4));
  return new r(t3.name, o3);
}, field: (t3, e3, r2) => new o(t3.name, r2.field, e3), document: (t3, r2) => new e(t3.name, r2) };
var j = class {
  constructor(t3, e3 = h()) {
    this.o = void 0, this.s = void 0, this.i = void 0, this.u = void 0, this.h = void 0, this.parse = this.parse.bind(this), this.u = { operatorToConditionName: e3.operatorToConditionName || a, defaultOperatorName: e3.defaultOperatorName || "eq", mergeFinalConditions: e3.mergeFinalConditions || w }, this.o = Object.keys(t3).reduce((e4, r2) => (e4[r2] = Object.assign({ name: this.u.operatorToConditionName(r2) }, t3[r2]), e4), {}), this.s = Object.assign({}, e3.fieldContext, { field: "", query: {}, parse: this.parse, hasOperators: (t4) => l(t4, this.o, e3.useIgnoreValue) }), this.i = Object.assign({}, e3.documentContext, { parse: this.parse, query: {} }), this.h = e3.useIgnoreValue ? d : Object.keys;
  }
  setParse(t3) {
    this.parse = t3, this.s.parse = t3, this.i.parse = t3;
  }
  parseField(t3, e3, r2, n3) {
    const o3 = this.o[e3];
    if (!o3) throw new Error(`Unsupported operator "${e3}"`);
    if ("field" !== o3.type) throw new Error(`Unexpected ${o3.type} operator "${e3}" at field level`);
    return this.s.field = t3, this.s.query = n3, this.parseInstruction(o3, r2, this.s);
  }
  parseInstruction(t3, e3, r2) {
    "function" == typeof t3.validate && t3.validate(t3, e3);
    return (t3.parse || O[t3.type])(t3, e3, r2);
  }
  parseFieldOperators(t3, e3) {
    const r2 = [], n3 = this.h(e3);
    for (let o3 = 0, s3 = n3.length; o3 < s3; o3++) {
      const s4 = n3[o3];
      if (!this.o[s4]) throw new Error(`Field query for "${t3}" may contain only operators or a plain object as a value`);
      p(r2, this.parseField(t3, s4, e3[s4], e3));
    }
    return r2;
  }
  parse(t3) {
    const e3 = [], r2 = this.h(t3);
    this.i.query = t3;
    for (let n3 = 0, o3 = r2.length; n3 < o3; n3++) {
      const o4 = r2[n3], s3 = t3[o4], i4 = this.o[o4];
      if (i4) {
        if ("document" !== i4.type && "compound" !== i4.type) throw new Error(`Cannot use parsing instruction for operator "${o4}" in "document" context as it is supposed to be used in  "${i4.type}" context`);
        p(e3, this.parseInstruction(i4, s3, this.i));
      } else this.s.hasOperators(s3) ? e3.push(...this.parseFieldOperators(o4, s3)) : p(e3, this.parseField(o4, this.u.defaultOperatorName, s3, t3));
    }
    return this.u.mergeFinalConditions(e3);
  }
};
function _(t3, e3) {
  const r2 = t3[e3];
  if ("function" != typeof r2) throw new Error(`Unable to interpret "${e3}" condition. Did you forget to register interpreter for it?`);
  return r2;
}
function y(t3) {
  return t3.operator;
}
function m(t3, e3) {
  const r2 = e3, n3 = r2 && r2.getInterpreterName || y;
  let o3;
  switch (r2 ? r2.numberOfArguments : 0) {
    case 1:
      o3 = (e4) => {
        const o4 = n3(e4, r2);
        return _(t3, o4)(e4, s3);
      };
      break;
    case 3:
      o3 = (e4, o4, i4) => {
        const c4 = n3(e4, r2);
        return _(t3, c4)(e4, o4, i4, s3);
      };
      break;
    default:
      o3 = (e4, o4) => {
        const i4 = n3(e4, r2);
        return _(t3, i4)(e4, o4, s3);
      };
  }
  const s3 = Object.assign({}, r2, { interpret: o3 });
  return s3.interpret;
}
function v(t3, e3) {
  return (r2, ...n3) => {
    const o3 = t3(r2, ...n3), s3 = e3.bind(null, o3);
    return s3.ast = o3, s3;
  };
}
var x = j.prototype.parseInstruction;

// node_modules/@ucast/mongo/dist/es6m/index.mjs
function s2(e3, t3) {
  if (!Array.isArray(t3)) throw new Error(`"${e3.name}" expects value to be an array`);
}
function p2(e3, t3) {
  if (s2(e3, t3), !t3.length) throw new Error(`"${e3.name}" expects to have at least one element in array`);
}
var l2 = (e3) => (t3, r2) => {
  if (typeof r2 !== e3) throw new Error(`"${t3.name}" expects value to be a "${e3}"`);
};
var c2 = { type: "compound", validate: p2, parse(t3, r2, { parse: o3 }) {
  const a4 = r2.map((e3) => o3(e3));
  return u(t3.name, a4);
} };
var f2 = c2;
var d2 = { type: "compound", validate: p2 };
var u2 = { type: "field", validate(e3, t3) {
  if (!(t3 && (t3 instanceof RegExp || t3.constructor === Object))) throw new Error(`"${e3.name}" expects to receive either regular expression or object of field operators`);
}, parse(e3, o3, a4) {
  const n3 = o3 instanceof RegExp ? new o("regex", a4.field, o3) : a4.parse(o3, a4);
  return new r(e3.name, [n3]);
} };
var $ = { type: "field", validate(e3, t3) {
  if (!t3 || t3.constructor !== Object) throw new Error(`"${e3.name}" expects to receive an object with nested query or field level operators`);
}, parse(e3, r2, { parse: a4, field: n3, hasOperators: i4 }) {
  const s3 = i4(r2) ? a4(r2, { field: n }) : a4(r2);
  return new o(e3.name, n3, s3);
} };
var w2 = { type: "field", validate: l2("number") };
var y2 = { type: "field", validate: s2 };
var x2 = y2;
var v2 = y2;
var h2 = { type: "field", validate(e3, t3) {
  if (!Array.isArray(t3) || 2 !== t3.length) throw new Error(`"${e3.name}" expects an array with 2 numeric elements`);
} };
var m2 = { type: "field", validate: l2("boolean") };
var g = { type: "field", validate: function(e3, t3) {
  if (!("string" == typeof t3 || "number" == typeof t3 || t3 instanceof Date)) throw new Error(`"${e3.name}" expects value to be comparable (i.e., string, number or date)`);
} };
var b = g;
var E = b;
var j2 = b;
var O2 = { type: "field" };
var R = O2;
var _2 = { type: "field", validate(e3, t3) {
  if (!(t3 instanceof RegExp) && "string" != typeof t3) throw new Error(`"${e3.name}" expects value to be a regular expression or a string that represents regular expression`);
}, parse(e3, r2, o3) {
  const a4 = "string" == typeof r2 ? new RegExp(r2, o3.query.$options || "") : r2;
  return new o(e3.name, o3.field, a4);
} };
var q = { type: "field", parse: () => s };
var A = { type: "document", validate: l2("function") };
var N = Object.freeze({ __proto__: null, $and: c2, $or: f2, $nor: d2, $not: u2, $elemMatch: $, $size: w2, $in: y2, $nin: x2, $all: v2, $mod: h2, $exists: m2, $gte: g, $gt: b, $lt: E, $lte: j2, $eq: O2, $ne: R, $regex: _2, $options: q, $where: A });
var P = class extends j {
  constructor(e3) {
    super(e3, { defaultOperatorName: "$eq", operatorToConditionName: (e4) => e4.slice(1) });
  }
  parse(e3, t3) {
    return t3 && t3.field ? w(this.parseFieldOperators(t3.field, e3)) : super.parse(e3);
  }
};
var z = N;

// node_modules/@ucast/js/dist/es6m/index.mjs
function n2(r2, t3, n3) {
  for (let e3 = 0, o3 = r2.length; e3 < o3; e3++) if (0 === n3(r2[e3], t3)) return true;
  return false;
}
function e2(r2, t3) {
  return Array.isArray(r2) && Number.isNaN(Number(t3));
}
function o2(r2, t3, n3) {
  if (!e2(r2, t3)) return n3(r2, t3);
  let o3 = [];
  for (let e3 = 0; e3 < r2.length; e3++) {
    const u5 = n3(r2[e3], t3);
    void 0 !== u5 && (o3 = o3.concat(u5));
  }
  return o3;
}
function u3(r2) {
  return (t3, n3, e3) => {
    const o3 = e3.get(n3, t3.field);
    return Array.isArray(o3) ? o3.some((n4) => r2(t3, n4, e3)) : r2(t3, o3, e3);
  };
}
var c3 = (r2, t3) => r2[t3];
function i2(r2, t3, n3) {
  const e3 = t3.lastIndexOf(".");
  return -1 === e3 ? [r2, t3] : [n3(r2, t3.slice(0, e3)), t3.slice(e3 + 1)];
}
function f3(t3, n3, e3 = c3) {
  if (n3 === n) return t3;
  if (!t3) throw new Error(`Unable to get field "${n3}" out of ${String(t3)}.`);
  return function(r2, t4, n4) {
    if (-1 === t4.indexOf(".")) return o2(r2, t4, n4);
    const e4 = t4.split(".");
    let u5 = r2;
    for (let r3 = 0, t5 = e4.length; r3 < t5; r3++) if (u5 = o2(u5, e4[r3], n4), !u5 || "object" != typeof u5) return u5;
    return u5;
  }(t3, n3, e3);
}
function a2(r2, t3) {
  return r2 === t3 ? 0 : r2 > t3 ? 1 : -1;
}
function l3(r2, n3 = {}) {
  return m(r2, Object.assign({ get: f3, compare: a2 }, n3));
}
var p3 = (r2, t3, { interpret: n3 }) => r2.value.some((r3) => n3(r3, t3));
var g2 = (r2, t3, n3) => !p3(r2, t3, n3);
var m3 = (r2, t3, { interpret: n3 }) => r2.value.every((r3) => n3(r3, t3));
var y3 = (r2, t3, { interpret: n3 }) => !n3(r2.value[0], t3);
var b2 = (r2, t3, { compare: e3, get: o3 }) => {
  const u5 = o3(t3, r2.field);
  return Array.isArray(u5) && !Array.isArray(r2.value) ? n2(u5, r2.value, e3) : 0 === e3(u5, r2.value);
};
var A2 = (r2, t3, n3) => !b2(r2, t3, n3);
var d3 = u3((r2, t3, n3) => {
  const e3 = n3.compare(t3, r2.value);
  return 0 === e3 || -1 === e3;
});
var h3 = u3((r2, t3, n3) => -1 === n3.compare(t3, r2.value));
var j3 = u3((r2, t3, n3) => 1 === n3.compare(t3, r2.value));
var w3 = u3((r2, t3, n3) => {
  const e3 = n3.compare(t3, r2.value);
  return 0 === e3 || 1 === e3;
});
var _3 = (t3, n3, { get: o3 }) => {
  if (t3.field === n) return void 0 !== n3;
  const [u5, c4] = i2(n3, t3.field, o3), f4 = (r2) => !!r2 && r2.hasOwnProperty(c4) === t3.value;
  return e2(u5, c4) ? u5.some(f4) : f4(u5);
};
var v3 = u3((r2, t3) => "number" == typeof t3 && t3 % r2.value[0] === r2.value[1]);
var x3 = (t3, n3, { get: o3 }) => {
  const [u5, c4] = i2(n3, t3.field, o3), f4 = (r2) => {
    const n4 = o3(r2, c4);
    return Array.isArray(n4) && n4.length === t3.value;
  };
  return t3.field !== n && e2(u5, c4) ? u5.some(f4) : f4(u5);
};
var O3 = u3((r2, t3) => "string" == typeof t3 && r2.value.test(t3));
var N2 = u3((r2, t3, { compare: e3 }) => n2(r2.value, t3, e3));
var $2 = (r2, t3, n3) => !N2(r2, t3, n3);
var q2 = (r2, t3, { compare: e3, get: o3 }) => {
  const u5 = o3(t3, r2.field);
  return Array.isArray(u5) && r2.value.every((r3) => n2(u5, r3, e3));
};
var z2 = (r2, t3, { interpret: n3, get: e3 }) => {
  const o3 = e3(t3, r2.field);
  return Array.isArray(o3) && o3.some((t4) => n3(r2.value, t4));
};
var E2 = (r2, t3) => r2.value.call(t3);
var M = Object.freeze({ __proto__: null, or: p3, nor: g2, and: m3, not: y3, eq: b2, ne: A2, lte: d3, lt: h3, gt: j3, gte: w3, exists: _3, mod: v3, size: x3, regex: O3, within: N2, nin: $2, all: q2, elemMatch: z2, where: E2 });
var S = Object.assign({}, M, { in: N2 });
var U = l3(S);

// node_modules/@ucast/mongo2js/dist/es6m/index.mjs
function i3(o3) {
  return o3 instanceof Date ? o3.getTime() : o3 && "function" == typeof o3.toJSON ? o3.toJSON() : o3;
}
var m4 = (o3, t3) => a2(i3(o3), i3(t3));
function p4(e3, c4, f4) {
  const s3 = new P(e3), i4 = l3(c4, Object.assign({ compare: m4 }, f4));
  if (f4 && f4.forPrimitives) {
    const o3 = { field: n }, r2 = s3.parse;
    s3.setParse((t3) => r2(t3, o3));
  }
  return v(s3.parse, i4);
}
var a3 = p4(z, S);
var u4 = p4(["$and", "$or"].reduce((o3, t3) => (o3[t3] = Object.assign({}, o3[t3], { type: "field" }), o3), Object.assign({}, z, { $nor: Object.assign({}, z.$nor, { type: "field", parse: O.compound }) })), S, { forPrimitives: true });

// node_modules/@casl/ability/dist/es6m/index.mjs
function O4(t3) {
  return Array.isArray(t3) ? t3 : [t3];
}
var C = Object.hasOwn || Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);
var R2 = "__caslSubjectType__";
function P2(t3, e3) {
  if (e3) {
    if (!C(e3, R2)) Object.defineProperty(e3, R2, { value: t3 });
    else if (t3 !== e3[R2]) throw new Error(`Trying to cast object to subject type ${t3} but previously it was casted to ${e3[R2]}`);
  }
  return e3;
}
var S2 = (t3) => {
  const e3 = typeof t3;
  return "string" === e3 || "function" === e3;
};
var T = (t3) => t3.modelName || t3.name;
var B = (t3) => "string" === typeof t3 ? t3 : T(t3);
function q3(t3) {
  if (C(t3, R2)) return t3[R2];
  return T(t3.constructor);
}
function z3(t3, e3, i4) {
  let s3 = O4(e3);
  let n3 = 0;
  while (n3 < s3.length) {
    const e4 = s3[n3++];
    if (C(t3, e4)) s3 = i4(s3, t3[e4]);
  }
  return s3;
}
function D(t3, e3) {
  if ("string" === typeof e3 && -1 !== t3.indexOf(e3)) return e3;
  for (let i4 = 0; i4 < e3.length; i4++) if (-1 !== t3.indexOf(e3[i4])) return e3[i4];
  return null;
}
var Y = (t3, e3) => t3.concat(e3);
function k(t3, e3) {
  if (e3 in t3) throw new Error(`Cannot use "${e3}" as an alias because it's reserved action.`);
  const i4 = Object.keys(t3);
  const s3 = (t4, i5) => {
    const s4 = D(t4, i5);
    if (s4) throw new Error(`Detected cycle ${s4} -> ${t4.join(", ")}`);
    const n3 = "string" === typeof i5 && i5 === e3 || -1 !== t4.indexOf(e3) || Array.isArray(i5) && -1 !== i5.indexOf(e3);
    if (n3) throw new Error(`Cannot make an alias to "${e3}" because this is reserved action`);
    return t4.concat(i5);
  };
  for (let e4 = 0; e4 < i4.length; e4++) z3(t3, i4[e4], s3);
}
function I(t3, e3) {
  if (!e3 || false !== e3.skipValidate) k(t3, e3 && e3.anyAction || "manage");
  return (e4) => z3(t3, e4, Y);
}
function L(t3, e3, i4) {
  for (let s3 = i4; s3 < e3.length; s3++) t3.push(e3[s3]);
}
function U2(t3, e3) {
  if (!t3 || !t3.length) return e3 || [];
  if (!e3 || !e3.length) return t3 || [];
  let i4 = 0;
  let s3 = 0;
  const n3 = [];
  while (i4 < t3.length && s3 < e3.length) if (t3[i4].priority < e3[s3].priority) {
    n3.push(t3[i4]);
    i4++;
  } else {
    n3.push(e3[s3]);
    s3++;
  }
  L(n3, t3, i4);
  L(n3, e3, s3);
  return n3;
}
function G(t3, e3, i4) {
  let s3 = t3.get(e3);
  if (!s3) {
    s3 = i4();
    t3.set(e3, s3);
  }
  return s3;
}
var H = (t3) => t3;
function J(t3, e3) {
  if (Array.isArray(t3.fields) && !t3.fields.length) throw new Error("`rawRule.fields` cannot be an empty array. https://bit.ly/390miLa");
  if (t3.fields && !e3.fieldMatcher) throw new Error('You need to pass "fieldMatcher" option in order to restrict access by fields');
  if (t3.conditions && !e3.conditionsMatcher) throw new Error('You need to pass "conditionsMatcher" option in order to restrict access by conditions');
}
var K = class {
  constructor(t3, e3, i4 = 0) {
    J(t3, e3);
    this.action = e3.resolveAction(t3.action);
    this.subject = t3.subject;
    this.inverted = !!t3.inverted;
    this.conditions = t3.conditions;
    this.reason = t3.reason;
    this.origin = t3;
    this.fields = t3.fields ? O4(t3.fields) : void 0;
    this.priority = i4;
    this.t = e3;
  }
  i() {
    if (this.conditions && !this.o) this.o = this.t.conditionsMatcher(this.conditions);
    return this.o;
  }
  get ast() {
    const t3 = this.i();
    return t3 ? t3.ast : void 0;
  }
  matchesConditions(t3) {
    if (!this.conditions) return true;
    if (!t3 || S2(t3)) return !this.inverted;
    const e3 = this.i();
    return e3(t3);
  }
  matchesField(t3) {
    if (!this.fields) return true;
    if (!t3) return !this.inverted;
    if (this.fields && !this.u) this.u = this.t.fieldMatcher(this.fields);
    return this.u(t3);
  }
};
function N3(t3, e3) {
  const i4 = { value: t3, prev: e3, next: null };
  if (e3) e3.next = i4;
  return i4;
}
function Q(t3) {
  if (t3.next) t3.next.prev = t3.prev;
  if (t3.prev) t3.prev.next = t3.next;
  t3.next = t3.prev = null;
}
var V = (t3) => ({ value: t3.value, prev: t3.prev, next: t3.next });
var W = () => ({ rules: [], merged: false });
var X = () => /* @__PURE__ */ new Map();
var Z = class {
  constructor(t3 = [], e3 = {}) {
    this.h = false;
    this.l = { conditionsMatcher: e3.conditionsMatcher, fieldMatcher: e3.fieldMatcher, resolveAction: e3.resolveAction || H };
    this.p = e3.anyAction || "manage";
    this.g = e3.anySubjectType || "all";
    this.$ = e3.detectSubjectType || q3;
    this.A = t3;
    this.j = this.M(t3);
  }
  get rules() {
    return this.A;
  }
  detectSubjectType(t3) {
    if (S2(t3)) return t3;
    if (!t3) return this.g;
    return this.$(t3);
  }
  update(t3) {
    const e3 = { rules: t3, ability: this, target: this };
    this.m("update", e3);
    this.A = t3;
    this.j = this.M(t3);
    this.m("updated", e3);
    return this;
  }
  M(t3) {
    const e3 = /* @__PURE__ */ new Map();
    for (let i4 = t3.length - 1; i4 >= 0; i4--) {
      const s3 = t3.length - i4 - 1;
      const n3 = new K(t3[i4], this.l, s3);
      const r2 = O4(n3.action);
      const o3 = O4(n3.subject || this.g);
      if (!this.h && n3.fields) this.h = true;
      for (let t4 = 0; t4 < o3.length; t4++) {
        const i5 = G(e3, o3[t4], X);
        for (let t5 = 0; t5 < r2.length; t5++) G(i5, r2[t5], W).rules.push(n3);
      }
    }
    return e3;
  }
  possibleRulesFor(t3, e3 = this.g) {
    if (!S2(e3)) throw new Error('"possibleRulesFor" accepts only subject types (i.e., string or class) as the 2nd parameter');
    const i4 = G(this.j, e3, X);
    const s3 = G(i4, t3, W);
    if (s3.merged) return s3.rules;
    const n3 = t3 !== this.p && i4.has(this.p) ? i4.get(this.p).rules : void 0;
    let r2 = U2(s3.rules, n3);
    if (e3 !== this.g) r2 = U2(r2, this.possibleRulesFor(t3, this.g));
    s3.rules = r2;
    s3.merged = true;
    return r2;
  }
  rulesFor(t3, e3, i4) {
    const s3 = this.possibleRulesFor(t3, e3);
    if (i4 && "string" !== typeof i4) throw new Error("The 3rd, `field` parameter is expected to be a string. See https://stalniy.github.io/casl/en/api/casl-ability#can-of-pure-ability for details");
    if (!this.h) return s3;
    return s3.filter((t4) => t4.matchesField(i4));
  }
  actionsFor(t3) {
    if (!S2(t3)) throw new Error('"actionsFor" accepts only subject types (i.e., string or class) as a parameter');
    const e3 = /* @__PURE__ */ new Set();
    const i4 = this.j.get(t3);
    if (i4) Array.from(i4.keys()).forEach((t4) => e3.add(t4));
    const s3 = t3 !== this.g ? this.j.get(this.g) : void 0;
    if (s3) Array.from(s3.keys()).forEach((t4) => e3.add(t4));
    return Array.from(e3);
  }
  on(t3, e3) {
    this.v = this.v || /* @__PURE__ */ new Map();
    const i4 = this.v;
    const s3 = i4.get(t3) || null;
    const n3 = N3(e3, s3);
    i4.set(t3, n3);
    return () => {
      const e4 = i4.get(t3);
      if (!n3.next && !n3.prev && e4 === n3) i4.delete(t3);
      else if (n3 === e4) i4.set(t3, n3.prev);
      Q(n3);
    };
  }
  m(t3, e3) {
    if (!this.v) return;
    let i4 = this.v.get(t3) || null;
    while (null !== i4) {
      const t4 = i4.prev ? V(i4.prev) : null;
      i4.value(e3);
      i4 = t4;
    }
  }
};
var PureAbility = class extends Z {
  can(t3, e3, i4) {
    const s3 = this.relevantRuleFor(t3, e3, i4);
    return !!s3 && !s3.inverted;
  }
  relevantRuleFor(t3, e3, i4) {
    const s3 = this.detectSubjectType(e3);
    const n3 = this.rulesFor(t3, s3, i4);
    for (let t4 = 0, i5 = n3.length; t4 < i5; t4++) if (n3[t4].matchesConditions(e3)) return n3[t4];
    return null;
  }
  cannot(t3, e3, i4) {
    return !this.can(t3, e3, i4);
  }
};
var tt = { $eq: O2, $ne: R, $lt: E, $lte: j2, $gt: b, $gte: g, $in: y2, $nin: x2, $all: v2, $size: w2, $regex: _2, $options: q, $elemMatch: $, $exists: m2 };
var et = { eq: b2, ne: A2, lt: h3, lte: d3, gt: j3, gte: w3, in: N2, nin: $2, all: q2, size: x3, regex: O3, elemMatch: z2, exists: _3, and: m3 };
var it = (e3, i4, s3) => p4(Object.assign({}, tt, e3), Object.assign({}, et, i4), s3);
var st = p4(tt, et);
var nt = /[-/\\^$+?.()|[\]{}]/g;
var rt = /\.?\*+\.?/g;
var ot = /\*+/;
var ct = /\./g;
function ut(t3, e3, i4) {
  const s3 = "*" === i4[0] || "." === t3[0] && "." === t3[t3.length - 1] ? "+" : "*";
  const n3 = -1 === t3.indexOf("**") ? "[^.]" : ".";
  const r2 = t3.replace(ct, "\\$&").replace(ot, n3 + s3);
  return e3 + t3.length === i4.length ? `(?:${r2})?` : r2;
}
function ht(t3, e3, i4) {
  if ("." === t3 && ("*" === i4[e3 - 1] || "*" === i4[e3 + 1])) return t3;
  return `\\${t3}`;
}
function lt(t3) {
  const e3 = t3.map((t4) => t4.replace(nt, ht).replace(rt, ut));
  const i4 = e3.length > 1 ? `(?:${e3.join("|")})` : e3[0];
  return new RegExp(`^${i4}$`);
}
var at = (t3) => {
  let e3;
  return (i4) => {
    if ("undefined" === typeof e3) e3 = t3.every((t4) => -1 === t4.indexOf("*")) ? null : lt(t3);
    return null === e3 ? -1 !== t3.indexOf(i4) : e3.test(i4);
  };
};
var Ability = class extends PureAbility {
  constructor(t3 = [], e3 = {}) {
    super(t3, Object.assign({ conditionsMatcher: st, fieldMatcher: at }, e3));
  }
};
function createMongoAbility(t3 = [], e3 = {}) {
  return new PureAbility(t3, Object.assign({ conditionsMatcher: st, fieldMatcher: at }, e3));
}
function isAbilityClass(t3) {
  return "function" === typeof t3.prototype.possibleRulesFor;
}
var ft = class {
  constructor(t3) {
    this.F = t3;
  }
  because(t3) {
    this.F.reason = t3;
    return this;
  }
};
var AbilityBuilder = class {
  constructor(t3) {
    this.rules = [];
    this._ = t3;
    this.can = (t4, e3, i4, s3) => this.O(t4, e3, i4, s3, false);
    this.cannot = (t4, e3, i4, s3) => this.O(t4, e3, i4, s3, true);
    this.build = (t4) => isAbilityClass(this._) ? new this._(this.rules, t4) : this._(this.rules, t4);
  }
  O(t3, e3, i4, s3, n3) {
    const r2 = { action: t3 };
    if (n3) r2.inverted = n3;
    if (e3) {
      r2.subject = e3;
      if (Array.isArray(i4) || "string" === typeof i4) r2.fields = i4;
      else if ("undefined" !== typeof i4) r2.conditions = i4;
      if ("undefined" !== typeof s3) r2.conditions = s3;
    }
    this.rules.push(r2);
    return new ft(r2);
  }
};
function defineAbility(t3, e3) {
  const i4 = new AbilityBuilder(createMongoAbility);
  const s3 = t3(i4.can, i4.cannot);
  if (s3 && "function" === typeof s3.then) return s3.then(() => i4.build(e3));
  return i4.build(e3);
}
var dt = (t3) => `Cannot execute "${t3.action}" on "${t3.subjectType}"`;
var yt = function t2(e3) {
  this.message = e3;
};
yt.prototype = Object.create(Error.prototype);
var ForbiddenError = class extends yt {
  static setDefaultMessage(t3) {
    this.C = "string" === typeof t3 ? () => t3 : t3;
  }
  static from(t3) {
    return new this(t3);
  }
  constructor(t3) {
    super("");
    this.ability = t3;
    if ("function" === typeof Error.captureStackTrace) {
      this.name = "ForbiddenError";
      Error.captureStackTrace(this, this.constructor);
    }
  }
  setMessage(t3) {
    this.message = t3;
    return this;
  }
  throwUnlessCan(t3, e3, i4) {
    const s3 = this.unlessCan(t3, e3, i4);
    if (s3) throw s3;
  }
  unlessCan(t3, e3, i4) {
    const s3 = this.ability.relevantRuleFor(t3, e3, i4);
    if (s3 && !s3.inverted) return;
    this.action = t3;
    this.subject = e3;
    this.subjectType = B(this.ability.detectSubjectType(e3));
    this.field = i4;
    const n3 = s3 ? s3.reason : "";
    this.message = this.message || n3 || this.constructor.C(this);
    return this;
  }
};
ForbiddenError.C = dt;
var bt = Object.freeze({ __proto__: null });
export {
  Ability,
  AbilityBuilder,
  ForbiddenError,
  PureAbility,
  it as buildMongoQueryMatcher,
  I as createAliasResolver,
  createMongoAbility,
  defineAbility,
  q3 as detectSubjectType,
  at as fieldPatternMatcher,
  dt as getDefaultErrorMessage,
  bt as hkt,
  st as mongoQueryMatcher,
  P2 as subject,
  O4 as wrapArray
};
//# sourceMappingURL=@casl_ability.js.map
