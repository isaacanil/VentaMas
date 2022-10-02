import{r as s,R as dt}from"./react.4d141f3d.js";import{c as pt}from"./react-dom.98f10ff8.js";import{L as O,N as ut,B as mt}from"./react-router-dom.6a46eb73.js";import{u as _,a as C,P as ht}from"./react-redux.fafc7e25.js";import{c as ee,a as gt}from"./@reduxjs.6a86d9e0.js";import{s as i}from"./styled-components.1cfd7377.js";import{a as n,j as e,S as _t,D as xt,P as ft,V as w,T as S,F as ve,b as bt}from"./@react-pdf.4a0784f6.js";import"./firebase.093220a1.js";import{i as Ct,g as yt,U as vt,a as wt,D as G,b as W,I as de,x as q,E as Nt,K as St,Q as It,c as Pt,u as kt,d as Mt,T as $t,s as Ft,o as Ae,e as Bt,f as Dt}from"./@firebase.4ac88eca.js";import{n as Le}from"./nanoid.1d085756.js";import{v as pe}from"./uuid.a022571c.js";import{I as At}from"./react-icons.addf0438.js";import{a as te,O as Lt,d as Tt,N as Rt,e as Ot,f as N}from"./react-router.203ef28e.js";import"./hoist-non-react-statics.7be3bd10.js";import"./react-is.ba181aaf.js";import"./@babel.a81d77eb.js";import"./scheduler.84e42dea.js";import"./history.9f02e18f.js";import"./use-sync-external-store.0f084db0.js";import"./immer.a5abe755.js";import"./redux.43befd2b.js";import"./redux-thunk.58761488.js";import"./@emotion.c037f3dd.js";import"./queue.d7aa5a4f.js";import"./inherits.c04b427a.js";import"./events.38b94b46.js";import"./cross-fetch.d43c00d9.js";import"./fontkit.ebdb591b.js";import"./restructure.29031ca8.js";import"./@swc.c8d8a2a0.js";import"./fast-deep-equal.a94972be.js";import"./unicode-properties.ebf25ab5.js";import"./base64-js.53cdca41.js";import"./unicode-trie.6aaab134.js";import"./tiny-inflate.0bc1a1f5.js";import"./dfa.ffae7db2.js";import"./clone.b9228656.js";import"./brotli.c569dbf2.js";import"./tslib.005466e1.js";import"./base64-to-uint8array.34243671.js";import"./abs-svg-path.e24d81d5.js";import"./parse-svg-path.4a7f6aa5.js";import"./normalize-svg-path.a271dcf1.js";import"./svg-arc-to-cubic-bezier.347b7b27.js";import"./color-string.153f9d40.js";import"./color-name.e7a4e1d3.js";import"./simple-swizzle.165622a8.js";import"./is-arrayish.e606b633.js";import"./pako.99ccc9a1.js";import"./crypto-js.96210bc0.js";import"./postcss-value-parser.bbe8ad18.js";import"./hsl-to-hex.877ac213.js";import"./hsl-to-rgb-for-reals.b6ddffb0.js";import"./media-engine.4ea5eab9.js";import"./hyphen.77965a9a.js";import"./emoji-regex.433047b8.js";import"./object-assign.b2e1df11.js";import"./idb.94e4f64e.js";(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))c(a);new MutationObserver(a=>{for(const l of a)if(l.type==="childList")for(const p of l.addedNodes)p.tagName==="LINK"&&p.rel==="modulepreload"&&c(p)}).observe(document,{childList:!0,subtree:!0});function r(a){const l={};return a.integrity&&(l.integrity=a.integrity),a.referrerpolicy&&(l.referrerPolicy=a.referrerpolicy),a.crossorigin==="use-credentials"?l.credentials="include":a.crossorigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function c(a){if(a.ep)return;a.ep=!0;const l=r(a);fetch(a.href,l)}})();const Et={user:!1},Te=ee({name:"user",initialState:Et,reducers:{login:(t,o)=>{t.user=o.payload},logout:t=>{t.user=null}}}),{login:Re,logout:Oe}=Te.actions,ue=t=>t.user.user,Vt=Te.reducer;function B(t){var o=Number(t),r=o.toFixed(2),c=r.toString().split(".");return c[0]=c[0].replace(/\B(?=(\d{3})+(?!\d))/g,","),c.join(".")}const we=()=>n("div",{children:[e(J,{}),e("h2",{children:"compra"})]}),jt="_App_container_1bop1_1",zt="_welcomeSection_container_1bop1_6",Ht="_welcomeSection_inner_1bop1_10",Gt="_welcomeSection_title_1bop1_17",Ut="_WelcomeSection_items_1bop1_20",Wt="_card_1bop1_28",qt="_card_inner_1bop1_32",Jt="_card_img_container_1bop1_39",Xt="_card_img_1bop1_39",Kt="_card_title_1bop1_52",x={App_container:jt,welcomeSection_container:zt,welcomeSection_inner:Ht,welcomeSection_title:Gt,WelcomeSection_items:Ut,card:Wt,card_inner:qt,card_img_container:Jt,card_img:Xt,card_title:Kt},Qt=i("div")`
 

  
`,Yt=i("span")`
  ${t=>{switch(t.size){case"large":return`
        font-size: 1.5em;
      `}}}
  font-weight: bold;
  color: rgb(46, 46, 46);
`,Ee=t=>e(Qt,{children:e(Yt,{size:"large",children:"VentaMAX"})}),Zt="/assets/compra.680df4d9.png",en="/assets/inventario.ac83d8c2.png",tn="/assets/registro.011da4cc.png",nn="/assets/venta.cf82f897.png",on="_Item_container_1q697_2",rn="_Item_inner_1q697_6",an="_Icon_container_1q697_12",cn="_Icon_item_1q697_16",oe={Item_container:on,Item_inner:rn,Icon_container:an,Icon_item:cn},ln=()=>e("div",{className:oe.Item_container,children:e(O,{className:oe.Item_inner,to:"/inventario",children:e("div",{className:oe.Icon_container,children:e("svg",{className:oe.Icon_item,xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",children:e("path",{d:"M495.9 166.6c3.3 8.6.5 18.3-6.3 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4 0 8.6-.6 17.1-1.7 25.4l43.3 39.4c6.8 6.3 9.6 16 6.3 24.6-4.4 11.9-9.7 23.4-15.7 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.3-6 7.1-15.7 9.6-24.5 6.8l-55.7-17.8c-13.4 10.3-29.1 18.9-44 25.5l-12.5 57.1c-2 9-9 15.4-18.2 17.8-13.8 2.3-28 3.5-43.4 3.5-13.6 0-27.8-1.2-41.6-3.5-9.2-2.4-16.2-8.8-18.2-17.8l-12.5-57.1c-15.8-6.6-30.6-15.2-44-25.5l-55.66 17.8c-8.84 2.8-18.59.3-24.51-6.8-8.11-9.9-15.51-20.3-22.11-31.3l-4.68-8.1c-6.07-10.9-11.35-22.4-15.78-34.3-3.24-8.6-.51-18.3 6.35-24.6l43.26-39.4C64.57 273.1 64 264.6 64 256c0-8.6.57-17.1 1.67-25.4l-43.26-39.4c-6.86-6.3-9.59-15.9-6.35-24.6 4.43-11.9 9.72-23.4 15.78-34.3l4.67-8.1c6.61-11 14.01-21.4 22.12-31.25 5.92-7.15 15.67-9.63 24.51-6.81l55.66 17.76c13.4-10.34 28.2-18.94 44-25.47l12.5-57.1c2-9.08 9-16.29 18.2-17.82C227.3 1.201 241.5 0 256 0s28.7 1.201 42.5 3.51c9.2 1.53 16.2 8.74 18.2 17.82l12.5 57.1c14.9 6.53 30.6 15.13 44 25.47l55.7-17.76c8.8-2.82 18.5-.34 24.5 6.81 8.1 9.85 15.5 20.25 22.1 31.25l4.7 8.1c6 10.9 11.3 22.4 15.7 34.3zM256 336c44.2 0 80-35.8 80-80.9 0-43.3-35.8-80-80-80s-80 36.7-80 80c0 45.1 35.8 80.9 80 80.9z"})})})})}),sn="_Icon_container_10rsc_2",dn="_Icon_10rsc_2",Ne={Icon_container:sn,Icon:dn},pn=()=>e("div",{children:e("div",{className:Ne.Icon_container,children:e("svg",{className:Ne.Icon,xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512",children:e("path",{d:"M224 256c70.7 0 128-57.31 128-128s-57.3-128-128-128C 153.3 0 96 57.31 96 128S153.3 256 224 256zM274.7 304H173.3C77.61 304 0 381.6 0 477.3c0 19.14 15.52 34.67 34.66 34.67h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304z"})})})}),un="_Container_1abes_1",mn="_Item_inner_1abes_1",hn="_Icon_1abes_10",he={Container:un,Item_inner:mn,Icon:hn},gn=()=>e("div",{className:he.Container,children:e("div",{className:he.Item_inner,children:e("svg",{className:he.Icon,xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512",children:e("path",{d:"M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"})})})}),_n="_AppContainer_v51m4_2",xn="_UserSection_v51m4_13",Se={AppContainer:_n,UserSection:xn},fn=()=>n("header",{className:Se.AppContainer,children:[e(Ee,{}),n("div",{className:Se.UserSection,children:[e(Je,{}),e(ln,{})]})]}),bn=()=>{const t=_(ue);return e(s.exports.Fragment,{children:n("div",{className:x.App_container,children:[e(fn,{}),e("div",{className:x.welcomeSection_container,children:n("div",{className:x.welcomeSection_inner,children:[t===null?null:n("h2",{className:x.welcomeSection_title,children:["\xA1Bienvenido de nuevo ",e("span",{children:t.displayName}),"!"]}),n("ul",{className:x.WelcomeSection_items,children:[e("li",{className:x.card,children:n(O,{className:x.card_inner,to:"/app/venta/1",children:[e("div",{className:x.card_img_container,children:e("img",{className:x.card_img,src:nn,alt:""})}),e("h3",{className:x.card_title,children:"Venta"})]})}),e("li",{className:x.card,children:n(O,{className:x.card_inner,to:"/app/compra",children:[e("div",{className:x.card_img_container,children:e("img",{className:x.card_img,src:Zt,alt:""})}),e("h3",{className:x.card_title,children:"Comprar"})]})}),e("li",{className:x.card,children:n(O,{className:x.card_inner,to:"/app/registro",children:[e("div",{className:x.card_img_container,children:e("img",{className:x.card_img,src:tn,alt:""})}),e("h3",{className:x.card_title,children:"Registro"})]})}),e("li",{className:x.card,children:n(O,{className:x.card_inner,to:"/app/inventario",children:[e("div",{className:x.card_img_container,children:e("img",{className:x.card_img,src:en,alt:""})}),e("h3",{className:x.card_title,children:"Inventario"})]})})]})]})})]})})},Cn="_AppContainer_12gsa_2",yn="_products_12gsa_10",vn="_addProduct_12gsa_21",wn="_circle_12gsa_38",Nn="_plusIcon_12gsa_48",Sn="_product_12gsa_10",In="_product_header_12gsa_62",Pn="_product_img_container_12gsa_67",kn="_product_img_12gsa_67",Mn="_product_name_12gsa_80",$n="_group_12gsa_84",E={AppContainer:Cn,products:yn,addProduct:vn,circle:wn,plusIcon:Nn,product:Sn,product_header:In,product_img_container:Pn,product_img:kn,product_name:Mn,group:$n},Fn={apiKey:"AIzaSyAJd82BkS5bp3lI5MbTJohU8rhZth3_AL4",authDomain:"ventamax-75bec.firebaseapp.com",projectId:"ventamax-75bec",storageBucket:"ventamax-75bec.appspot.com",messagingSenderId:"653993214585",appId:"1:653993214585:web:f2e6674640557a28220aa8",measurementId:"G-9RTQMM0JW2"},fe=Ct(Fn),Bn=yt(fe),D=vt(fe),ne=wt(fe),Dn=t=>new Promise((o,r)=>{const c=new Date;`${c.getHours()}${c.getMinutes()}`;const a=Pt(Bn,`products/${pe()}.jpg`);kt(a,t).then(l=>{Mt(a).then(p=>{o(p)})})}),An=(t,o,r,c,a,l,p)=>{const d=JSON.parse(c),m=()=>({ref:d.ref,value:d.value,total:r*d.value,unit:r*d.value});let h=()=>({unit:Number(r)+Number(m().unit),total:Number(r)+Number(m().unit)});console.log(m());let u={id:Le(6),amountToBuy:1,productName:String(o),cost:{unit:Number(r),total:Number(r)},tax:m(),productImageURL:t,stock:Number(a),netContent:p,price:h()};new Promise((f,M)=>{try{const L=q(D,"products",u.id);de(L,{product:u}),console.log("Document written with ID")}catch(L){console.error("Error adding document: ",L)}})},Ve=async t=>{G(D,"products");const{docs:o}=await W(G(D,"products")),r=o.map(c=>c.data());t(r)},Ln=async(t,o)=>{await $t(q(D,"products",t),{product:o}).then()},je=async t=>{const o=G(D,"taxes"),{docs:r}=await W(o),c=r.map(a=>a.data());t(c)},ze=async t=>{const{docs:o}=await W(G(D,"client")),r=o.map(c=>c.data());t(r)},Tn=async(t,o,r)=>{await de(q(D,`${t}`,r),{data:o})},He=async t=>{const{docs:o}=await W(G(D,"categorys")),r=o.map(c=>c.data());t(r)},Ge=async(t,o,r)=>{await de(q(D,`${t}`,r),{category:o})},Rn=t=>{Nt(q(D,"products",t))},On=async t=>{const o=G(D,"bills"),{docs:r}=await W(o),c=r.map(a=>a.data());t(c)},En=async(t,o,r)=>{const c=G(D,"products"),a=St(c,It("product.category","in",o)),{docs:l}=await W(a),p=l.map(d=>d.data());r&&t(p)},Vn={modalBilling:{isOpen:!1},modalAddClient:{isOpen:!1},modalAddProd:{isOpen:!1},modalUpdateProd:{isOpen:!1,prodId:"",data:{}},modalCategory:{isOpen:!1}},Ue=ee({name:"modal",initialState:Vn,reducers:{openModalAddClient:t=>{t.modalAddClient.isOpen=!0},closeModalAddClient:t=>{t.modalAddClient.isOpen=!1},openModalAddProd:t=>{t.modalAddProd.isOpen=!0},closeModalAddProd:t=>{t.modalAddProd.isOpen=!1},openModalBilling:t=>{t.modalBilling.isOpen=!0},closeModalBilling:t=>{t.modalBilling.isOpen=!1},openModalUpdateProd:(t,o)=>{t.modalUpdateProd.isOpen=!0,t.modalUpdateProd.prodId=o.payload},closeModalUpdateProd:t=>{t.modalUpdateProd.isOpen=!1,t.modalUpdateProd.prodId="",t.modalUpdateProd.data={}},openModalCategory:t=>{t.modalCategory.isOpen=!0},closeModalCategory:t=>{t.modalCategory.isOpen=!1}}}),{openModalAddClient:jn,closeModalAddClient:zn,openModalAddProd:Hn,closeModalAddProd:Gn,openModalBilling:Un,closeModalBilling:Ie,openModalUpdateProd:Wn,closeModalUpdateProd:qn,openModalCategory:Jn,closeModalCategory:Xn}=Ue.actions,Kn=t=>t.modal.modalBilling.isOpen,Qn=t=>t.modal.modalAddProd.isOpen,Yn=t=>t.modal.modalAddClient.isOpen,Zn=t=>t.modal.modalUpdateProd,eo=t=>t.modal.modalCategory.isOpen,to=Ue.reducer,no=()=>{const t=C(),[o,r]=s.exports.useState(""),[c,a]=s.exports.useState("");s.exports.useState(""),s.exports.useEffect(()=>{Ve(r)},[]);const l=d=>{const m=d.target.dataset.id;Rn(m)},p=d=>{t(Wn(d))};return n(s.exports.Fragment,{children:[e(J,{}),e("div",{className:E.AppContainer,children:n("div",{children:[e(Ke,{searchData:c,setSearchData:a}),e(ec,{}),c===""?e("ul",{className:E.products,children:o.length!==0?o.map(({product:d,id:m},h)=>n("li",{className:E.product,children:[n("div",{className:E.product_header,children:[e(F,{color:"editar",onClick:()=>p(d.id),children:"Editar"}),e(F,{color:"error",onClick:l,"data-id":m,children:"X"})]}),e("div",{className:E.product_img_container,children:e("img",{className:E.product_img,src:d.productImageURL,alt:""})}),e("div",{className:E.product_name,children:e("h3",{children:d.productName})}),n("div",{className:E.group,children:[e("div",{children:n("span",{children:["costo: ",d.cost.unit]})}),e("div",{children:n("span",{children:["stock: ",d.stock]})})]}),e("div",{children:n("span",{children:["Contenido Neto: ",d.netContent]})}),e("div",{children:n("span",{children:["Total: ",d.price.unit]})})]},h)):e("h2",{children:"No Hay Productos"})}):e(Po,{dataSearch:c})]})})]})},oo="_Container_app_hsqei_1",ro="_Login_Wrapper_hsqei_8",ao="_Login_header_hsqei_16",co="_WebName_hsqei_23",io="_Title_hsqei_29",lo="_LoginControl_Container_hsqei_35",so="_FormControl_hsqei_39",po="_FormItemGroup_hsqei_43",uo="_FormLabel_hsqei_46",mo="_FormInput_hsqei_50",ho="_FormForgetPasswordInput_hsqei_61",$={Container_app:oo,Login_Wrapper:ro,Login_header:ao,WebName:co,Title:io,LoginControl_Container:lo,FormControl:so,FormItemGroup:po,FormLabel:uo,FormInput:mo,FormForgetPasswordInput:ho},go=()=>{const t=C(),o=te(),[r,c]=s.exports.useState(""),[a,l]=s.exports.useState(""),p=d=>{d.preventDefault(),Ft(ne,r,a).then(m=>{const h=m.user;t(Re({email:h.email,uid:h.uid,displayName:h.displayName})),o("/app/")}).catch(m=>{const h=m.code,u=m.message;console.log(h,u)})};return e("div",{className:$.Container_app,children:n("section",{className:$.Login_Wrapper,children:[n("div",{className:$.Login_header,children:[e("div",{className:$.WebName,children:e("span",{children:"VentaMAX"})}),e("span",{className:$.Title,children:"Acceder"})]}),e("div",{className:$.LoginControl_Container,children:n("form",{onSubmit:p,className:$.FormControl,children:[n("div",{className:$.FormItemGroup,children:[e("label",{htmlFor:"",className:$.FormLabel,children:"Usuario:"}),e("input",{className:$.FormInput,type:"text",placeholder:"Email:",onChange:d=>c(d.target.value)})]}),n("div",{className:$.FormItemGroup,children:[e("label",{className:$.FormLabel,htmlFor:"",children:"Contrase\xF1a:"}),e("input",{className:$.FormInput,type:"password",placeholder:"Contrase\xF1a:",onChange:d=>l(d.target.value)}),e(O,{className:$.FormForgetPasswordInput,to:"/",children:"\xBFOlvidaste la Contrase\xF1a?"})]}),e("div",{children:e(F,{children:"Entrar"})})]})})]})})},_o=()=>n("div",{children:[e(J,{}),e("h2",{children:"Estas perdido"})]}),xo=()=>{const[t,o]=s.exports.useState("");return s.exports.useEffect(()=>{On(o)},[]),console.log(t),n("div",{children:[e(J,{}),n(fo,{children:[n(bo,{children:[e(y,{children:e("h3",{children:"Fecha"})}),e(y,{children:e("h3",{children:"Clientes"})}),e(y,{children:e("h3",{children:"Pagado"})}),e(y,{children:e("h3",{children:"Cambio"})}),e(y,{children:e("h3",{children:"TOTAL"})})]}),n(yo,{children:[t.length>0?t.map(({data:r},c)=>n(Co,{children:[e(y,{children:Date(r.date)}),e(y,{children:`${r.client.name} ${r.client.lastName}`}),n(y,{children:["RD$ ",r.cashPaymentMethod.value]}),n(y,{children:["RD$ ",B(r.change.value)]}),n(y,{children:["RD$",B(r.totalPurchase.value)]})]},c)):null,e(y,{}),e(y,{}),e(y,{}),e(y,{}),e(y,{})]}),n(vo,{children:[e(y,{children:"TOTAL"}),e(y,{}),e(y,{}),e(y,{}),e(y,{})]})]})]})},fo=i.div`
  
`,be=i.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  justify-content: center;
  justify-items: center;
 
`,bo=i(be)`

`,y=i.div`

`,Co=i(be)`
  
`,yo=i.div`

`,vo=i(be)`

`,wo="_component_container_amuk1_2",No={component_container:wo},So="_container_w46pn_1",Io={container:So},Po=({dataSearch:t})=>{const[o,r]=s.exports.useState(),[c,a]=s.exports.useState([]);return console.log(t),s.exports.useEffect(()=>{const l=o.filter(p=>p.product.productName.toLowerCase().includes(t.toLowerCase()));a(l)},[t,o]),e("div",{className:Io.container,children:e(xe,{columns:"4",children:!t==""?o.length>0?c.map(({product:l},p)=>e(_e,{image:l.productImageURL,title:l.productName,price:l.totalPrice,view:"row",product:l},p)):e("h2",{children:"No hay Productos!"}):null})})},ko={status:!1,categoryList:[]},We=ee({name:"category",initialState:ko,reducers:{addCategory:(t,o)=>{const{id:r,name:c}=o.payload,a=t.categoryList.every(l=>l!==c);console.log(a),a&&t.categoryList.length<8&&(console.log("entrando"),t.status=!0,t.categoryList.push(c))},delecteProductSelected:t=>{t.categoryList=[],t.status=!1}}}),{addCategory:Mo,delecteProductSelected:$o}=We.actions,qe=t=>t.category.categoryList,Fo=t=>t.category.status,Bo=We.reducer,Do=()=>{s.exports.useState([]);const t=_(Fo),o=_(qe);s.exports.useState([]);const[r,c]=s.exports.useState([]),[a,l]=s.exports.useState(""),[p,d]=s.exports.useState([]);s.exports.useEffect(()=>{t&&En(c,o,t),t===!1&&Ve(c)},[o,t]),s.exports.useEffect(()=>{const u=r.filter(f=>f.product.productName.toLowerCase().includes(a.toLowerCase()));d(u)},[a,r]),console.log(r);const[m,h]=s.exports.useState("");return s.exports.useEffect(()=>{Ae(ne,u=>{u&&h(u)})},[]),n(s.exports.Fragment,{children:[e(Ke,{searchData:a,setSearchData:l}),e("div",{className:No.component_container,children:a===""&&r.length>0?e(xe,{columns:"4",children:r.map(({product:u},f)=>e(_e,{title:u.productName,image:u.productImageURL,price:u.price.unit,view:"row",product:u},f))}):e(xe,{columns:"4",children:p.map(({product:u},f)=>e(_e,{title:u.productName,image:u.productImageURL,price:u.price.unit,view:"row",product:u},f))})})]})},Ao="_AppContainer_6y7ob_7",Lo="_ProductsContainer_6y7ob_15",Pe={AppContainer:Ao,ProductsContainer:Lo},To=()=>n(s.exports.Fragment,{children:[e(J,{}),n("main",{className:Pe.AppContainer,children:[e(Ur,{}),n("div",{className:Pe.ProductsContainer,children:[e(Do,{}),e(Ka,{})]}),e(Er,{})]})]}),Ro=()=>{const t=te(),[o,r]=s.exports.useState(""),[c,a]=s.exports.useState(""),[l,p]=s.exports.useState(""),[d,m]=s.exports.useState("");return n("div",{children:[e("h2",{children:"Register"}),n("form",{onSubmit:u=>{u.preventDefault(),l===d&&(Bt(ne,c,l).then(f=>{Dt(f.user,{displayName:o}).catch(M=>console.log("user not updated"))}).catch(f=>alert(f)),t("/login"))},children:[n("div",{children:[e("label",{htmlFor:"",children:"Name:  "}),e(A,{type:"text",name:"",id:"",placeholder:"Nombre",onChange:u=>r(u.target.value)})]}),e("br",{}),n("div",{children:[e("label",{htmlFor:"",children:"Email:  "}),e(A,{type:"email",name:"",id:"",placeholder:"ejemplo@gmail.com",onChange:u=>a(u.target.value)})]}),e("br",{}),n("div",{children:[e("label",{htmlFor:"",children:"Contrase\xF1a:  "}),e(ke,{type:"password",placeholder:"Example1R9_0",onChange:u=>p(u.target.value)})]}),e("br",{}),n("div",{children:[e("label",{htmlFor:"",children:"Repite la contrase\xF1a:  "}),e(ke,{type:"password",placeholder:"Example1R9_0",name:"",id:"",onChange:u=>m(u.target.value)})]}),e(F,{children:"Crear"})]})]})},Oo=()=>n("div",{children:[e("h2",{children:"VentaMax.com"}),e("p",{children:"VENTAMAX es un software que te permite administrar tu negocio desde un solo lugar, puedes manejar las compras y ventas de tu negocio, ademas como aplicaci\xF3n web, podr\xE1s utilizarlos desde tu computadora hasta en el m\xF3vil."}),e(O,{to:"/login",children:"Login"}),e("br",{}),e(O,{to:"/register",children:"Register"})]}),Eo=()=>e("div",{children:e(Lt,{})}),b=_t.create({page:{backgroundColor:"#E4E4E4"},section:{fontSize:11,marginBottom:2,padding:10,paddingTop:30,paddingHorizontal:30},TimeANDHour:{width:120,flexDirection:"row",justifyContent:"space-between"},ProductList:{fontSize:12},Title:{fontWeight:"bold"},ProductListHead:{flexDirection:"row",justifyContent:"space-between",padding:10,marginBottom:10,paddingHorizontal:30,flexGrow:1},ProductListBody:{flexDirection:"row",justifyContent:"space-between",paddingHorizontal:30,flexGrow:1},PaymentInfo:{flexDirection:"row",justifyContent:"space-between",marginTop:14,paddingHorizontal:30,flexGrow:1},ColumnDescr:{flexGrow:1.2,flexShrink:1,flexBasis:0,justifyContent:"flex-end"},ColumnIva:{flexGrow:1,flexShrink:1,flexBasis:0,justifyContent:"flex-end",textAlign:"right"},ColumnValue:{flexGrow:1,flexShrink:1,flexBasis:0,textAlign:"right"}}),Vo=({data:t})=>{const{products:o,totalTaxes:r,totalPurchase:c,delivery:a}=t;console.log(o);const l=new Date,[p,d,m]=[l.getMonth()+1,l.getDate(),l.getFullYear()],[h,u,f]=[l.getHours(),l.getMinutes(),l.getSeconds()];return e(xt,{children:n(ft,{size:"EXECUTIVE",style:b.page,children:[n(w,{style:b.section,children:[e(S,{children:"[NOMBRE NEGOCIO]"}),e(S,{children:"Tel: [TELEFONO]"}),e(S,{children:"[DIRECCION]"}),n(w,{style:b.TimeANDHour,children:[e(S,{children:`${d}/${p}/${m}`}),e(S,{children:`${h}:${u}:${f}`})]})]}),n(w,{style:b.ProductList,children:[n(w,{style:b.ProductListHead,children:[e(w,{style:b.ColumnDescr,children:e(S,{children:"DESCRIPCION"})}),e(w,{style:b.ColumnIva,children:e(S,{children:"ITBIS"})}),e(w,{style:b.ColumnValue,children:e(S,{children:"VALOR"})})]}),o.length!==0?o.map((M,L)=>e("div",{children:n(w,{style:b.ProductListBody,children:[e(w,{style:b.ColumnDescr,children:e(S,{children:M.productName})}),e(w,{style:b.ColumnIva,children:e(S,{children:M.tax.total})}),e(w,{style:b.ColumnValue,children:e(S,{children:B(M.price.total)})})]})},L)):null,n(w,{style:b.PaymentInfo,children:[e(w,{style:b.ColumnDescr,children:e(S,{children:"Envio:"})}),e(w,{style:b.ColumnIva,children:e(S,{})}),e(w,{style:b.ColumnValue,children:e(S,{children:B(a.value)})})]}),n(w,{style:b.PaymentInfo,children:[e(w,{style:b.ColumnDescr,children:e(S,{style:b.Title,children:"TOTAL A PAGAR"})}),e(w,{style:b.ColumnIva,children:e(S,{children:r.value})}),e(w,{style:b.ColumnValue,children:e(S,{children:c.value.toFixed(2)})})]})]})]})})};i.div`
    background-color: red;
    padding: 100px;
`;const jo="_Container_1ylac_9",zo="_MenuBtn_1ylac_21",Ho="_MenuBtn_icon_1ylac_35",Go="_MenuBtn_icon_closed_1ylac_63",Uo="_Menu_1ylac_21",Wo="_Menu_links_group_1ylac_102",qo="_Menu_link_container_1ylac_108",Jo="_Menu_link_1ylac_102",Xo="_Active_1ylac_122",Ko="_Disabled_1ylac_126",I={Container:jo,MenuBtn:zo,MenuBtn_icon:Ho,MenuBtn_icon_closed:Go,Menu:Uo,Menu_links_group:Wo,Menu_link_container:qo,Menu_link:Jo,Active:Xo,Disabled:Ko},Qo=[{title:"Inicio",path:"/app/"},{title:"Venta",path:"/app/venta/1"},{title:"Compra",path:"/app/compra",subMenu:[{title:"Pedido",path:"/app/Compra/Pedido"},{title:"Clientes",path:"/app/contact/clientes"}]},{title:"Categor\xEDa",path:"/app/category"},{title:"Registro",path:"/app/registro"},{title:"Contacto",path:"/app/contact",subMenu_icon:e(At,{}),submenu:[{title:"Clientes",path:"/app/contact/clientes"},{title:"Proveedores",path:"/app/contact/proveedores"}]},{title:"Inventario",path:"/app/inventario",submenu:[{title:"Clientes",path:"/app/contact/clientes"},{title:"Proveedores",path:"/app/contact/proveedores"}]},{title:"Configuraci\xF3n",path:"/app/setting"}],Yo="_Component_container_1c5yj_2",Zo="_AccountMenu_1c5yj_17",er="_Items_1c5yj_29",tr="_Item_1c5yj_29",nr="_Item_Link_1c5yj_40",or="_Icon_wrapper_1c5yj_45",rr="_Icon_1c5yj_45",ar="_Open_1c5yj_54",P={Component_container:Yo,AccountMenu:Zo,Items:er,Item:tr,Item_Link:nr,Icon_wrapper:or,Icon:rr,Open:ar},Je=()=>{const t=C(),[o,r]=s.exports.useState(!1),c=()=>{r(!o)},a=_(ue),l=()=>{t(Oe()),ne.signOut()};return n("div",{className:P.Component_container,onClick:c,children:[e(pn,{}),a===null?null:e("span",{children:a.displayName}),e("article",{className:o?`${P.AccountMenu} ${P.Open}`:`${P.AccountMenu}`,children:n("ul",{className:P.Items,children:[n("li",{className:P.Item,children:[e(O,{to:!0,className:P.Item_Link,children:"Cuenta"}),e("div",{className:P.Icon_wrapper,children:e("svg",{className:P.Icon,xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512",children:e("path",{d:"M256 64C256 46.33 270.3 32 288 32H415.1C415.1 32 415.1 32 415.1 32C420.3 32 424.5 32.86 428.2 34.43C431.1 35.98 435.5 38.27 438.6 41.3C438.6 41.35 438.6 41.4 438.7 41.44C444.9 47.66 447.1 55.78 448 63.9C448 63.94 448 63.97 448 64V192C448 209.7 433.7 224 416 224C398.3 224 384 209.7 384 192V141.3L214.6 310.6C202.1 323.1 181.9 323.1 169.4 310.6C156.9 298.1 156.9 277.9 169.4 265.4L338.7 96H288C270.3 96 256 81.67 256 64V64zM0 128C0 92.65 28.65 64 64 64H160C177.7 64 192 78.33 192 96C192 113.7 177.7 128 160 128H64V416H352V320C352 302.3 366.3 288 384 288C401.7 288 416 302.3 416 320V416C416 451.3 387.3 480 352 480H64C28.65 480 0 451.3 0 416V128z"})})})]}),n("li",{className:P.Item,children:[e(O,{to:!0,className:P.Item_Link,children:"Ayuda"}),e("div",{className:P.Icon_wrapper,children:e("svg",{className:P.Icon,xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512",children:e("path",{d:"M256 64C256 46.33 270.3 32 288 32H415.1C415.1 32 415.1 32 415.1 32C420.3 32 424.5 32.86 428.2 34.43C431.1 35.98 435.5 38.27 438.6 41.3C438.6 41.35 438.6 41.4 438.7 41.44C444.9 47.66 447.1 55.78 448 63.9C448 63.94 448 63.97 448 64V192C448 209.7 433.7 224 416 224C398.3 224 384 209.7 384 192V141.3L214.6 310.6C202.1 323.1 181.9 323.1 169.4 310.6C156.9 298.1 156.9 277.9 169.4 265.4L338.7 96H288C270.3 96 256 81.67 256 64V64zM0 128C0 92.65 28.65 64 64 64H160C177.7 64 192 78.33 192 96C192 113.7 177.7 128 160 128H64V416H352V320C352 302.3 366.3 288 384 288C401.7 288 416 302.3 416 320V416C416 451.3 387.3 480 352 480H64C28.65 480 0 451.3 0 416V128z"})})})]}),e("li",{className:P.Item,children:e(F,{width:"100",color:"primary",className:P.Item_Link,onClick:l,children:"Cerrar sesi\xF3n"})})]})})]})},J=()=>{const t=Qo,[o,r]=s.exports.useState(!1),c=l=>{l.preventDefault(),r(!o)};document.querySelector("cl");let a=Tt();return e(ve,{children:a?n(ve,{children:[e("div",{className:I.Background}),n("div",{className:I.Container,children:[e("div",{className:I.MenuBtn,onClick:c,children:e("div",{className:o?`${I.MenuBtn_icon} ${I.MenuBtn_icon_closed}`:I.MenuBtn_icon})}),e("div",{className:I.Center,children:e(Ee,{size:"large"})}),e(Je,{}),e("nav",{className:o?I.Menu:`${I.Menu} ${I.Disabled}`,children:e("ul",{className:I.Menu_links_group,children:t.map((l,p)=>e("li",{className:I.Menu_link_container,children:e(ut,{className:({isActive:d})=>d?`${I.Menu_link} ${I.Active}`:I.Menu_link,to:l.path,children:l.title})},p))})})]})]}):e("h2",{children:"hola"})})},Xe=i.input`
  background: #f3f3f3;
  border-radius: 100px;
  height: 1.7em;
  padding: 0.5em;
  //min-width: 200px;
  font-size: 18px;
  border: 1px solid rgba(0, 0, 0, 0.100);

`;i.textarea`
  background: #f3f3f3;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.100);
  resize: none;
  height: 10em;
  padding: 0.5em;
  &:focus{
    outline:  1px solid rgba(0, 0, 0, 0.300);
    border: 1px solid rgba(0, 0, 0, 0.300);
  }
`;const A=i(Xe).attrs({type:"text"})`
  
  
  &:focus{
    box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.200);
    border: 1px solid rgba(0, 0, 0, 0.300);
    outline:  1px solid rgba(0, 0, 0, 0.300);
  }
  ${t=>{switch(t.size){case"small":return`
          width: 8em;
        `;case"medium":return`
          width: 12em;`;default:return null}}}


`,ke=i(Xe).attrs({type:"password"})`
  background: #f3f3f3;
  border-radius: 100px;
  padding: 0.2em 0.6em;
  min-width: 200px;
  font-size: 1.1em;
  border: 1px solid rgba(0, 0, 0, 0.188);
  &:hover{
    box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.200);
    border: 1px solid rgba(0, 0, 0, 0.300);
  }
  &:focus{
    box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.200);
    border: 1px solid rgba(0, 0, 0, 0.300);
   outline:  none;
   
  }

`,cr=()=>{const[t,o]=s.exports.useState("");let r={id:pe(),name:t};return console.log(r),n(ir,{children:[e(lr,{children:n(pr,{children:[e("label",{htmlFor:"",children:"Nombre:"}),e(A,{name:"name",placeholder:"Nombre de la Categor\xEDa",onChange:a=>o(a.target.value),value:t})]})}),e(sr,{children:e(dr,{onClick:a=>{Ge("categorys",r,r.id),a.preventDefault(),console.log("click"),o("")},children:"Guardar"})})]})};i.div`
   // background-color: rgb(200, 209, 221);
 
`;const ir=i.div`
    background-color: rgb(218, 216, 216);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.150);
    padding: 1em;
    display: grid;
    width: 100%;
    
    gap: 1em;
    border-radius: 10px;
`,lr=i.form`
    display: grid;
    gap: 0.8em;
`,sr=i.footer`
    display: grid;
    justify-items: right;
`,dr=i.button`
    display: flex;
    height: 1.8em;
    align-items: center;
    background-color: rgb(66,165,245);
    gap: 0.4em;
    color: #e6e6e6;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 100px;
    padding: 0 0.6em;
    font-weight: 650;
    svg{
        width: 1em;
        fill: #313131;
    }
    span{
        font-weight: 500;
    }


`,pr=i.div`
    display: grid;
    gap: 0.4em;
    grid-template-columns: 1fr;
    background-color: rgb(230, 230, 230);
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 10px;
    padding: 0.4em 0.6em;
    label{
        color: #646464;
        font-weight: 600;
    }

`,ur=()=>e(mr,{children:"Pedidos"}),mr=i.div`
    
`,hr="_Container_19fcg_5",gr="_icons_container_19fcg_15",_r="_icon_19fcg_15",xr={Container:hr,icons_container:gr,icon:_r},Ke=({searchData:t,setSearchData:o})=>e(s.exports.Fragment,{children:n("div",{className:xr.Container,children:[e(A,{placeholder:"Buscar Producto",type:"text",onChange:r=>o(r.target.value)}),e(fr,{})]})}),fr=()=>{const t=_(qe);t.length>0&&console.log(t);const[o,r]=s.exports.useState(""),c=_(eo),a=C();s.exports.useEffect(()=>{He(r)},[]);const l=()=>{a(Jn())},p=d=>{a(Mo(d))};return n(s.exports.Fragment,{children:[e(br,{onClick:l,children:"Categor\xEDa"}),c?n(yr,{children:[n(vr,{children:[e(Cr,{children:e(A,{placeholder:"Buscar Categoria"})}),e(Qa,{fn:l})]}),n(wr,{children:[n(Nr,{children:[n(Sr,{children:[e("h3",{children:"Categor\xEDa Seleccionados"}),n("button",{onClick:()=>a($o()),children:[e("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512",children:e("path",{d:"M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"})}),e("span",{children:"Descartar"})]})]}),e(Ir,{children:t.length>0?t.map((d,m)=>e("li",{children:d},m)):null})]}),n(Pr,{children:[e("h3",{children:"Lista de Categor\xEDas"}),e(kr,{children:o.length>0?o.map(({category:d},m)=>e("li",{onClick:h=>p(d),children:d.name},m)):null})]})]})]}):null]})},br=i.button`
    height: 1.8em;
    border-radius: 50px;
    font-weight: 500;
    color: rgb(255, 255, 255);
    padding: 0 0.5em;
    border: 1px solid #00000033;
    background: rgb(66,165,245);
    display: flex;
    align-items: center;
    justify-content: center;
`,Cr=i.div`
    display: flex;
    gap: 0.8em;
    align-items: center;

`,yr=i.ul`
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background-color: rgba(223, 223, 223, 0.274);
    backdrop-filter: blur(10px);
    padding: 0.4em;
    display: grid;
   
    grid-template-columns: 1fr;
    grid-template-rows: min-content ;
    gap: 0.5em;
   
    
`,vr=i.div`
    background-color: #5a5a5a;
    border-radius: 100px;
    height: 2.5em;
    display: flex;
    align-items: center;
    padding: 0 0.4em;
    justify-content: space-between;
    
`,wr=i.div`
display: grid;
gap: 0.5em;
    
`,Nr=i.div`
    background-color: #94949486;
    border-radius: 15px;
    padding: 0 0.2em;
   
    h3{
        margin: 0.5em 0.2em;
        color: #3a3a3a;

    }
    button{
        display: flex;
        align-items: center;
        gap: 0.4em;
        border-radius: 50px;
        border: 1px solid rgba(0, 0, 0, 0.300);
        padding: 0.4em;
       
        height: 2em;
        svg{
            width: 1em;
        }
        span{
           
        }
    }
    
`,Sr=i.div`
     display: flex;
    justify-content: space-between;
    align-items: center;
`,Ir=i.div`
display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4em;
    padding: 1em 0;
    li{
        list-style: none;
        padding: 0.2em 1em;
        background-color: rgba(255, 255, 255, 0.767);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.050);
        color: #292929;
        text-align: center;
        border-radius: 50px;
        box-shadow: 0 0 10px rgba(5, 5, 5, 0.238);
        font-weight: 500;

    }`,Pr=i.div`
background-color: #94949486;
backdrop-filter: blur(2000px);
border-radius: 15px;
padding: 0.01em 0.2em;
h3{
    margin: 0.5em 0.2em;
    color: #3a3a3a;

}

`,kr=i.ul`
    display: grid;
    gap: 0.5em;
    height: 400px;
    
    grid-template-columns: 1fr 1fr 1fr 1fr ;
    align-items: flex-start;
    align-content: flex-start;
    list-style: none;
    padding: 0;

    li{
        padding: 0.2em 1em;
        background-color: rgba(255, 255, 255, 0.767);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.050);
        color: #292929;
        text-align: center;
        border-radius: 50px;
        box-shadow: 0 0 10px rgba(5, 5, 5, 0.238);
        font-weight: 500;

    }
`,Mr="_FacturaControlContainer_11qm1_2",$r="_listItem_11qm1_13",Fr="_group_11qm1_19",Br="_Item1_11qm1_33",Dr="_CrossContainer_11qm1_45",Ar="_Cross_11qm1_45",Lr="_resultBar_11qm1_58",Tr="_ClientBar_11qm1_81",Rr="_IconContainer_11qm1_88",Or="_Icon_11qm1_88",T={FacturaControlContainer:Mr,listItem:$r,group:Fr,Item1:Br,CrossContainer:Dr,Cross:Ar,resultBar:Lr,ClientBar:Tr,IconContainer:Rr,Icon:Or},Er=()=>{te();const t=C();s.exports.useState("");const o=_(me),r=p=>{t(tt(p))},c=()=>{o.length===0?console.log("todavia no has agregado nada"):(t(Un()),t(Pc()),t(le()),t(Z()),t(z()))},a=o.reduce((p,d)=>p+d.price.total,0),l=B(a);return e(s.exports.Fragment,{children:n("section",{className:T.FacturaControlContainer,children:[e(Kr,{}),e("ul",{className:T.listItem,children:o.length>=1?o.map((p,d)=>n("li",{className:T.group,children:[e("div",{className:`${T.Item} ${T.Item1}`,children:p.productName}),e(qa,{className:`${T.Item}`,amountToBuy:p.amountToBuy,stock:p.stock,id:p.id}),e("div",{className:T.CrossContainer,onClick:()=>r(p.id),children:e("svg",{className:T.Cross,xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",width:"16",children:e("path",{d:"M23.707.293a1 1 0 00-1.414 0L12 10.586 1.707.293a1 1 0 00-1.414 0 1 1 0 000 1.414L10.586 12 .293 22.293a1 1 0 000 1.414 1 1 0 001.414 0L12 13.414l10.293 10.293a1 1 0 001.414 0 1 1 0 000-1.414L13.414 12 23.707 1.707a1 1 0 000-1.414z"})})}),n("div",{className:`${T.Item} ${T.Item3}`,children:["RD$",B(p.price.total)]}),e("br",{})]},d)):e("h4",{style:{margin:"1em"},children:"Todav\xEDa no ha seleccionado ning\xFAn producto"})}),n("div",{className:T.resultBar,children:[e("div",{children:n("h3",{children:["Total : RD$  ",l]})}),e(F,{onClick:c,children:"Facturar"})]})]})})},Vr="_Container_ttlke_2",jr="_Items_ttlke_7",zr="_Item_ttlke_7",Hr="_AddBtn_ttlke_30",Gr="_Open_ttlke_80",H={Container:Vr,Items:jr,Item:zr,AddBtn:Hr,Open:Gr},Ur=()=>{const[t,o]=s.exports.useState(!1),[r,c]=s.exports.useState([1]),a=l=>{l.preventDefault();const p=r.at(-1);if(p<7){const d=p+1;c([...r,d])}p>6&&alert("ya excediste el numero de pantallas"),console.log(r)};return e("div",{className:t?`${H.Container} ${H.Open}`:`${H.Container}`,children:n("ul",{className:H.Items,children:[e("button",{onClick:a,className:`${H.Item} ${H.AddBtn}`,children:e(gn,{})}),r.map((l,p)=>e("li",{className:H.Item,children:l},p))]})})},V=({children:t})=>{const o=_(ue),r=te();return s.exports.useEffect(()=>{o===null&&r("/")},[o]),t},Wr="_ClientBar_1d2lf_1",qr="_clientControl_1d2lf_13",Jr="_IconContainer_1d2lf_22",Xr="_Icon_1d2lf_22",Me={ClientBar:Wr,clientControl:qr,IconContainer:Jr,Icon:Xr},Kr=()=>{C();const[t,o]=s.exports.useState(""),[r,c]=s.exports.useState(""),[a,l]=s.exports.useState("");s.exports.useEffect(()=>{ze(o)},[]);const p=d=>{c(d);const m=t.filter(h=>h.client.name.toLowerCase().includes(r.toLowerCase()));l(m)};return n("div",{className:Me.ClientBar,children:[e(A,{size:"medium",type:"text",placeholder:"Buscar cliente",onChange:d=>p(d.target.value)}),r!==""?e("div",{className:Me.clientControl,children:t.length>0?a.map(({client:d},m)=>e(Ze,{name:d.name,lastName:d.lastName,client:d,searchData:{searchData:r,setSearchData:c}},m)):e("h3",{children:"A\xF1ade un cliente"})}):null,e(Ye,{}),e(tc,{})]})},F=i.button`
  //border
  border-radius: 100px;
  border: 1px solid #00000030;
  //container
  //background-color: #2a2b2b;
  background-color: ${t=>t.delete?"#d13737":"black"};
  //padding
  padding: 0.3em 1em;
  //contain

  /*font */
  color: black;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
 
  cursor: pointer;
  transition: border-color 0.25s;
  
  &:hover{
    background-color: #d6d6d6;
    
    color: black;
  }
  &:focus, &:focus-visible{
    outline: 4px auto -webkit-focus-ring-color;
  }
 ${t=>{switch(t.color){case"error":return`
            background-color: #d34343;
            color: white;
            min-height: 1.8em;
            min-width: 1.8em;
            padding: 0;
            &:hover{
              background-color: #b10505;
              color: white
            }
          `;case"gray":return`
            background-color: #8d8d8d;
            color: white;
            
           
           
          `;case"primary":return`
        background-color: #409ae4;
        color: white;
        &:hover{
                background-color: #4589d8;
              
              color: white
            }
            `;default:return`
            background-color: white;
          `}}}
  
  ${t=>{switch(t.width){case"100":return`
           width: 100%;
          `;case"auto":return`
              width: auto;
            `;default:return`
            width: auto;
          `}}}
  
  
`,Qr=i.div`
  display: flex;
  gap: 1em;
`,Yr=i.div`
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.300);
    backdrop-filter: blur(10px);

    
`,Zr=i.div`
    height: 580px;
    width: 94%;
    max-width: 1000px;
    display: grid;
    grid-template-rows: 3em 1fr;
    position: relative;
    border: 1px solid rgba(0, 0, 0, 0.400);
    border-radius: 10px;
    overflow: hidden;
    background-color: rgba(255, 255, 255, 0.800);
    backdrop-filter: blur(70px);
    
`,ea=i.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.500);
    padding: 0.5em 1em;
    background-color: #424242;
    color: white;
`,ta=i.div`
  
    padding: 1em;
    display: grid;
    grid-template-rows: min-content min-content 1fr 3em;
    align-items: flex-start;
    gap: 0.6em;
    height: 100%;
    position: relative;

`,na=i.div`
    display: grid;
    gap: 0.5em;
    grid-template-columns: 1.2fr 1fr;
    align-items: stretch;
    background-color: rgb(200, 200, 200);
    border-radius: 10px;
    padding: 0.4em 0.5em;
    max-height: 400px;
    position: relative;

    


  
`,oa=i.div`
    background-color: #ffffffab;
    border-radius: 10px;
    padding: 0;
    overflow: hidden;
    position: relative;
    
    `,ra=i.ul`
    list-style: none;
    padding: 0;
    height: 300px;
    display: flex;
    flex-direction: column; 
    

    background-color: #fdfdfd;
  
    gap: 0.4em;
    overflow-y: scroll;
    padding: 0.4em 1em 1em;
    
`,aa=i.li`
    border: 1px solid rgba(0, 0, 0, 0.240);
    border-radius: 10px;
    background-color: rgb(258, 258, 258);
    padding: 0.2em 0;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.100);


`,ca=i.div`
    font-weight: 600;
`,ia=i.div`
    font-weight: 600;
`,la=i.div`
    font-weight: 600;
`,sa=i.div`
    font-weight: 600;
`,da=i.div`

`,pa=i.div`
    
`,ua=i.div`
margin: 0;
    
`,Qe=i.input`
    background-color: #ffffff;
    border: 1px solid rgba(3, 3, 3, 0.300);
    padding: 0.3em 0.8em;
    &:focus{
        outline: none;
    }
`,se=i(Qe).attrs({type:"text"})`
   ${t=>{switch(t.border){case"circle":return`
                border-radius: 10px;
                `}}}
`,ie=i(Qe).attrs({type:"number"})`
    &::-webkit-inner-spin-button, &::-webkit-outer-spin-button{
        -webkit-appearance: none;
        margin: 0;
    }
     ${t=>{switch(t.size){case"small":return`
                width: 6em;
                `}}}
    ${t=>{switch(t.border){case"circle":return`
                border-radius: 10px;
                `}}}
`;i.div`
    display: flex;
`;const R=i.div`
    display: grid;
    padding: 0 0.2em;
    label{
        font-weight: 600;
    }
    ${t=>{switch(t.padding){case"normal":return`
                padding: 0.4em;
             
                `}}}
    ${t=>{switch(t.fontWeight){case"title":return`
                font-weight: 600;
                font-size: 16px;
                `}}}
    ${t=>{switch(t.borderRadius){case"normal":return`
                border-radius: 10px;
                `}}}
    ${t=>{switch(t.bgColor){case"black":return`
                background-color: #666666;
                color: white;
                `;case"primary":return`
                background-color: rgb(69,137,216);
                color: white;
                `;case"gray2":return`
                background-color: #9b9b9b;
                color: #383838;
                `}}}

    ${t=>{switch(t.columns){case"payment":return`
            grid-template-columns:  auto minmax(80px, 1fr) minmax(60px, 1fr) minmax(60px, 1fr);
            `;case"product-list":return`
            grid-template-columns:  2fr 1fr 1fr;
            padding: 1em
            `;case"2":return`
                grid-template-columns: 1fr 2fr ;
                `}}}
  
   
    justify-content: center;
    align-items: center;
    align-content: center;
    gap: 1em;
    
`;i.div`

`;i.div`
    display: grid;
    gap: 0.5em;
`;const ma=i.div`
    display: Grid;
    grid-template-columns: 1fr;
`,ha=i.div`
    display: grid;
    justify-content: right;
`,ga=()=>{C();const t=_(ot),[o,r]=s.exports.useState(""),[c,a]=s.exports.useState(""),[l,p]=s.exports.useState("");_(u=>u.cart);const[d,m]=s.exports.useState();s.exports.useEffect(()=>{ze(a)},[]);const h=u=>{r(u);const f=c.filter(M=>M.client.name.toLowerCase().includes(o.toLowerCase())||M.client.address.toLowerCase().includes(o.toLowerCase()));p(f)};return n(_a,{children:[e($e,{children:n(xa,{children:[e(se,{type:"text",border:"circle",value:o,placeholder:"Buscar Cliente",onChange:u=>h(u.target.value)}),e(Ye,{}),o!==""?e(Ca,{children:e(ya,{children:c.length>0?l.map(({client:u},f)=>e(Ze,{name:u.name,lastName:u.lastName,address:u.address,email:u.email,taxReceipts:u.taxReceipts,tel:u.tel,client:u,searchData:{searchData:o,setSearchData:r}},f)):null})}):null]})}),e($e,{children:t?n(ba,{children:[n(Fe,{children:[t.name," ",t.lastName," "]}),n(Fe,{children:["Tel\xE9fono: ",t.tel," "]})]}):null}),n(fa,{children:[e("input",{type:"checkbox",name:"",id:"",onChange:u=>m(u.target.checked)}),e("label",{htmlFor:"",children:"Comprobante Fiscal:"}),d?t?e("span",{children:t.taxReceipts}):e(se,{type:"text",placeholder:"RNC/C\xE9dula"}):null]})]})},_a=i.div`
    height: 2.4em;
    display: flex;
    flex-wrap: wrap;
    background-color: rgba(0, 0, 0, 0.13);
    border-radius: 10px ;
    position: relative;
    align-items: center;
    gap: 1em;
    padding: 0.2em 0.4em;
`,$e=i.div`
    display: grid;
    gap: 1em;
`,xa=i.div`
    display: flex;
    align-items: center;
    gap: 0.2em;
`,fa=i.div`
    display: flex;
    align-items: center;
    gap: 0.4em;
`,ba=i.div`
    display: flex;
    align-items: center;
    gap: 0.5em;
`,Fe=i.div`
    border-radius: 10px;
    padding: 0.1em 0.8em;
    background-color: #5395cc;
    color: white;
`,Ca=i.ul`
    background-color: #707070;
    position: absolute;
    top: 2.2em;
    left: 0;
    max-width: 500px;
    width: 100%;
    height: 250px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.200);
    z-index: 3;
    overflow: hidden;
    padding: 0;
`,ya=i.ul`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(10, min-content);
    height: 100%;
    gap: 0.5em;
    justify-content: start;
    
    padding: 0.3em;

    overflow-y: scroll;
`,va=()=>{const t=C(),[o,r]=s.exports.useState(),c=_(ot),a=l=>{t(bc(l)),t(Z()),t(z())};return n(wa,{children:[n(Na,{children:[e("input",{type:"checkbox",name:"",id:"",onChange:l=>r(l.target.checked)}),e("label",{htmlFor:"",children:"Delivery"})]}),o&&c?n(s.exports.Fragment,{children:[e(ie,{border:"circle",size:"small",type:"number",name:"",id:"",onChange:l=>a(l.target.value),placeholder:"RD$"}),n("span",{children:["Direcci\xF3n: ",c.address]})]}):null]})},wa=i.div`
    padding: 0.2em 0.6em;
    height: 2.4em;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 0.4em;
    background-color: rgb(199,199,199);

    
`,Na=i.div``,Sa=()=>{const t=C(),o=_(kc),r=_(Mc),c=_($c),a=_(Fc),[l,p]=s.exports.useState(!1),[d,m]=s.exports.useState(!1),[h,u]=s.exports.useState(!1),f=g=>{l?t(Cc({status:l,value:g})):console.log(l),t(z())},M=g=>{d?t(yc({status:d,value:g})):console.log(d),t(z())},L=g=>{h?t(vc({status:h,value:g})):console.log(h),t(z())};return n(Ia,{children:[n(ge,{gap:"normal",children:[e(ma,{children:e("h4",{children:"Metodo de pago"})}),n(R,{columns:"payment",children:[e("input",{type:"checkbox",name:"",id:"",onChange:g=>p(g.target.checked)}),e("label",{htmlFor:"",children:"Efectivo"}),e(ie,{border:"circle",type:"number",name:"",id:"",placeholder:"RD$",onChange:g=>f(g.target.value)})]}),n(R,{columns:"payment",children:[e("input",{type:"checkbox",name:"",id:"",onChange:g=>m(g.target.checked)}),e("label",{htmlFor:"",children:"Tarjeta"}),e(ie,{border:"circle",type:"number",name:"",id:"",placeholder:"RD$",onChange:g=>M(g.target.value)}),e(se,{border:"circle",type:"text",name:"",id:"",placeholder:"no. tarjeta"})]}),n(R,{columns:"payment",children:[e("input",{type:"checkbox",name:"",id:"",onChange:g=>u(g.target.checked)}),e("label",{htmlFor:"",children:"Transferencia"}),e(ie,{border:"circle",type:"number",name:"",id:"",placeholder:"RD$",onChange:g=>L(g.target.value)}),e(se,{border:"circle",type:"text",name:"",id:"",placeholder:"no. transf"})]})]}),n(ge,{gap:"normal",children:[n(R,{columns:"2",borderRadius:"normal",padding:"normal",children:[e("label",{children:"Monto:"}),e("span",{children:B(o)})]}),n(R,{columns:"2",borderRadius:"normal",padding:"normal",children:[e("label",{children:"ITBIS:"}),e("span",{children:B(r)})]})]}),n(ge,{display:"grid",children:[n(R,{columns:"2",bgColor:"black",borderRadius:"normal",fontWeight:"title",children:[e("label",{children:"Total:"}),n("span",{style:{display:"flex",justifyContent:"flex-end"},children:["RD$",B(c)]})]}),n(R,{columns:"2",bgColor:"primary",borderRadius:"normal",fontWeight:"title",children:[e("label",{children:"Cambio:"}),n("span",{style:{display:"flex",justifyContent:"flex-end"},children:["RD$",B(a)]})]})]})]})},Ia=i.div`
     background-color: rgba(226, 225, 225, 0.671);
     padding: 0.6em 0.6em ;
     border-radius: 10px;
     display: grid;
     gap: 0.5em;

     
`,ge=i.div`
    background-color: rgb(236, 236, 236);
    padding: 0.5em 0.5em;
    border-radius: 10px;
    
    ${t=>{switch(t.display){case"flex":return`
                display: flex;
                justify-content: space-between;
                
                gap: 0.5em;
                `;case"grid":return`
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5em;
                `}}}
    ${t=>{switch(t.direction){case"column":return`
                display: flex;
                flex-direction: column;
               
                
                gap: 0.5em;
                `}}}
    ${t=>{switch(t.gap){case"normal":return`
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                
                gap: 0.5em;
                `}}}
   
`,Pa=()=>{const t=te(),o=C(),r=_(nt),c=r.id,a="bills",l=_(me),p=_(Kn),d=()=>{o(Ie())},m=()=>{o(_c()),Tn(a,r,c),t("/app/checkout/receipt"),o(Ie())};return e(s.exports.Fragment,{children:p?e(Yr,{children:n(Zr,{children:[n(ea,{children:[e("h3",{children:"Factura #: 123232345"}),e(F,{color:"error",onClick:d,children:"X"})]}),n(ta,{children:[e(ga,{}),e(va,{}),n(na,{children:[n(oa,{children:[n(R,{columns:"product-list",bgColor:"black",children:[e(ca,{children:e("span",{children:"Descripci\xF3n"})}),e(ia,{children:e("span",{children:"ITBIS"})}),e(la,{children:e("span",{children:"Precio"})})]}),e(ra,{children:l.length>=1?l.map((h,u)=>n(aa,{children:[e(R,{columns:"product-list",children:n("div",{children:[h.amountToBuy," UND"]})}),n(R,{columns:"product-list",children:[e(sa,{children:h.productName}),e(da,{children:B(h.tax.total)}),e(pa,{children:B(h.price.total)})]})]},u)):null}),e(R,{columns:"product-list",bgColor:"black",children:n(ua,{children:["Total de art\xEDculos: ",l.length]})})]}),e(Sa,{})]}),e(ha,{children:e(Qr,{children:e(F,{color:"primary",onClick:m,children:"Imprimir"})})})]})]})}):null})},ka="_Form_akpes_2",Ma="_Group_akpes_12",k={Form:ka,Group:Ma},$a=()=>{const[t,o]=s.exports.useState(),[r,c]=s.exports.useState("");s.exports.useEffect(()=>{je(o)},[]);const a=C(),l=_(Qn),[p,d]=s.exports.useState(""),[m,h]=s.exports.useState(null),[u,f]=s.exports.useState(null);console.log(u);const[M,L]=s.exports.useState(null),[g,U]=s.exports.useState(null),[rt,at]=s.exports.useState(""),[ct,ye]=s.exports.useState(""),it=v=>{v.preventDefault(),document.getElementById("file").click()},lt=async()=>{if(!/.jpg|.jpeg|.png| .webp| .gif/i.exec(u.name))console.log(u.name),ye(e(hc,{text:"Error de archivo (no es una imagen)"}));else{ye(""),Dn(u).then(X=>An(X,p,m,r,g,M,rt));try{return e(Rt,{to:"/app/"})}catch(X){console.error("Error adding document: ",X)}}},st=()=>{a(Gn())};return e(s.exports.Fragment,{children:l?e(Ce,{nameRef:"Agregar Producto",btnSubmitName:"Guardar",close:st,handleSubmit:lt,children:e("div",{className:k.Container,children:n("form",{className:k.Form,children:[n("div",{className:k.Group,children:[e("label",{htmlFor:"",children:"Nombre del producto:"}),e("input",{className:k.Input,type:"text",required:!0,onChange:v=>d(v.target.value)})]}),n("div",{className:k.Group,children:[e("label",{htmlFor:"",children:"Agregar imagen: "}),e("input",{className:k.Input,type:"file",id:"file",onChange:v=>f(v.target.files[0])}),e(F,{onClick:it,children:"Agregar Imagen"})]}),n("div",{className:k.Group,children:[e("label",{htmlFor:"",children:"Costo:"}),e("input",{className:k.Input,type:"number",onChange:v=>h(v.target.value)})]}),n("div",{className:k.Group,children:[e("label",{htmlFor:"",children:"Categoria:"}),n("select",{name:"select",id:"",onChange:v=>L(v.target.value),children:[e("option",{value:"",children:"Select"}),e("option",{value:"Bebida",children:"Bebida"}),e("option",{value:"Alimento",children:"Alimento"}),e("option",{value:"Hogar",children:"Hogar"})]})]}),n("div",{className:k.Group,children:[e("label",{htmlFor:"",children:"Impuesto:"}),n("select",{id:"",onChange:v=>c(v.target.value),children:[e("option",{value:"",children:"Select"}),t.length>=1?t.map(({tax:v},X)=>n("option",{value:JSON.stringify(v),children:["ITBIS ",v.ref]},X)):null]})]}),n("div",{className:k.Group,children:[e("label",{htmlFor:"",children:"Stock"}),e("input",{className:k.Input,type:"number",onChange:v=>U(v.target.value)})]}),n("div",{className:k.Group,children:[e("label",{htmlFor:"",children:"Contenido Neto:"}),e("input",{className:k.Input,type:"text",onChange:v=>at(v.target.value)})]}),n("div",{className:k.Group,children:[e("label",{children:"Precio de Venta: "}),e("label",{children:"RD$ "})]}),ct]})})}):null})},Fa="_Modal_ccswh_2",Ba="_Modal_container_ccswh_16",Da="_modal_header_ccswh_27",Aa="_CrossBtn_ccswh_35",La="_modal_body_ccswh_51",Ta="_modal_footer_ccswh_55",Ra="_Open_ccswh_62",j={Modal:Fa,Modal_container:Ba,modal_header:Da,CrossBtn:Aa,modal_body:La,modal_footer:Ta,Open:Ra},Ce=({children:t,nameRef:o,handleSubmit:r,close:c,btnSubmitName:a})=>{const l=()=>{new Promise(function(p){r()}).then(function(){c()}),console.log("click")};return e("article",{className:`${j.Modal} ${j.Open}`,children:n("div",{className:j.Modal_container,children:[n("div",{className:j.modal_header,children:[e("h3",{children:o}),e("button",{className:j.CrossBtn,onClick:c,children:"X"})]}),e("div",{className:j.modal_body,children:t}),e("div",{className:j.modal_footer,children:e("div",{className:j.Group,children:e(F,{onClick:l,children:a})})})]})})},Oa=()=>{const t=C(),o=_(Yn),[r,c]=s.exports.useState({name:"",lastName:"",address:"",tel:"",email:"",id:Le(4),personalID:""});s.exports.useState("");const[a,l]=s.exports.useState(""),p=h=>{c({...r,[h.target.name]:h.target.value})},d=async()=>{try{const h=q(D,"client",r.id);await de(h,{client:r})}catch(h){console.error("Error adding document: ",h)}},m=()=>{t(zn())};return o?e(Ce,{nameRef:"Agregar Cliente",btnSubmitName:"Guardar",close:m,handleSubmit:d,children:e(Ea,{children:n(Va,{children:[n(K,{children:[e(Q,{id:"nombre",children:"Nombre Completo:"}),e(A,{id:"name",name:"name",onChange:p,placeholder:"Nombre"})]}),n(K,{children:[e(Q,{children:"Identificaci\xF3n"}),e(A,{id:"DocumentType",name:"personalID",onChange:h=>l(h.target.value),placeholder:"RNC / C\xE9dula"})]}),n(K,{span:"2",children:[e(Q,{children:"Direcci\xF3n: "}),e(A,{name:"address",onChange:p,placeholder:"Direcci\xF3n"})]}),n(K,{children:[e(Q,{children:"Tel\xE9fono:"}),e(A,{name:"tel",onChange:p,placeholder:"Tel\xE9fono"})]}),n(K,{children:[e(Q,{children:"Correo:"}),e(A,{name:"email",onChange:p,placeholder:"ejemplo@ejemplo.com"})]})]})})}):null},Ea=i.div`
    padding: 1em;
    `,Va=i.form`
 
    display: grid;
    grid-template-columns: repeat( 2, 1fr);
    flex-wrap: wrap;
    gap: 1em;
    overflow: auto;
 
`,K=i.div`
display: grid;
gap: 1em;


${t=>{switch(t.span){case"2":return`
            grid-column: 2 span;
            label{
                word-wrap: break-word;
            }
            input{
                width: 100%;
            }
           `}}}

`,Q=i.label`
 margin: 0 1em 0 0;
`,ja=()=>{const[t,o]=s.exports.useState(),[r,c]=s.exports.useState(""),[a,l]=s.exports.useState("");s.exports.useState(null),s.exports.useState(null),s.exports.useState(null);const[p,d]=s.exports.useState(null);s.exports.useState(null),s.exports.useState(""),s.exports.useState(""),s.exports.useState(""),s.exports.useEffect(()=>{je(o)},[]);let m={name:String(a),tax:r!==""?JSON.parse(r):null};console.log(m);const{id:h,isOpen:u}=_(Zn),f=C(),M=()=>{const g=Ln(h,m);console.log(g)},L=()=>{f(qn())};return e(s.exports.Fragment,{children:u?e(Ce,{nameRef:"Actualizar Producto",close:L,handleSubmit:M,children:n(za,{children:[n(re,{children:[e("label",{htmlFor:"",children:"Nombre del producto:"}),e("input",{type:"text",required:!0,onChange:g=>l(g.target.value)})]}),n(re,{children:[e("label",{htmlFor:"",children:"Costo: "}),e("input",{type:"text"})]}),n(re,{children:[e("label",{htmlFor:"",children:"Categoria:"}),n("select",{name:"select",id:"",onChange:g=>d(g.target.value),children:[e("option",{value:"",children:"Select"}),e("option",{value:"Bebida",children:"Bebida"}),e("option",{value:"Alimento",children:"Alimento"}),e("option",{value:"Hogar",children:"Hogar"})]})]}),n(re,{children:[e("label",{htmlFor:"",children:"Impuesto:"}),n("select",{id:"",onChange:g=>setTaxe(g.target.value),children:[e("option",{value:"",children:"Select"}),t.length>=1?t.map(({tax:g},U)=>e("option",{value:JSON.stringify(g),children:g.ref},U)):null]})]})]})}):null})},za=i.form`
  
`,re=i.div`
  background-color: var(--White1);
  padding: 1em;
  gap: 2em;
    display: flex;
      
    align-items: center;
    justify-content: center;
    justify-content: space-between;

    &:first-child {
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    }

    &:last-child {

      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
    }

    label {
      font-weight: 500;
      white-space: nowrap;
      color: rgb(54, 54, 54);
    }

    input[type="text"],
    input[type="number"] {
      width: 100%;
      margin: 0;
      padding: 0.4em 1em;
      border: 1px solid rgba(0, 0, 0, 0.155);
      border-radius: 100px;
      &:focus{
          outline: none;
      }
    }

    input[type="file"] {
      display: none;
    }
   
`,Ha=()=>n(s.exports.Fragment,{children:[e(Oa,{}),e($a,{}),e(Pa,{}),e(ja,{})]}),Ga="_Counter_container_6gco6_1",Ua="_Couter_button_6gco6_12",Wa="_CounterDisplay_6gco6_21",ae={Counter_container:Ga,Couter_button:Ua,CounterDisplay:Wa},qa=({amountToBuy:t,stock:o,id:r})=>{const c=C(),[a,l]=s.exports.useState({id:r,value:1});s.exports.useEffect(()=>{c(wc(a)),c(le()),c(Z()),c(z())},[a]);const p=()=>{l({id:r,value:Number(a.value+1)}),c(Nc(a)),c(le()),c(Z()),c(z())},d=()=>{l({id:r,value:Number(a.value-1)}),c(Sc(a)),a.value===1&&(c(tt(r)),l({id:r,value:1}),c(le()),c(Z()),c(z()))};return n("div",{className:`${ae.Counter_container}`,children:[e("button",{className:ae.Couter_button,onClick:d,children:"-"}),e("input",{className:ae.CounterDisplay,type:"number",name:"",id:"",value:a.value.toFixed(),onChange:m=>l({id:r,value:Number(m.target.value)})}),e("button",{className:ae.Couter_button,onClick:p,children:"+"})]})},Ja="_ComponentContainer_tzxfm_1",Xa="_Items_tzxfm_12",Y={ComponentContainer:Ja,Items:Xa},Ka=()=>e("div",{className:Y.ComponentContainer,children:n("ul",{className:Y.Items,children:[e("li",{className:Y.Item,children:e(F,{children:"Displays"})}),e("li",{className:Y.Item,children:e(F,{children:"Productos"})}),e("li",{className:Y.Item,children:e(F,{children:"Factura"})})]})});i.div`

`;i.div`
    padding: 2em;
`;i.div`
  
`;i.div`
    
`;const Qa=()=>{const t=C(),o=()=>{t(Xn())};return e(s.exports.Fragment,{children:e(Ya,{onClick:o,children:e("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 320 512",children:e("path",{d:"M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"})})})})},Ya=i("div")`
    width: 32px;
    height: 32px;
    padding: 0.2em;
    display: flex;
    justify-content: center;
    align-items: center;      
    border-radius: 100px;
    background-color: white;
    
    border: 1px solid rgba(0, 0, 0, 0.307);
    svg{
        width: 1em;
        fill: rgba(31, 31, 31, 0.72);
        
    }
`;i.div`
    width: 1.5em;
    height: 32px;
    padding: 0.2em;
    display: flex;
    justify-content: center;
    align-items: center;      
    border: none;
    svg{
        width: 1em;
        fill: rgba(31, 31, 31, 0.72);
        margin-left: 2px;
    }
`;const Ye=t=>{const o=C(),r=()=>{o(jn())};return e(s.exports.Fragment,{children:e(Za,{onClick:r,children:e("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 640 512",children:e("path",{d:"M352 128c0 70.7-57.3 128-128 128s-128-57.3-128-128S153.3 0 224 0s128 57.3 128 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"})})})})},Za=i.div`
    width: 32px;
    height: 32px;
    padding: 0.2em;
    display: flex;
    justify-content: center;
    align-items: center;      
    border-radius: 100px;
    background-color: white;
    
    border: 1px solid rgba(0, 0, 0, 0.307);
    svg{
        width: 1.5em;
        fill: rgba(31, 31, 31, 0.72);
        margin-left: 2px;
    }
`,ec=()=>{const t=C();return e(F,{onClick:()=>{t(Hn())},children:"Crear Producto"})},tc=()=>{const t=C(),o=()=>{t(Ic())};return e(s.exports.Fragment,{children:e(nc,{onClick:o,children:e("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512",children:e("path",{d:"M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"})})})})},nc=i("div")`
    width: 32px;
    height: 32px;
    padding: 0.2em;
    display: flex;
    justify-content: center;
    align-items: center;      
    border-radius: 100px;
    background-color: white;
    
    border: 1px solid rgba(0, 0, 0, 0.307);
    svg{
        width: 1em;
        fill: rgba(31, 31, 31, 0.72);
        
    }
`,oc=i.div`
    border: 1px solid rgba(0, 0, 0, 0.300);
   
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.220);
    border-radius: 6px;
    background-color: rgb(255, 255, 255);
    overflow: hidden;
    display: grid;
    gap: 1em;
    align-items: center;
    align-content: center;
    
${t=>{switch(t.container){case"row":return`
                grid-template-columns: min-content 1fr;
                height: 100px;
                overflow: hidden;
                
                `;default:return`
            
          `}}}
`,rc=i.div`
 
    overflow: hidden;
;
    ${t=>{switch(t.type){case"row":return`
                
                height: 100px;
                width: 100px;
           

                `;case"normal":return`

                `;default:return`
            
          `}}}
    
`,ac=i.img`
    src: url(${t=>t.src});
    width: 100%;
    height: 100%;
  
    overflow: hidden;
    object-fit: cover;

    ${t=>{switch(t.type){case"row":return`
             
                height: 100%;

           

                `;case"normal":return`

                `;default:return`
            
          `}}}
`,cc=i.div`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    grid-template-columns: min-content;
    grid-template-rows: min-content min-content;
    
    
    
    `,ic=i.div`
    padding: 0.6em 0.4em 0;
    
`,lc=i.h5`
    color: rgb(66, 66, 66);
    width: 165px;
    line-height: 1pc;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;  
    //white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
`;i.div`
    height: 50px;
    width: 50px;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
  
`;const sc=i.footer`

`;i.div`
`;const dc=i.div`
    height: auto;
    background-color: #d8d8d8;
    font-weight: 500;
    padding: 0.2em 0.8em;
    border-top-left-radius: 10px;
    color: #424242;
    //border-radius: 50px;
    
    
`,_e=({title:t,image:o,view:r,price:c,product:a})=>{const l=C();_(me);const p=d=>{l(fc(d))};return n(oc,{container:"row",onClick:()=>p(a),children:[e(rc,{type:"row",children:e(ac,{type:"row",src:o,row:!0})}),n(cc,{type:"row",children:[e(ic,{children:e(lc,{children:t})}),e(sc,{children:e(dc,{children:n("span",{children:["RD$",B(c)]})})})]})]})},pc=i.li`
    list-style: none;
    border: 1px solid #00000073;
    padding: 0.4em 0;
    margin: 0;
    text-align: center;
    font-weight: 600;
    border-radius: 10px;
    background-color: white;
   
`,Ze=({name:t,lastName:o,tel:r,address:c,client:a,searchData:l})=>{const p=C();_(nt);const d=m=>{l.setSearchData(""),p(xc(m))};return n(pc,{onClick:()=>d(a),children:[t," ",o]})},xe=i("div")`
    position: relative;
    display: grid; 
    
    gap: 0.50em;
  

    ${t=>{switch(t.columns){case"1":return`
                grid-template-columns:  1fr;
                `;case"2":return`
            grid-template-columns: repeat(2, 1fr);

          `;case"3":return`
            grid-template-columns: repeat(3, 1fr);
            `;case"4":return`
            @media (max-width: 4000px) {
                grid-template-columns: repeat(6, 1fr)
            }
            @media (max-width: 2000px) {
                grid-template-columns: repeat(4, 1fr)
            }
            @media (max-width: 1400px) {
                grid-template-columns: repeat(3, 1fr)
            }
            @media (max-width: 1200px) {
                grid-template-columns: repeat(2, 1fr)
            }
            @media (max-width: 940px) {
                grid-template-columns: repeat(1, 1fr)
            }
            @media (max-width: 800px) {
                grid-template-columns: repeat(2, 1fr)
            }
            @media (max-width: 580px) {
                grid-template-columns: repeat(1, 1fr)
            }

            
            `;default:return`
            
          `}}}

`,uc="_Danger_1qlck_1",mc={Danger:uc},hc=t=>e(s.exports.Fragment,{children:e("label",{htmlFor:"",className:mc.Danger,children:t.text})}),gc={id:pe(),date:{},client:null,products:[],delivery:{status:!1,value:0},cashPaymentMethod:{status:!1,value:0},cardPaymentMethod:{status:!1,value:0},transferPaymentMethod:{status:!1,value:0},totalPurchaseWithoutTaxes:{value:0},totalTaxes:{value:0},totalPurchase:{value:0},change:{value:0}},et=ee({name:"factura",initialState:gc,reducers:{getDate:t=>{t.date=new Date},addClient:(t,o)=>{t.client=o.payload},addDelivery:(t,o)=>{t.delivery.value=o.payload},addCashPaymentMethod:(t,o)=>{t.cashPaymentMethod=o.payload},addCardPaymentMethod:(t,o)=>{t.cardPaymentMethod=o.payload},addTransferPaymentMethod:(t,o)=>{t.transferPaymentMethod=o.payload},addProduct:(t,o)=>{t.length===0&&t.products.push(o.payload);const r=t.products.find(c=>c.id===o.payload.id);t.products.length>0&&r?(console.log("listo"),r&&(r.amountToBuy,r.price.total=r.price.unit*r.amountToBuy,r.tax.total=r.tax.unit*r.amountToBuy)):t.products.push(o.payload)},deleteProduct:(t,o)=>{const r=t.products.find(c=>c.id===o.payload);r&&t.products.splice(t.products.indexOf(r),1)},onChangeValueAmountToProduct:(t,o)=>{const{id:r,value:c}=o.payload,a=t.products.find(l=>l.id===r);a&&(a.amountToBuy=Number(c),console.log(Number(c)),a.price.total=Number(a.amountToBuy)*a.price.unit,a.tax.total=a.amountToBuy*a.tax.unit,a.cost.total=a.amountToBuy*a.cost.unit)},addAmountToProduct:(t,o)=>{const{value:r,id:c}=o.payload,a=t.products.find(l=>l.id===c);a&&(a.amountToBuy=Number(r),a.price.total=a.amountToBuy*a.price.unit+a.price.unit,a.tax.total=a.amountToBuy*a.tax.unit+a.tax.unit,a.cost.total=a.amountToBuy*a.cost.unit+a.cost.unit)},diminishAmountToProduct:(t,o)=>{const{id:r,value:c}=o.payload,a=t.products.find(l=>l.id===r);a&&(a.amountToBuy=Number(c),a.price.total=a.amountToBuy*a.price.unit-a.price.unit)},CancelShipping:t=>{t.client=null,t.products=[],t.change.value=0,t.delivery={status:!1,value:0}},totalTaxes:t=>{const r=t.products.reduce((c,a)=>c+a.tax.total,0);t.totalTaxes.value=r},setChange:t=>{const o=t.totalPurchase.value,r=Number(t.cashPaymentMethod.value),c=Number(t.cardPaymentMethod.value),a=Number(t.transferPaymentMethod.value),l=r+c+a-o;t.cashPaymentMethod.status===!0&&(t.change.value=l),t.cashPaymentMethod.status===!1&&(t.change.value=0)},totalPurchaseWithoutTaxes:t=>{const r=t.products.reduce((c,a)=>c+a.cost.total,0);t.totalPurchaseWithoutTaxes.value=r},totalPurchase:t=>{const o=t.totalTaxes.value,r=t.delivery.value,c=t.products.reduce((a,l)=>a+l.cost.total,0);t.totalPurchase.value=o+Number(r)+c}}}),{getDate:_c,addClient:xc,addProduct:fc,addDelivery:bc,addCashPaymentMethod:Cc,addCardPaymentMethod:yc,addTransferPaymentMethod:vc,deleteProduct:tt,onChangeValueAmountToProduct:wc,addAmountToProduct:Nc,diminishAmountToProduct:Sc,CancelShipping:Ic,totalPurchaseWithoutTaxes:Pc,totalTaxes:le,totalPurchase:Z,setChange:z}=et.actions,me=t=>t.cart.products,nt=t=>t.cart,ot=t=>t.cart.client,kc=t=>t.cart.totalPurchaseWithoutTaxes.value,Mc=t=>t.cart.totalTaxes.value,$c=t=>t.cart.totalPurchase.value,Fc=t=>t.cart.change.value,Bc=et.reducer,Dc=()=>{const[t,o]=s.exports.useState("");let r={id:pe(),name:t};return console.log(r),n(Ac,{children:[e(Lc,{children:n(Oc,{children:[e("label",{htmlFor:"",children:"Nombre:"}),e(A,{name:"name",placeholder:"Nombre de la Categor\xEDa",onChange:a=>o(a.target.value),value:t})]})}),e(Tc,{children:e(Rc,{onClick:a=>{Ge("categorys",r,r.id),a.preventDefault(),console.log("click"),o("")},children:"Guardar"})})]})};i.div`
   // background-color: rgb(200, 209, 221);
 
`;const Ac=i.div`
    background-color: rgb(218, 216, 216);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.150);
    padding: 1em;
    display: grid;
    width: 100%;
    
    gap: 1em;
    border-radius: 10px;
`,Lc=i.form`
    display: grid;
    gap: 0.8em;
`,Tc=i.footer`
    display: grid;
    justify-items: right;
`,Rc=i.button`
    display: flex;
    height: 1.8em;
    align-items: center;
    background-color: rgb(66,165,245);
    gap: 0.4em;
    color: #e6e6e6;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 100px;
    padding: 0 0.6em;
    font-weight: 650;
    svg{
        width: 1em;
        fill: #313131;
    }
    span{
        font-weight: 500;
    }


`,Oc=i.div`
    display: grid;
    gap: 0.4em;
    grid-template-columns: 1fr;
    background-color: rgb(230, 230, 230);
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 10px;
    padding: 0.4em 0.6em;
    label{
        color: #646464;
        font-weight: 600;
    }

`,Ec=()=>{const[t,o]=s.exports.useState([]);return s.exports.useEffect(()=>{He(o)},[]),console.log(t),n(s.exports.Fragment,{children:[e(J,{}),e(Vc,{children:n(jc,{children:[n(zc,{children:[e(De,{children:e("h2",{children:"Categor\xEDas"})}),e(De,{children:n(qc,{to:"/app/category/add",children:[e("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512",children:e("path",{d:"M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"})}),e("span",{children:"Nueva Categor\xEDa"})]})})]}),n(Hc,{children:[n(Gc,{children:[e(Uc,{children:n(Be,{col:"3",children:[e(ce,{children:"Nombre"}),e(ce,{children:"Acci\xF3n"})]})}),e(Wc,{children:t.length>0?t.map(({category:r},c)=>n(Be,{col:"3",children:[e(ce,{children:r.name}),e(ce,{children:e("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 512 512",children:e("path",{d:"M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.8 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"})})})]},c)):null})]}),e(Dc,{})]})]})})]})},Vc=i.div`
    display: flex;
    justify-content: center;
    width: 100%;
`,jc=i.div`
width: 100%;
max-width: 900px;

`,zc=i.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2em;
    height: 4em;
    h2{
        margin: 0;
    }
`,Hc=i.div` 
    padding: 0.4em;
    display: grid;
    grid-template-columns: 1fr 0.5fr;
    width: 100%;
    gap: 1em;
    align-items: flex-start;
`,Gc=i.div`
    background-color: rgb(218,216,216);
    width: 100%;
    padding: 0.4em;
    border-radius: 10px;
    display: grid;
    gap: 0.4em;
`,Uc=i.div`
    display: grid;
    align-items: center;
    align-content: center;
    background-color: white;
    height: 3em;
    border-radius: 10px;
    font-weight: 600;
`,Wc=i.div`
    display: grid;
    align-items: flex-start;
    align-content: flex-start;
    gap: 0.2em;
    border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.100);
    min-height: 300px;
    padding: 0.2em;
    `,Be=i.div`
    height: 3em;
    display: grid;
    grid-template-columns: 3fr 1fr;
    padding: 0 0.6em;
    background-color: rgb(230,230,230);
    border-radius: 10px;
    border: 1px;
    
    align-content: center;
    gap: 1em;
    
    ${t=>{switch(t.col){case"2":return`
                grid-template-columns:  repeat(2, 1fr);
                `}}}
  
   
    
    
`,ce=i.div`
    display: grid;
    align-items: center;
    &:nth-child(2){
        justify-items: right;
        justify-content: right;
    }
    svg{
        width: 1.2em;
    }
`,qc=i(O)`
    display: flex;
    height: 1.8em;
    align-items: center;
    gap: 0.4em;
    color: #3d3d3d;
    border: 1px solid rgba(0, 0, 0, 0.100);
    border-radius: 100px;
    padding: 0 0.6em;
    svg{
        width: 1em;
        fill: #313131;
    }
    span{
        font-weight: 500;
    }


`,De=i.div`
    
`;function Jc(){const t=C(),o=_(ue);_(me);const r=_(c=>c.cart);return s.exports.useEffect(()=>{Ae(ne,c=>{if(c){const{email:a,uid:l,displayName:p}=c;t(Re({email:a,uid:l,displayName:p}))}else t(Oe())})},[]),o===!1?e("h2",{children:"Loading"}):e(s.exports.Fragment,{children:n(mt,{children:[e(Ha,{}),n(Ot,{children:[e(N,{exact:!0,path:"/register",element:e(Ro,{})}),e(N,{exact:!0,path:"/login",element:e(go,{})}),e(N,{exact:!0,path:"/",element:e(Oo,{})}),e(N,{exact:!0,path:"*",element:e(_o,{})}),e(N,{exact:!0,path:"/app/compra",element:e(V,{children:e(we,{})})}),e(N,{exact:!0,path:"/app/checkout/receipt",element:e(V,{children:e(bt,{style:{width:"100%",height:"99vh"},children:e(Vo,{data:r})})})}),e(N,{path:"/app/order/*",children:e(N,{path:"orders",element:e(ur,{})})}),n(N,{path:"/app/contact/*",element:e(Eo,{}),children:[e(N,{path:"cliente",element:e(we,{})}),e(N,{path:"proveedor",element:e("h2",{children:"Proveedor"})})]}),e(N,{exact:!0,path:"/app/venta",children:e(N,{path:":displayID",element:e(V,{children:e(To,{})})})}),e(N,{exact:!0,path:"/app/",element:e(V,{children:e(bn,{})})}),e(N,{exact:!0,path:"/app/category",element:e(V,{children:e(Ec,{})})}),e(N,{exact:!0,path:"/app/category/add",element:e(V,{children:e(cr,{})})}),e(N,{exact:!0,path:"/app/inventario",element:e(V,{children:e(no,{})})}),e(N,{exact:!0,path:"/app/registro",element:e(V,{children:e(xo,{})})})]})]})})}const Xc={search:""},Kc=ee({name:"search",initialState:Xc,reducers:{setSearchData:(t,o)=>t.search=o.payload}}),Qc=Kc.reducer,Yc=gt({reducer:{user:Vt,search:Qc,cart:Bc,modal:to,category:Bo}}),Zc=pt.createRoot(document.getElementById("root"));Zc.render(e(dt.StrictMode,{children:e(ht,{store:Yc,children:e(Jc,{})})}));
