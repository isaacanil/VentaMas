import{c as b}from"./hsl-to-rgb-for-reals.b6ddffb0.js";var g=b;function c(r,e){return r>e?e:r}function t(r,e){return r<e?e:r}function h(r){for(r=c(r,1e7),r=t(r,-1e7);r<0;)r+=360;for(;r>359;)r-=360;return r}function p(r,e,n){r=h(r),e=t(c(e,100),0),n=t(c(n,100),0),e/=100,n/=100;var o=g(r,e,n);return"#"+o.map(function(f){return(256+f).toString(16).substr(-2)}).join("")}var x=p;export{x as h};