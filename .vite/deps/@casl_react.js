import {
  require_react
} from "./chunk-YW5IJWHK.js";
import {
  __toESM
} from "./chunk-OL46QLBJ.js";

// node_modules/@casl/react/dist/es6m/index.mjs
var import_react = __toESM(require_react(), 1);
var s = () => {
};
var e = class extends import_react.PureComponent {
  constructor(...t2) {
    super(...t2);
    this.t = false;
    this.i = null;
    this.o = s;
  }
  componentWillUnmount() {
    this.o();
  }
  u(t2) {
    if (t2 === this.i) return;
    this.o();
    this.i = null;
    if (t2) {
      this.i = t2;
      this.o = t2.on("updated", () => this.forceUpdate());
    }
  }
  get allowed() {
    return this.t;
  }
  h() {
    const t2 = this.props;
    const i2 = t2.of || t2.a || t2.an || t2.this || t2.on;
    const n2 = t2.not ? "cannot" : "can";
    return t2.ability[n2](t2.I || t2.do, i2, t2.field);
  }
  render() {
    this.u(this.props.ability);
    this.t = this.h();
    return this.props.passThrough || this.t ? this.l() : null;
  }
  l() {
    const { children: t2, ability: i2 } = this.props;
    const n2 = "function" === typeof t2 ? t2(this.t, i2) : t2;
    return n2;
  }
};
function r(t2) {
  var i2, n2;
  return n2 = i2 = class extends e {
  }, i2.defaultProps = { ability: t2 }, n2;
}
function o(t2) {
  return (i2) => (0, import_react.createElement)(t2, { children: (t3) => (0, import_react.createElement)(e, Object.assign({ ability: t3 }, i2)) });
}
function useAbility(i2) {
  if ("function" !== typeof import_react.default.useContext) throw new Error("You must use React >= 16.8 in order to use useAbility()");
  const n2 = import_react.default.useContext(i2);
  const [s2, e2] = import_react.default.useState();
  import_react.default.useEffect(() => n2.on("updated", (t2) => {
    if (t2.rules !== s2) e2(t2.rules);
  }), []);
  return n2;
}
export {
  e as Can,
  r as createCanBoundTo,
  o as createContextualCan,
  useAbility
};
//# sourceMappingURL=@casl_react.js.map
