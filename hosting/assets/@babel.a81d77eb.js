var rt=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function nt(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}function ot(t){var i=t.default;if(typeof i=="function"){var n=function(){return i.apply(this,arguments)};n.prototype=i.prototype}else n={};return Object.defineProperty(n,"__esModule",{value:!0}),Object.keys(t).forEach(function(o){var h=Object.getOwnPropertyDescriptor(t,o);Object.defineProperty(n,o,h.get?h:{enumerable:!0,get:function(){return t[o]}})}),n}function q(){return q=Object.assign?Object.assign.bind():function(t){for(var i=1;i<arguments.length;i++){var n=arguments[i];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(t[o]=n[o])}return t},q.apply(this,arguments)}function it(t,i){if(t==null)return{};var n={},o=Object.keys(t),h,l;for(l=0;l<o.length;l++)h=o[l],!(i.indexOf(h)>=0)&&(n[h]=t[h]);return n}function tt(t,i,n){return i in t?Object.defineProperty(t,i,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[i]=n,t}function B(t,i){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);i&&(o=o.filter(function(h){return Object.getOwnPropertyDescriptor(t,h).enumerable})),n.push.apply(n,o)}return n}function at(t){for(var i=1;i<arguments.length;i++){var n=arguments[i]!=null?arguments[i]:{};i%2?B(Object(n),!0).forEach(function(o){tt(t,o,n[o])}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):B(Object(n)).forEach(function(o){Object.defineProperty(t,o,Object.getOwnPropertyDescriptor(n,o))})}return t}function J(t,i,n,o,h,l,O){try{var b=t[l](O),_=b.value}catch(P){n(P);return}b.done?i(_):Promise.resolve(_).then(o,h)}function ut(t){return function(){var i=this,n=arguments;return new Promise(function(o,h){var l=t.apply(i,n);function O(_){J(l,o,h,O,b,"next",_)}function b(_){J(l,o,h,O,b,"throw",_)}O(void 0)})}}var X={exports:{}},Z={exports:{}};(function(t){function i(n){return t.exports=i=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(o){return typeof o}:function(o){return o&&typeof Symbol=="function"&&o.constructor===Symbol&&o!==Symbol.prototype?"symbol":typeof o},t.exports.__esModule=!0,t.exports.default=t.exports,i(n)}t.exports=i,t.exports.__esModule=!0,t.exports.default=t.exports})(Z);(function(t){var i=Z.exports.default;function n(){/*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */t.exports=n=function(){return o},t.exports.__esModule=!0,t.exports.default=t.exports;var o={},h=Object.prototype,l=h.hasOwnProperty,O=typeof Symbol=="function"?Symbol:{},b=O.iterator||"@@iterator",_=O.asyncIterator||"@@asyncIterator",P=O.toStringTag||"@@toStringTag";function d(r,e,a){return Object.defineProperty(r,e,{value:a,enumerable:!0,configurable:!0,writable:!0}),r[e]}try{d({},"")}catch{d=function(a,u,f){return a[u]=f}}function K(r,e,a,u){var f=e&&e.prototype instanceof I?e:I,c=Object.create(f.prototype),p=new D(u||[]);return c._invoke=function(g,m,s){var y="suspendedStart";return function(w,H){if(y==="executing")throw new Error("Generator is already running");if(y==="completed"){if(w==="throw")throw H;return F()}for(s.method=w,s.arg=H;;){var U=s.delegate;if(U){var $=z(U,s);if($){if($===v)continue;return $}}if(s.method==="next")s.sent=s._sent=s.arg;else if(s.method==="throw"){if(y==="suspendedStart")throw y="completed",s.arg;s.dispatchException(s.arg)}else s.method==="return"&&s.abrupt("return",s.arg);y="executing";var S=A(g,m,s);if(S.type==="normal"){if(y=s.done?"completed":"suspendedYield",S.arg===v)continue;return{value:S.arg,done:s.done}}S.type==="throw"&&(y="completed",s.method="throw",s.arg=S.arg)}}}(r,a,p),c}function A(r,e,a){try{return{type:"normal",arg:r.call(e,a)}}catch(u){return{type:"throw",arg:u}}}o.wrap=K;var v={};function I(){}function E(){}function j(){}var N={};d(N,b,function(){return this});var k=Object.getPrototypeOf,T=k&&k(k(R([])));T&&T!==h&&l.call(T,b)&&(N=T);var L=j.prototype=I.prototype=Object.create(N);function W(r){["next","throw","return"].forEach(function(e){d(r,e,function(a){return this._invoke(e,a)})})}function G(r,e){function a(f,c,p,g){var m=A(r[f],r,c);if(m.type!=="throw"){var s=m.arg,y=s.value;return y&&i(y)=="object"&&l.call(y,"__await")?e.resolve(y.__await).then(function(w){a("next",w,p,g)},function(w){a("throw",w,p,g)}):e.resolve(y).then(function(w){s.value=w,p(s)},function(w){return a("throw",w,p,g)})}g(m.arg)}var u;this._invoke=function(f,c){function p(){return new e(function(g,m){a(f,c,g,m)})}return u=u?u.then(p,p):p()}}function z(r,e){var a=r.iterator[e.method];if(a===void 0){if(e.delegate=null,e.method==="throw"){if(r.iterator.return&&(e.method="return",e.arg=void 0,z(r,e),e.method==="throw"))return v;e.method="throw",e.arg=new TypeError("The iterator does not provide a 'throw' method")}return v}var u=A(a,r.iterator,e.arg);if(u.type==="throw")return e.method="throw",e.arg=u.arg,e.delegate=null,v;var f=u.arg;return f?f.done?(e[r.resultName]=f.value,e.next=r.nextLoc,e.method!=="return"&&(e.method="next",e.arg=void 0),e.delegate=null,v):f:(e.method="throw",e.arg=new TypeError("iterator result is not an object"),e.delegate=null,v)}function C(r){var e={tryLoc:r[0]};1 in r&&(e.catchLoc=r[1]),2 in r&&(e.finallyLoc=r[2],e.afterLoc=r[3]),this.tryEntries.push(e)}function M(r){var e=r.completion||{};e.type="normal",delete e.arg,r.completion=e}function D(r){this.tryEntries=[{tryLoc:"root"}],r.forEach(C,this),this.reset(!0)}function R(r){if(r){var e=r[b];if(e)return e.call(r);if(typeof r.next=="function")return r;if(!isNaN(r.length)){var a=-1,u=function f(){for(;++a<r.length;)if(l.call(r,a))return f.value=r[a],f.done=!1,f;return f.value=void 0,f.done=!0,f};return u.next=u}}return{next:F}}function F(){return{value:void 0,done:!0}}return E.prototype=j,d(L,"constructor",j),d(j,"constructor",E),E.displayName=d(j,P,"GeneratorFunction"),o.isGeneratorFunction=function(r){var e=typeof r=="function"&&r.constructor;return!!e&&(e===E||(e.displayName||e.name)==="GeneratorFunction")},o.mark=function(r){return Object.setPrototypeOf?Object.setPrototypeOf(r,j):(r.__proto__=j,d(r,P,"GeneratorFunction")),r.prototype=Object.create(L),r},o.awrap=function(r){return{__await:r}},W(G.prototype),d(G.prototype,_,function(){return this}),o.AsyncIterator=G,o.async=function(r,e,a,u,f){f===void 0&&(f=Promise);var c=new G(K(r,e,a,u),f);return o.isGeneratorFunction(e)?c:c.next().then(function(p){return p.done?p.value:c.next()})},W(L),d(L,P,"Generator"),d(L,b,function(){return this}),d(L,"toString",function(){return"[object Generator]"}),o.keys=function(r){var e=[];for(var a in r)e.push(a);return e.reverse(),function u(){for(;e.length;){var f=e.pop();if(f in r)return u.value=f,u.done=!1,u}return u.done=!0,u}},o.values=R,D.prototype={constructor:D,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=void 0,this.done=!1,this.delegate=null,this.method="next",this.arg=void 0,this.tryEntries.forEach(M),!e)for(var a in this)a.charAt(0)==="t"&&l.call(this,a)&&!isNaN(+a.slice(1))&&(this[a]=void 0)},stop:function(){this.done=!0;var e=this.tryEntries[0].completion;if(e.type==="throw")throw e.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var a=this;function u(s,y){return p.type="throw",p.arg=e,a.next=s,y&&(a.method="next",a.arg=void 0),!!y}for(var f=this.tryEntries.length-1;f>=0;--f){var c=this.tryEntries[f],p=c.completion;if(c.tryLoc==="root")return u("end");if(c.tryLoc<=this.prev){var g=l.call(c,"catchLoc"),m=l.call(c,"finallyLoc");if(g&&m){if(this.prev<c.catchLoc)return u(c.catchLoc,!0);if(this.prev<c.finallyLoc)return u(c.finallyLoc)}else if(g){if(this.prev<c.catchLoc)return u(c.catchLoc,!0)}else{if(!m)throw new Error("try statement without catch or finally");if(this.prev<c.finallyLoc)return u(c.finallyLoc)}}}},abrupt:function(e,a){for(var u=this.tryEntries.length-1;u>=0;--u){var f=this.tryEntries[u];if(f.tryLoc<=this.prev&&l.call(f,"finallyLoc")&&this.prev<f.finallyLoc){var c=f;break}}c&&(e==="break"||e==="continue")&&c.tryLoc<=a&&a<=c.finallyLoc&&(c=null);var p=c?c.completion:{};return p.type=e,p.arg=a,c?(this.method="next",this.next=c.finallyLoc,v):this.complete(p)},complete:function(e,a){if(e.type==="throw")throw e.arg;return e.type==="break"||e.type==="continue"?this.next=e.arg:e.type==="return"?(this.rval=this.arg=e.arg,this.method="return",this.next="end"):e.type==="normal"&&a&&(this.next=a),v},finish:function(e){for(var a=this.tryEntries.length-1;a>=0;--a){var u=this.tryEntries[a];if(u.finallyLoc===e)return this.complete(u.completion,u.afterLoc),M(u),v}},catch:function(e){for(var a=this.tryEntries.length-1;a>=0;--a){var u=this.tryEntries[a];if(u.tryLoc===e){var f=u.completion;if(f.type==="throw"){var c=f.arg;M(u)}return c}}throw new Error("illegal catch attempt")},delegateYield:function(e,a,u){return this.delegate={iterator:R(e),resultName:a,nextLoc:u},this.method==="next"&&(this.arg=void 0),v}},o}t.exports=n,t.exports.__esModule=!0,t.exports.default=t.exports})(X);var x=X.exports(),ft=x;try{regeneratorRuntime=x}catch{typeof globalThis=="object"?globalThis.regeneratorRuntime=x:Function("r","regeneratorRuntime = r")(x)}function Y(t,i){return Y=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(o,h){return o.__proto__=h,o},Y(t,i)}function ct(t,i){t.prototype=Object.create(i.prototype),t.prototype.constructor=t,Y(t,i)}function st(t){if(t===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function Q(t,i){(i==null||i>t.length)&&(i=t.length);for(var n=0,o=new Array(i);n<i;n++)o[n]=t[n];return o}function et(t,i){if(!!t){if(typeof t=="string")return Q(t,i);var n=Object.prototype.toString.call(t).slice(8,-1);if(n==="Object"&&t.constructor&&(n=t.constructor.name),n==="Map"||n==="Set")return Array.from(t);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return Q(t,i)}}function pt(t,i){var n=typeof Symbol<"u"&&t[Symbol.iterator]||t["@@iterator"];if(n)return(n=n.call(t)).next.bind(n);if(Array.isArray(t)||(n=et(t))||i&&t&&typeof t.length=="number"){n&&(t=n);var o=0;return function(){return o>=t.length?{done:!0}:{done:!1,value:t[o++]}}}throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function V(t,i){for(var n=0;n<i.length;n++){var o=i[n];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(t,o.key,o)}}function ht(t,i,n){return i&&V(t.prototype,i),n&&V(t,n),Object.defineProperty(t,"prototype",{writable:!1}),t}export{q as _,it as a,ut as b,ct as c,st as d,pt as e,ht as f,nt as g,rt as h,ot as i,at as j,ft as r};