import{r as u}from"./react.4d141f3d.js";import{c as x,a as b}from"./history.9f02e18f.js";import{u as w,a as N,b as k,c as C,R as O}from"./react-router.203ef28e.js";/**
 * React Router DOM v6.3.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function d(){return d=Object.assign||function(e){for(var a=1;a<arguments.length;a++){var r=arguments[a];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e},d.apply(this,arguments)}function L(e,a){if(e==null)return{};var r={},n=Object.keys(e),o,t;for(t=0;t<n.length;t++)o=n[t],!(a.indexOf(o)>=0)&&(r[o]=e[o]);return r}const j=["onClick","reloadDocument","replace","state","target","to"],E=["aria-current","caseSensitive","className","end","style","to","children"];function A(e){let{basename:a,children:r,window:n}=e,o=u.exports.useRef();o.current==null&&(o.current=b({window:n}));let t=o.current,[l,i]=u.exports.useState({action:t.action,location:t.location});return u.exports.useLayoutEffect(()=>t.listen(i),[t]),u.exports.createElement(O,{basename:a,children:r,location:l.location,navigationType:l.action,navigator:t})}function K(e){return!!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)}const B=u.exports.forwardRef(function(a,r){let{onClick:n,reloadDocument:o,replace:t=!1,state:l,target:i,to:s}=a,f=L(a,j),m=w(s),y=S(s,{replace:t,state:l,target:i});function g(c){n&&n(c),!c.defaultPrevented&&!o&&y(c)}return u.exports.createElement("a",d({},f,{href:m,onClick:g,ref:r,target:i}))}),_=u.exports.forwardRef(function(a,r){let{"aria-current":n="page",caseSensitive:o=!1,className:t="",end:l=!1,style:i,to:s,children:f}=a,m=L(a,E),y=k(),g=C(s),c=y.pathname,p=g.pathname;o||(c=c.toLowerCase(),p=p.toLowerCase());let h=c===p||!l&&c.startsWith(p)&&c.charAt(p.length)==="/",P=h?n:void 0,v;typeof t=="function"?v=t({isActive:h}):v=[t,h?"active":null].filter(Boolean).join(" ");let R=typeof i=="function"?i({isActive:h}):i;return u.exports.createElement(B,d({},m,{"aria-current":P,className:v,ref:r,style:R,to:s}),typeof f=="function"?f({isActive:h}):f)});function S(e,a){let{target:r,replace:n,state:o}=a===void 0?{}:a,t=N(),l=k(),i=C(e);return u.exports.useCallback(s=>{if(s.button===0&&(!r||r==="_self")&&!K(s)){s.preventDefault();let f=!!n||x(l)===x(i);t(e,{replace:f,state:o})}},[l,t,i,n,o,r,e])}export{A as B,B as L,_ as N};
