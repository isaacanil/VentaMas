var G=function(){function A(a,t){var v=[],o=!0,n=!1,r=void 0;try{for(var e=a[Symbol.iterator](),i;!(o=(i=e.next()).done)&&(v.push(i.value),!(t&&v.length===t));o=!0);}catch(c){n=!0,r=c}finally{try{!o&&e.return&&e.return()}finally{if(n)throw r}}return v}return function(a,t){if(Array.isArray(a))return a;if(Symbol.iterator in Object(a))return A(a,t);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),E=Math.PI*2,R=function(a,t,v,o,n,r,e){var i=a.x,c=a.y;i*=t,c*=v;var f=o*i-n*c,y=n*i+o*c;return{x:f+r,y:y+e}},H=function(a,t){var v=t===1.5707963267948966?.551915024494:t===-1.5707963267948966?-.551915024494:1.3333333333333333*Math.tan(t/4),o=Math.cos(a),n=Math.sin(a),r=Math.cos(a+t),e=Math.sin(a+t);return[{x:o-n*v,y:n+o*v},{x:r+e*v,y:e-r*v},{x:r,y:e}]},S=function(a,t,v,o){var n=a*o-t*v<0?-1:1,r=a*v+t*o;return r>1&&(r=1),r<-1&&(r=-1),n*Math.acos(r)},J=function(a,t,v,o,n,r,e,i,c,f,y,M){var T=Math.pow(n,2),d=Math.pow(r,2),l=Math.pow(y,2),x=Math.pow(M,2),s=T*d-T*x-d*l;s<0&&(s=0),s/=T*x+d*l,s=Math.sqrt(s)*(e===i?-1:1);var u=s*n/r*M,p=s*-r/n*y,F=f*u-c*p+(a+v)/2,g=c*u+f*p+(t+o)/2,m=(y-u)/n,w=(M-p)/r,C=(-y-u)/n,b=(-M-p)/r,q=S(1,0,m,w),h=S(m,w,C,b);return i===0&&h>0&&(h-=E),i===1&&h<0&&(h+=E),[F,g,q,h]},K=function(a){var t=a.px,v=a.py,o=a.cx,n=a.cy,r=a.rx,e=a.ry,i=a.xAxisRotation,c=i===void 0?0:i,f=a.largeArcFlag,y=f===void 0?0:f,M=a.sweepFlag,T=M===void 0?0:M,d=[];if(r===0||e===0)return[];var l=Math.sin(c*E/360),x=Math.cos(c*E/360),s=x*(t-o)/2+l*(v-n)/2,u=-l*(t-o)/2+x*(v-n)/2;if(s===0&&u===0)return[];r=Math.abs(r),e=Math.abs(e);var p=Math.pow(s,2)/Math.pow(r,2)+Math.pow(u,2)/Math.pow(e,2);p>1&&(r*=Math.sqrt(p),e*=Math.sqrt(p));var F=J(t,v,o,n,r,e,y,T,l,x,s,u),g=G(F,4),m=g[0],w=g[1],C=g[2],b=g[3],q=Math.abs(b)/(E/4);Math.abs(1-q)<1e-7&&(q=1);var h=Math.max(Math.ceil(q),1);b/=h;for(var U=0;U<h;U++)d.push(H(C,b)),C+=b;return d.map(function(I){var $=R(I[0],r,e,x,l,m,w),j=$.x,k=$.y,z=R(I[1],r,e,x,l,m,w),O=z.x,P=z.y,B=R(I[2],r,e,x,l,m,w),_=B.x,D=B.y;return{x1:j,y1:k,x2:O,y2:P,x:_,y:D}})};export{K as a};