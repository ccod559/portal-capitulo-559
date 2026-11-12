(function(){
"use strict";
var C=SITE_CONFIG,$=function(s){return document.querySelector(s)};
function ok(u){return typeof u==="string"&&/^https:\/\//.test(u)}
function el(t,a,x){var e=document.createElement(t);for(var k in a||{})e.setAttribute(k,a[k]);if(x)e.textContent=x;return e}
function empty(t,m){var d=el("div",{"class":"empty"});d.appendChild(el("b",0,t));d.appendChild(el("span",0,m));return d}
function frame(box,src,title,h){var w=el("div",{"class":"fw"}),s=el("div",{"class":"skel"},"Carregando…"),f=el("iframe",{src:src,title:title,loading:"lazy"});if(h)f.style.height=h;
  f.addEventListener("load",function(){s.remove()});setTimeout(function(){if(s.parentNode)s.textContent="Demorou? Use o botão para abrir direto no Google."},12000);w.appendChild(s);w.appendChild(f);box.appendChild(w)}

/* textos da identificação (vêm do config.js) */
var I=C.site||{},T={name:I.name,number:I.number,order:I.order,intro:I.intro,city:I.city,place:[I.city,I.state].filter(Boolean).join(", ")};
document.querySelectorAll("[data-cfg]").forEach(function(n){var v=T[n.getAttribute("data-cfg")];if(v)n.textContent=v});
if(I.name&&I.number)document.title=I.name+" nº "+I.number+(I.order?" — "+I.order:"");

/* tema claro/escuro */
var root=document.documentElement,tb=$("#theme"),tc=$('meta[name="theme-color"]');
function theme(d){root.classList.toggle("dark",d);tb.firstElementChild.firstElementChild.setAttribute("href",d?"#i-sun":"#i-moon");if(tc)tc.setAttribute("content",d?"#150a0c":"#7a0c14");try{localStorage.setItem("t559",d?"d":"l")}catch(e){}}
theme(root.classList.contains("dark"));
tb.addEventListener("click",function(){theme(!root.classList.contains("dark"))});

/* menu */
var bg=$(".burger"),mn=$("#menu"),links=[].slice.call(mn.querySelectorAll("a"));
function closeMenu(){mn.classList.remove("open");bg.setAttribute("aria-expanded","false")}
bg.addEventListener("click",function(){var o=mn.classList.toggle("open");bg.setAttribute("aria-expanded",o)});
mn.addEventListener("click",function(e){if(e.target.tagName==="A")closeMenu()});
document.addEventListener("click",function(e){if(mn.classList.contains("open")&&!mn.contains(e.target)&&!bg.contains(e.target))closeMenu()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&mn.classList.contains("open")){closeMenu();bg.focus()}});

/* entrada suave das seções e destaque do item de menu */
if("IntersectionObserver" in window){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.08});
  document.querySelectorAll(".rv").forEach(function(n){io.observe(n)});
  var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)links.forEach(function(a){a.classList.toggle("on",a.getAttribute("href")==="#"+e.target.id)})})},{rootMargin:"-45% 0px -50% 0px"});
  document.querySelectorAll("main section[id]").forEach(function(n){so.observe(n)});
}else document.querySelectorAll(".rv").forEach(function(n){n.classList.add("in")});

/* calendário */
var cb=$("#cal-box"),op=$("#cal-open");
var pu=window.Cal&&Cal.publicUrl?Cal.publicUrl():"";if(ok(pu)){op.href=pu;op.hidden=false}
if(window.Cal&&Cal.enabled())Cal.init(cb);
else if(ok(C.calendarEmbedUrl))frame(cb,C.calendarEmbedUrl,"Calendário de atividades do Capítulo Caetiteense nº 559");
else cb.appendChild(empty("Calendário ainda não configurado","A gestão precisa informar o endereço do Google Agenda em js/config.js."));

/* Fale com a Gestão */
var fb=$("#form-box");
if(window.Form&&Form.enabled()){
  Form.init(fb);
  if(ok(C.googleFormsUrl)){var n=$(".formnote");n.appendChild(document.createTextNode(" Prefere o formulário do Google? "));n.appendChild(el("a",{href:C.googleFormsUrl,target:"_blank",rel:"noopener noreferrer"},"Abrir no Google Forms"));n.appendChild(document.createTextNode("."))}
}else{
  if(ok(C.googleFormsUrl)){var a=el("div",{"class":"actions"});a.appendChild(el("a",{"class":"btn pri",href:C.googleFormsUrl,target:"_blank",rel:"noopener noreferrer"},"Abrir formulário em nova aba"));fb.appendChild(a)}
  if(ok(C.googleFormsEmbedUrl))frame(fb,C.googleFormsEmbedUrl,"Formulário Fale com a Gestão","760px");
  else if(!ok(C.googleFormsUrl))fb.appendChild(empty("Canal ainda não configurado","A gestão precisa informar o link do Google Forms em js/config.js."));
}
})();
