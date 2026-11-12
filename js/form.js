/* Formulário próprio: envia as respostas para o Google Forms do Capítulo. */
(function(){
"use strict";
var C=SITE_CONFIG,NS="http://www.w3.org/2000/svg";
var T=[{id:"suggestion",label:"Sugestão",desc:"Ideias e propostas de atividades",icon:"#i-bulb"},{id:"question",label:"Dúvida",desc:"Pergunte sobre o Capítulo",icon:"#i-help"},{id:"complaint",label:"Reclamação",desc:"Conte o que precisa melhorar",icon:"#i-alert"}];
function el(t,a,x){var e=document.createElement(t);for(var k in a||{})e.setAttribute(k,a[k]);if(x!=null)e.textContent=x;return e}
function ent(v){v=String(v||"").trim();return /^\d+$/.test(v)?"entry."+v:/^entry\.\d+$/.test(v)?v:""}
function types(){var e=C.formEntries||{};return T.filter(function(t){return ent(e[t.id])})}
function action(){var u=C.googleFormsUrl||"";return /^https:\/\/docs\.google\.com\/forms\/.+\/viewform/.test(u)?u.replace(/\/viewform.*$/,"/formResponse"):""}
function icon(id){var s=document.createElementNS(NS,"svg"),u=document.createElementNS(NS,"use");s.setAttribute("class","ic");s.setAttribute("aria-hidden","true");u.setAttribute("href",id);s.appendChild(u);return s}

function init(box){
  box.classList.add("custom");var ty=types(),form=el("form",{novalidate:""});
  var fs=el("fieldset",{"class":"types"});fs.appendChild(el("legend",0,"Sobre o que você quer falar?"));
  ty.forEach(function(t,i){var l=el("label",{"class":"type"}),r=el("input",{type:"radio",name:"tipo",value:t.id});if(i===0)r.checked=true;
    var tile=el("span",{"class":"tile"});tile.appendChild(icon(t.icon));l.appendChild(r);l.appendChild(tile);l.appendChild(el("b",0,t.label));l.appendChild(el("small",0,t.desc));fs.appendChild(l)});
  var lb=el("label",{"for":"fm-msg","class":"flabel"},"Sua mensagem"),ta=el("textarea",{id:"fm-msg",rows:"6",maxlength:"2000",placeholder:"Escreva aqui com calma. Quanto mais claro, mais fácil para a gestão ajudar.","aria-describedby":"fm-cnt fm-st"});
  var cnt=el("span",{id:"fm-cnt","class":"note"},"0 / 2000"),hp=el("input",{type:"text",name:"site",tabindex:"-1",autocomplete:"off","aria-hidden":"true","class":"hp"});
  var btn=el("button",{type:"submit","class":"btn pri"},"Enviar mensagem"),st=el("p",{id:"fm-st",role:"status","class":"fstatus"});
  var row=el("div",{"class":"frow"});row.appendChild(btn);row.appendChild(st);
  [fs,lb,ta,cnt,hp,row].forEach(function(x){form.appendChild(x)});box.appendChild(form);
  ta.addEventListener("input",function(){cnt.textContent=ta.value.length+" / 2000";ta.classList.remove("bad");if(st.className.indexOf("err")>-1){st.textContent="";st.className="fstatus"}});

  form.addEventListener("submit",function(e){
    e.preventDefault();var txt=ta.value.trim(),sel=form.querySelector("input[name=tipo]:checked");st.className="fstatus";
    if(hp.value)return done();
    if(txt.length<5){ta.classList.add("bad");st.textContent="Escreva pelo menos algumas palavras antes de enviar.";st.className="fstatus err";ta.focus();return}
    var last=0;try{last=+localStorage.getItem("f559")||0}catch(x){}
    if(Date.now()-last<30000){st.textContent="Aguarde alguns segundos antes de enviar outra mensagem.";st.className="fstatus err";return}
    var body=new URLSearchParams();body.append(ent((C.formEntries||{})[sel.value]),txt);
    btn.disabled=true;btn.textContent="Enviando…";
    fetch(action(),{method:"POST",mode:"no-cors",body:body}).then(function(){try{localStorage.setItem("f559",String(Date.now()))}catch(x){}done()})
    .catch(function(){btn.disabled=false;btn.textContent="Enviar mensagem";st.textContent="Não foi possível enviar agora. Verifique a internet e tente de novo, ou use o formulário do Google.";st.className="fstatus err"});
  });
  function done(){box.textContent="";var d=el("div",{"class":"done",role:"status"});
    var s=document.createElementNS(NS,"svg");s.setAttribute("viewBox","0 0 52 52");s.setAttribute("class","check");s.setAttribute("aria-hidden","true");
    var c=document.createElementNS(NS,"circle"),p=document.createElementNS(NS,"path");c.setAttribute("cx","26");c.setAttribute("cy","26");c.setAttribute("r","24");p.setAttribute("d","M14 27l8 8 16-17");s.appendChild(c);s.appendChild(p);
    d.appendChild(s);d.appendChild(el("h3",0,"Mensagem enviada"));d.appendChild(el("p",{"class":"muted"},"Obrigado por falar com a gestão. Sua mensagem foi enviada ao formulário do Capítulo."));
    var again=el("button",{type:"button","class":"btn sec"},"Enviar outra mensagem");again.addEventListener("click",function(){box.textContent="";box.classList.remove("custom");init(box)});d.appendChild(again);box.appendChild(d)}
}
window.Form={enabled:function(){return !!action()&&types().length>0},init:init};
})();
