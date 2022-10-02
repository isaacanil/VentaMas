import{p as x,A as w}from"./history.9f02e18f.js";import{r as o}from"./react.4d141f3d.js";/**
 * React Router v6.3.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */const C=o.exports.createContext(null),S=o.exports.createContext(null),v=o.exports.createContext({outlet:null,matches:[]});function f(e,t){if(!e)throw new Error(t)}function I(e,t,n){n===void 0&&(n="/");let a=typeof t=="string"?x(t):t,r=N(a.pathname||"/",n);if(r==null)return null;let l=E(e);M(l);let i=null;for(let s=0;i==null&&s<l.length;++s)i=U(l[s],r);return i}function E(e,t,n,a){return t===void 0&&(t=[]),n===void 0&&(n=[]),a===void 0&&(a=""),e.forEach((r,l)=>{let i={relativePath:r.path||"",caseSensitive:r.caseSensitive===!0,childrenIndex:l,route:r};i.relativePath.startsWith("/")&&(i.relativePath.startsWith(a)||f(!1),i.relativePath=i.relativePath.slice(a.length));let s=d([a,i.relativePath]),u=n.concat(i);r.children&&r.children.length>0&&(r.index===!0&&f(!1),E(r.children,t,u,s)),!(r.path==null&&!r.index)&&t.push({path:s,score:H(s,r.index),routesMeta:u})}),t}function M(e){e.sort((t,n)=>t.score!==n.score?n.score-t.score:T(t.routesMeta.map(a=>a.childrenIndex),n.routesMeta.map(a=>a.childrenIndex)))}const J=/^:\w+$/,V=3,F=2,L=1,k=10,z=-2,$=e=>e==="*";function H(e,t){let n=e.split("/"),a=n.length;return n.some($)&&(a+=z),t&&(a+=F),n.filter(r=>!$(r)).reduce((r,l)=>r+(J.test(l)?V:l===""?L:k),a)}function T(e,t){return e.length===t.length&&e.slice(0,-1).every((a,r)=>a===t[r])?e[e.length-1]-t[t.length-1]:0}function U(e,t){let{routesMeta:n}=e,a={},r="/",l=[];for(let i=0;i<n.length;++i){let s=n[i],u=i===n.length-1,c=r==="/"?t:t.slice(r.length)||"/",h=_({path:s.relativePath,caseSensitive:s.caseSensitive,end:u},c);if(!h)return null;Object.assign(a,h.params);let m=s.route;l.push({params:a,pathname:d([r,h.pathname]),pathnameBase:j(d([r,h.pathnameBase])),route:m}),h.pathnameBase!=="/"&&(r=d([r,h.pathnameBase]))}return l}function _(e,t){typeof e=="string"&&(e={path:e,caseSensitive:!1,end:!0});let[n,a]=b(e.path,e.caseSensitive,e.end),r=t.match(n);if(!r)return null;let l=r[0],i=l.replace(/(.)\/+$/,"$1"),s=r.slice(1);return{params:a.reduce((c,h,m)=>{if(h==="*"){let p=s[m]||"";i=l.slice(0,l.length-p.length).replace(/(.)\/+$/,"$1")}return c[h]=D(s[m]||""),c},{}),pathname:l,pathnameBase:i,pattern:e}}function b(e,t,n){t===void 0&&(t=!1),n===void 0&&(n=!0);let a=[],r="^"+e.replace(/\/*\*?$/,"").replace(/^\/*/,"/").replace(/[\\.*+^$?{}|()[\]]/g,"\\$&").replace(/:(\w+)/g,(i,s)=>(a.push(s),"([^\\/]+)"));return e.endsWith("*")?(a.push("*"),r+=e==="*"||e==="/*"?"(.*)$":"(?:\\/(.+)|\\/*)$"):r+=n?"\\/*$":"(?:(?=[.~-]|%[0-9A-F]{2})|\\b|\\/|$)",[new RegExp(r,t?void 0:"i"),a]}function D(e,t){try{return decodeURIComponent(e)}catch{return e}}function G(e,t){t===void 0&&(t="/");let{pathname:n,search:a="",hash:r=""}=typeof e=="string"?x(e):e;return{pathname:n?n.startsWith("/")?n:q(n,t):t,search:Q(a),hash:X(r)}}function q(e,t){let n=t.replace(/\/+$/,"").split("/");return e.split("/").forEach(r=>{r===".."?n.length>1&&n.pop():r!=="."&&n.push(r)}),n.length>1?n.join("/"):"/"}function O(e,t,n){let a=typeof e=="string"?x(e):e,r=e===""||a.pathname===""?"/":a.pathname,l;if(r==null)l=n;else{let s=t.length-1;if(r.startsWith("..")){let u=r.split("/");for(;u[0]==="..";)u.shift(),s-=1;a.pathname=u.join("/")}l=s>=0?t[s]:"/"}let i=G(a,l);return r&&r!=="/"&&r.endsWith("/")&&!i.pathname.endsWith("/")&&(i.pathname+="/"),i}function K(e){return e===""||e.pathname===""?"/":typeof e=="string"?x(e).pathname:e.pathname}function N(e,t){if(t==="/")return e;if(!e.toLowerCase().startsWith(t.toLowerCase()))return null;let n=e.charAt(t.length);return n&&n!=="/"?null:e.slice(t.length)||"/"}const d=e=>e.join("/").replace(/\/\/+/g,"/"),j=e=>e.replace(/\/+$/,"").replace(/^\/*/,"/"),Q=e=>!e||e==="?"?"":e.startsWith("?")?e:"?"+e,X=e=>!e||e==="#"?"":e.startsWith("#")?e:"#"+e;function se(e){g()||f(!1);let{basename:t,navigator:n}=o.exports.useContext(C),{hash:a,pathname:r,search:l}=ee(e),i=r;if(t!=="/"){let s=K(e),u=s!=null&&s.endsWith("/");i=r==="/"?t+(u?"/":""):d([t,r])}return n.createHref({pathname:i,search:l,hash:a})}function g(){return o.exports.useContext(S)!=null}function y(){return g()||f(!1),o.exports.useContext(S).location}function Y(){g()||f(!1);let{basename:e,navigator:t}=o.exports.useContext(C),{matches:n}=o.exports.useContext(v),{pathname:a}=y(),r=JSON.stringify(n.map(s=>s.pathnameBase)),l=o.exports.useRef(!1);return o.exports.useEffect(()=>{l.current=!0}),o.exports.useCallback(function(s,u){if(u===void 0&&(u={}),!l.current)return;if(typeof s=="number"){t.go(s);return}let c=O(s,JSON.parse(r),a);e!=="/"&&(c.pathname=d([e,c.pathname])),(u.replace?t.replace:t.push)(c,u.state)},[e,t,r,a])}const Z=o.exports.createContext(null);function A(e){let t=o.exports.useContext(v).outlet;return t&&o.exports.createElement(Z.Provider,{value:e},t)}function ie(){let{matches:e}=o.exports.useContext(v),t=e[e.length-1];return t?t.params:{}}function ee(e){let{matches:t}=o.exports.useContext(v),{pathname:n}=y(),a=JSON.stringify(t.map(r=>r.pathnameBase));return o.exports.useMemo(()=>O(e,JSON.parse(a),n),[e,a,n])}function te(e,t){g()||f(!1);let{matches:n}=o.exports.useContext(v),a=n[n.length-1],r=a?a.params:{};a&&a.pathname;let l=a?a.pathnameBase:"/";a&&a.route;let i=y(),s;if(t){var u;let p=typeof t=="string"?x(t):t;l==="/"||((u=p.pathname)==null?void 0:u.startsWith(l))||f(!1),s=p}else s=i;let c=s.pathname||"/",h=l==="/"?c:c.slice(l.length)||"/",m=I(e,{pathname:h});return ne(m&&m.map(p=>Object.assign({},p,{params:Object.assign({},r,p.params),pathname:d([l,p.pathname]),pathnameBase:p.pathnameBase==="/"?l:d([l,p.pathnameBase])})),n)}function ne(e,t){return t===void 0&&(t=[]),e==null?null:e.reduceRight((n,a,r)=>o.exports.createElement(v.Provider,{children:a.route.element!==void 0?a.route.element:n,value:{outlet:n,matches:t.concat(e.slice(0,r+1))}}),null)}function oe(e){let{to:t,replace:n,state:a}=e;g()||f(!1);let r=Y();return o.exports.useEffect(()=>{r(t,{replace:n,state:a})}),null}function ue(e){return A(e.context)}function ae(e){f(!1)}function ce(e){let{basename:t="/",children:n=null,location:a,navigationType:r=w.Pop,navigator:l,static:i=!1}=e;g()&&f(!1);let s=j(t),u=o.exports.useMemo(()=>({basename:s,navigator:l,static:i}),[s,l,i]);typeof a=="string"&&(a=x(a));let{pathname:c="/",search:h="",hash:m="",state:p=null,key:R="default"}=a,B=o.exports.useMemo(()=>{let W=N(c,s);return W==null?null:{pathname:W,search:h,hash:m,state:p,key:R}},[s,c,h,m,p,R]);return B==null?null:o.exports.createElement(C.Provider,{value:u},o.exports.createElement(S.Provider,{children:n,value:{location:B,navigationType:r}}))}function he(e){let{children:t,location:n}=e;return te(P(t),n)}function P(e){let t=[];return o.exports.Children.forEach(e,n=>{if(!o.exports.isValidElement(n))return;if(n.type===o.exports.Fragment){t.push.apply(t,P(n.props.children));return}n.type!==ae&&f(!1);let a={caseSensitive:n.props.caseSensitive,element:n.props.element,index:n.props.index,path:n.props.path};n.props.children&&(a.children=P(n.props.children)),t.push(a)}),t}export{oe as N,ue as O,ce as R,Y as a,y as b,ee as c,ie as d,he as e,ae as f,se as u};
