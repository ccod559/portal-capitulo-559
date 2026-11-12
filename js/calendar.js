/* Calendário próprio: lê o Google Agenda (somente leitura) e mostra uma grade mensal
   com os compromissos do dia selecionado ou, sem seleção, os próximos eventos.
   Guarda os últimos dados no aparelho (cache) e atualiza a cada "refreshMinutes". */
(function(){
"use strict";
var C=SITE_CONFIG,TZ=C.timezone||"America/Bahia",EVERY=Math.max(1,+C.refreshMinutes||5),
MN=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"],
DW=["dom","seg","ter","qua","qui","sex","sáb"],DWF=["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"],
cats=C.categories||[],S={y:0,m:0,sel:null,month:[],up:[],st:{month:"load",up:"load"},upd:null,ct:0},seq={month:0,up:0},R={},tried=0;
try{new Intl.DateTimeFormat("pt-BR",{timeZone:TZ})}catch(e){TZ=undefined}
var DF=new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"});

function el(t,a,x){var e=document.createElement(t);for(var k in a||{})e.setAttribute(k,a[k]);if(x!=null)e.textContent=x;return e}
function ok(u){return typeof u==="string"&&/^https:\/\//.test(u)}
function pad(n){return n<10?"0"+n:""+n}
/* datas como texto AAAA-MM-DD no fuso do Capítulo; assim não dependem do fuso do aparelho */
function dkey(d){var p={};DF.formatToParts(d).forEach(function(x){p[x.type]=x.value});return p.year+"-"+p.month+"-"+p.day}
function addDays(k,n){return new Date(Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8)+n)).toISOString().slice(0,10)}
function dow(k){return new Date(k+"T00:00:00Z").getUTCDay()}
function tm(d){return d.toLocaleTimeString("pt-BR",{timeZone:TZ,hour:"2-digit",minute:"2-digit"})}
function lab(k){return(+k.slice(8))+" de "+MN[+k.slice(5,7)-1]}
function labY(k){return lab(k)+" de "+k.slice(0,4)}
function cat(ev){var i,j,s=(ev.title||"").toLowerCase();if(ev.colorId)for(i=0;i<cats.length;i++)if((cats[i].colorIds||[]).indexOf(ev.colorId)>-1)return cats[i];for(i=0;i<cats.length;i++)for(j=0;j<(cats[i].keys||[]).length;j++)if(s.indexOf(cats[i].keys[j])>-1)return cats[i];return cats[cats.length-1]||{name:"Outros",color:"#718096",keys:[]}}
function calId(){var m=/[?&]src=([^&]+)/.exec(C.calendarEmbedUrl||"");return m?decodeURIComponent(m[1]):""}
function lum(h){var a=rgb(h);return(.299*a[0]+.587*a[1]+.114*a[2])/255}
/* no tema escuro, clareia as cores muito escuras (ex.: azul-marinho) para não sumirem no fundo */
function hex(c){var h=c.color;if(!document.documentElement.classList.contains("dark")||!/^#[0-9a-f]{6}$/i.test(h)||lum(h)>=.35)return h;
  return"#"+rgb(h).map(function(v){var n=Math.round(v*.62+255*.38).toString(16);return n.length<2?"0"+n:n}).join("")}
function pubUrl(){if(ok(C.calendarPublicUrl))return C.calendarPublicUrl;var i=calId();try{return i?"https://calendar.google.com/calendar/u/0?cid="+btoa(i):""}catch(e){return""}}
function reduced(){return window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches}

/* evento bruto (do Google) -> evento do site */
function norm(r){
  var ev={title:r.title||"(sem título)",allDay:!!r.allDay,location:r.location||"",description:r.description||"",link:r.link||"",colorId:String(r.colorId||"")};
  if(ev.allDay){
    var s=r.startDate||dkey(new Date(r.start)),e=r.endDate?addDays(r.endDate,-1):(r.end&&!r.startDate?addDays(dkey(new Date(r.end)),-1):s);
    if(!/^\d{4}-\d\d-\d\d$/.test(s))return null;
    ev.sk=s;ev.ek=e<s?s:e;ev.ts=Date.parse(s+"T00:00:00Z")}
  else{
    var a=new Date(r.start),b=new Date(r.end);if(isNaN(a))return null;if(isNaN(b)||b<a)b=a;
    ev.start=a;ev.end=b;ev.sk=dkey(a);ev.ek=dkey(new Date(Math.max(b-1,a)));ev.ts=+a}
  return ev}
function past(ev){return ev.allDay?ev.ek<dkey(new Date()):ev.end<new Date()}
function when(ev){
  if(ev.allDay)return ev.sk===ev.ek?"Dia inteiro":"Dia inteiro · "+lab(ev.sk)+" a "+lab(ev.ek);
  return ev.sk===ev.ek?tm(ev.start)+" às "+tm(ev.end):lab(ev.sk)+" "+tm(ev.start)+" – "+lab(ev.ek)+" "+tm(ev.end)}
function whenFull(ev){return ev.allDay||ev.sk!==ev.ek?when(ev):labY(ev.sk)+" · "+when(ev)}
function tag(c){var t=el("span",{"class":"ctag"},c.name);t.style.setProperty("--c",hex(c));return t}

/* busca no Google */
function jget(u){var ac=window.AbortController?new AbortController():null,t=setTimeout(function(){if(ac)ac.abort()},15000);
  return fetch(u,ac?{signal:ac.signal,cache:"no-store"}:{cache:"no-store"}).then(function(r){clearTimeout(t);if(!r.ok)throw new Error("http");return r.json()},function(e){clearTimeout(t);throw e})}
function fetchRaw(f,t){
  if(ok(C.calendarFeedUrl))return jget(C.calendarFeedUrl+"?from="+encodeURIComponent(f.toISOString())+"&to="+encodeURIComponent(t.toISOString())).then(function(l){if(!Array.isArray(l))throw new Error("formato");return l});
  var u="https://www.googleapis.com/calendar/v3/calendars/"+encodeURIComponent(calId())+"/events?singleEvents=true&orderBy=startTime&maxResults=250&timeZone="+encodeURIComponent(TZ||"UTC")+"&timeMin="+encodeURIComponent(f.toISOString())+"&timeMax="+encodeURIComponent(t.toISOString())+"&key="+encodeURIComponent(C.calendarApiKey);
  return jget(u).then(function(j){return(j.items||[]).filter(function(e){return e.status!=="cancelled"&&e.start}).map(function(e){var ad=!!e.start.date;
    return{title:e.summary,allDay:ad,start:e.start.dateTime||e.start.date,end:(e.end&&(e.end.dateTime||e.end.date))||"",startDate:ad?e.start.date:"",endDate:ad&&e.end?e.end.date:"",location:e.location,description:e.description,link:e.htmlLink,colorId:e.colorId}})})}

/* cache no aparelho (localStorage); falhas de armazenamento são ignoradas */
function cget(k){try{var v=JSON.parse(localStorage.getItem("c559:"+k));return v&&Array.isArray(v.l)?v:null}catch(e){return null}}
function cset(k,l){try{localStorage.setItem("c559:"+k,JSON.stringify({t:Date.now(),l:l}))}catch(e){}}
function prune(){try{for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i);if(k&&k.indexOf("c559:")===0){var v=JSON.parse(localStorage.getItem(k));if(!v||Date.now()-v.t>6048e5)localStorage.removeItem(k)}}}catch(e){}}

/* carregamento: mostra o cache na hora e atualiza em seguida */
function pull(slot,key,f,t,soft){
  var id=++seq[slot];
  if(!soft){var c=cget(key);if(c){S[slot]=c.l.map(norm).filter(Boolean);S.st[slot]="cache";S.ct=c.t}else{S[slot]=[];S.st[slot]="load"}draw()}
  fetchRaw(f,t).then(function(l){if(id!==seq[slot])return;cset(key,l);S[slot]=l.map(norm).filter(Boolean);S.st[slot]="ok";S.upd=new Date();S.ct=Date.now();draw()})
  .catch(function(){if(id!==seq[slot])return;S.st[slot]=S.st[slot]==="load"||S.st[slot]==="err"?"err":"stale";draw()})}
function layout(){var first=S.y+"-"+pad(S.m+1)+"-01",f=dow(first),n=new Date(Date.UTC(S.y,S.m+1,0)).getUTCDate(),rows=Math.ceil((f+n)/7),start=addDays(first,-f);return{start:start,rows:rows,end:addDays(start,rows*7)}}
function loadMonth(soft){var L=layout();pull("month","m"+S.y+"-"+pad(S.m+1),new Date(addDays(L.start,-1)+"T00:00:00Z"),new Date(addDays(L.end,1)+"T00:00:00Z"),soft)}
function loadUp(soft){var t=dkey(new Date());pull("up","up",new Date(addDays(t,-1)+"T00:00:00Z"),new Date(addDays(t,180)+"T00:00:00Z"),soft)}
function refresh(soft){tried=Date.now();loadMonth(soft);loadUp(soft)}
function go(y,m,sel){var ch=y!==S.y||m!==S.m;S.y=y;S.m=m;S.sel=sel||null;if(ch)loadMonth(false);else draw()}

function byDay(){var m={};S.month.forEach(function(ev){var k=ev.sk;for(var n=0;k<=ev.ek&&n<62;n++){(m[k]=m[k]||[]).push(ev);k=addDays(k,1)}});
  for(var k in m)m[k].sort(function(a,b){return(b.allDay-a.allDay)||a.ts-b.ts});return m}

/* ---------- desenho ---------- */
function draw(){drawGrid();drawPanel();drawStatus()}

function drawGrid(){
  var L=layout(),map=byDay(),today=dkey(new Date()),cur=S.y+"-"+pad(S.m+1),g=R.grid,fa=document.activeElement,fk=fa&&g.contains(fa)?fa.getAttribute("data-k"):null;
  g.textContent="";g.className="days"+(S.st.month==="load"?" loading":"");R.title.textContent=MN[S.m]+" de "+S.y;
  var anchor=(S.sel&&S.sel.slice(0,7)===cur)?S.sel:(today.slice(0,7)===cur?today:cur+"-01");
  for(var i=0;i<L.rows*7;i++){
    var k=addDays(L.start,i),evs=map[k]||[],out=k.slice(0,7)!==cur;
    var b=el("button",{type:"button","class":"day"+(out?" out":"")+(k===today?" today":"")+(evs.length?" has":"")+(k===S.sel?" sel":""),"data-k":k,tabindex:k===anchor?"0":"-1","aria-pressed":k===S.sel?"true":"false","aria-label":DWF[dow(k)]+", "+lab(k)+(evs.length?", "+evs.length+(evs.length>1?" atividades":" atividade"):", sem atividades")});
    if(k===today)b.setAttribute("aria-current","date");
    b.appendChild(el("span",{"class":"num"},+k.slice(8)));
    var chips=el("span",{"class":"chips"}),dots=el("span",{"class":"dots"});
    evs.forEach(function(ev,n){var c=cat(ev);if(n<2){var s=el("span",{"class":"ev"},(ev.allDay?"":tm(ev.start)+" ")+ev.title);s.style.setProperty("--c",hex(c));chips.appendChild(s)}if(n<4){var o=el("i");o.style.background=hex(c);dots.appendChild(o)}});
    if(evs.length>2)chips.appendChild(el("span",{"class":"more"},"+"+(evs.length-2)+" mais"));
    b.appendChild(chips);b.appendChild(dots);g.appendChild(b);
  }
  if(fk){var f=g.querySelector('[data-k="'+fk+'"]');if(f)f.focus({preventScroll:true})}
}

function card(ev,showDate){
  var c=cat(ev),it=el("button",{type:"button","class":"item"+(past(ev)?" past":"")}),dt=el("span",{"class":"dt"}),tx=el("span",{"class":"tx"}),w=showDate||!ev.allDay;
  it.style.setProperty("--c",hex(c));
  if(showDate){dt.appendChild(el("b",0,+ev.sk.slice(8)));dt.appendChild(el("small",0,DW[dow(ev.sk)]))}
  else if(ev.allDay){dt.appendChild(el("small",0,"dia"));dt.appendChild(el("small",0,"inteiro"))}
  else dt.appendChild(el("b",{"class":"hr"},tm(ev.start)));
  tx.appendChild(el("b",0,ev.title));tx.appendChild(el("small",0,(showDate?lab(ev.sk)+" · ":"")+(w?when(ev):"")+(ev.location?(w?" · ":"")+ev.location:"")));
  it.appendChild(dt);it.appendChild(tx);it.appendChild(tag(c));it.addEventListener("click",function(){openEvent(ev)});return it}

function drawPanel(){
  var p=R.panel,map=byDay(),st=S.sel?S.st.month:S.st.up;p.textContent="";
  if(S.sel){
    var h=el("div",{"class":"ph"});h.appendChild(el("h4",0,DWF[dow(S.sel)]+", "+labY(S.sel)));
    var bk=el("button",{type:"button","class":"link"},"Ver próximos eventos");bk.addEventListener("click",function(){S.sel=null;draw()});h.appendChild(bk);p.appendChild(h)}
  else p.appendChild(el("h4",0,"Próximos eventos"));
  if(st==="err"){p.appendChild(errBox());return}
  if(st==="load"){p.appendChild(el("p",{"class":"muted"},"Carregando atividades…"));return}
  var list=S.sel?(map[S.sel]||[]):S.up.filter(function(e){return!past(e)}).sort(function(a,b){return a.ts-b.ts}).slice(0,8);
  if(!list.length){p.appendChild(el("p",{"class":"muted"},S.sel?"Nenhuma atividade neste dia.":"Nenhuma atividade futura cadastrada no momento."));return}
  list.forEach(function(ev){p.appendChild(card(ev,!S.sel))})}

function drawStatus(){
  var a=S.st.month,b=S.st.up,t;
  if(a==="stale"||b==="stale")t="Não foi possível atualizar agora. Mostrando dados salvos"+(S.ct?" às "+tm(new Date(S.ct)):"")+".";
  else if(a==="ok"&&b==="ok"&&S.upd)t="Atualizado às "+tm(S.upd)+".";
  else t="Atualizando…";
  R.status.textContent=t+" Mudanças feitas no Google Agenda podem levar alguns minutos para aparecer aqui."}

function errBox(){var d=el("div",{"class":"empty"});d.appendChild(el("b",0,"Não foi possível carregar a agenda agora"));d.appendChild(el("span",0,"Verifique a internet e tente de novo."));
  var b=el("button",{type:"button","class":"btn sec"},"Tentar de novo");b.addEventListener("click",function(){refresh(false)});d.appendChild(b);return d}

/* detalhes do evento */
function plain(h){try{var d=new DOMParser().parseFromString(String(h).replace(/<br\s*\/?>/gi,"\n").replace(/<\/(p|div|li)>/gi,"\n"),"text/html");return(d.body.textContent||"").trim()}catch(e){return String(h)}}
function linkify(box,t){t.split(/(https?:\/\/[^\s<>"]*[^\s<>".,;:!?)])/g).forEach(function(p,i){if(i%2&&ok(p))box.appendChild(el("a",{href:p,target:"_blank",rel:"noopener noreferrer"},p));else if(p)box.appendChild(document.createTextNode(p))})}
function openEvent(ev){
  var db=document.getElementById("dlg-body"),c=cat(ev),b=el("div",{"class":"evb"});db.textContent="";b.style.setProperty("--c",hex(c));
  b.appendChild(tag(c));b.appendChild(el("h2",{id:"dlg-t"},ev.title));b.appendChild(el("p",{"class":"when"},whenFull(ev)));
  if(ev.location)b.appendChild(el("p",{"class":"loc"},"Local: "+ev.location));
  var d=plain(ev.description);if(d){var p=el("p",{"class":"desc"});linkify(p,d);b.appendChild(p)}
  var lk=ok(ev.link)?ev.link:pubUrl();if(lk)b.appendChild(el("a",{href:lk,target:"_blank",rel:"noopener noreferrer"},"Ver no Google Agenda"));
  db.appendChild(b);var d=document.getElementById("dlg");if(d.showModal)d.showModal();else d.setAttribute("open","")}

/* ---------- imagem do mês (para salvar ou compartilhar) ----------
   Desenhada no mesmo estilo do site e no tema (claro/escuro) que a pessoa está usando. */
function cap(t){return t.charAt(0).toUpperCase()+t.slice(1)}
function css(n,d){var v=getComputedStyle(document.documentElement).getPropertyValue(n).trim();return/^#[0-9a-f]{6}$/i.test(v)?v:d}
function rgb(h){var n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]}
function mix(a,b,p){var x=rgb(a),y=rgb(b);return"rgb("+x.map(function(v,i){return Math.round(v*p+y[i]*(1-p))}).join(",")+")"}
function rr(x,X,Y,W,H,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+W,Y,X+W,Y+H,r);x.arcTo(X+W,Y+H,X,Y+H,r);x.arcTo(X,Y+H,X,Y,r);x.arcTo(X,Y,X+W,Y,r);x.closePath()}
function fit(x,t,w){if(x.measureText(t).width<=w)return t;while(t.length>1&&x.measureText(t+"…").width>w)t=t.slice(0,-1);return t+"…"}
function wrap(x,t,w,max){var o=[],l="";t.split(/\s+/).forEach(function(p){var n=l?l+" "+p:p;if(l&&x.measureText(n).width>w){o.push(l);l=p}else l=n});if(l)o.push(l);
  if(o.length>max){o=o.slice(0,max);o[max-1]=fit(x,o[max-1]+"…",w)}return o}
function paint(logo){
  var W=1080,P=44,SC=1.5,L=layout(),map=byDay(),cur=S.y+"-"+pad(S.m+1),I=C.site||{},today=dkey(new Date()),
  K={bg:css("--bg","#f8f5f1"),sf:css("--sf","#ffffff"),sf2:css("--sf2","#faf6f1"),tx:css("--tx","#2a1a1c"),mu:css("--mu","#7a6a6c"),ln:css("--ln","#eadfd4"),pr:css("--pr","#9b0f18"),soft:css("--soft","#fbe8e6"),gold:css("--gold","#c8962e")},
  dark=document.documentElement.classList.contains("dark"),
  SF='"Cormorant Garamond",Georgia,serif',SN='Inter,system-ui,Arial,sans-serif',
  evs=S.month.filter(function(e){return e.ek>=cur+"-01"&&e.sk<=cur+"-31"}).sort(function(a,b){return a.ts-b.ts}),MAXL=26;

  function render(x,H){
    var y=P,i,cw0=W-2*P;
    x.textBaseline="alphabetic";x.textAlign="left";
    x.fillStyle=K.bg;x.fillRect(0,0,W,H);
    var g1=x.createRadialGradient(W*.88,0,0,W*.88,0,520);g1.addColorStop(0,"rgba(200,150,46,.24)");g1.addColorStop(1,"rgba(200,150,46,0)");x.fillStyle=g1;x.fillRect(0,0,W,H);
    var g2=x.createRadialGradient(0,H,0,0,H,620);g2.addColorStop(0,"rgba(155,15,24,"+(dark?".22":".12")+")");g2.addColorStop(1,"rgba(155,15,24,0)");x.fillStyle=g2;x.fillRect(0,0,W,H);

    /* cabeçalho: brasão + nome */
    rr(x,P,y,92,92,26);x.fillStyle=K.soft;x.fill();
    if(logo){var lw=70,lh=lw*logo.height/logo.width;x.drawImage(logo,P+46-lw/2,y+46-lh/2,lw,lh)}
    var tx0=P+92+24,t1=(I.name||"Capítulo")+" ",t2="nº "+(I.number||"");
    x.font="700 56px "+SF;x.fillStyle=K.tx;x.fillText(t1,tx0,y+50);
    var w1=x.measureText(t1).width,w2=x.measureText(t2).width,gr=x.createLinearGradient(tx0+w1,0,tx0+w1+w2,0);gr.addColorStop(0,K.pr);gr.addColorStop(1,K.gold);
    x.fillStyle=gr;x.fillText(t2,tx0+w1,y+50);
    x.font="600 21px "+SN;x.fillStyle=K.mu;x.fillText(fit(x,(I.order||"")+" · "+[I.city,I.state].filter(Boolean).join(", "),W-P-tx0),tx0,y+82);
    y+=92+46;

    /* título do mês */
    x.font="800 48px "+SN;x.fillStyle=K.tx;x.fillText(cap(MN[S.m])+" de "+S.y,P,y+36);
    if(S.upd){x.font="600 19px "+SN;x.fillStyle=K.mu;x.textAlign="right";x.fillText("Atualizado às "+tm(S.upd),W-P,y+34);x.textAlign="left"}
    y+=60;

    /* legenda */
    x.font="600 18px "+SN;var lx=P;
    cats.forEach(function(c){var w=x.measureText(c.name).width+30;if(lx+w>W-P){lx=P;y+=30}
      x.fillStyle=hex(c);x.beginPath();x.arc(lx+6,y+12,6,0,7);x.fill();x.fillStyle=K.mu;x.fillText(c.name,lx+20,y+18);lx+=w+16});
    y+=30+18;

    /* grade do mês */
    var gp=22,gap=8,cw=(cw0-2*gp-6*gap)/7,ch=130,gh=gp+34+L.rows*(ch+gap)-gap+gp;
    x.save();x.shadowColor="rgba(74,10,16,"+(dark?".5":".10")+")";x.shadowBlur=36;x.shadowOffsetY=12;rr(x,P,y,cw0,gh,32);x.fillStyle=K.sf;x.fill();x.restore();
    rr(x,P,y,cw0,gh,32);x.strokeStyle=K.ln;x.lineWidth=1.5;x.stroke();
    var gx=P+gp,gy=y+gp;
    x.font="700 16px "+SN;x.fillStyle=K.mu;x.textAlign="center";
    DW.forEach(function(w,n){x.fillText(w.toUpperCase(),gx+n*(cw+gap)+cw/2,gy+20)});
    gy+=34;
    for(i=0;i<L.rows*7;i++){
      var k=addDays(L.start,i),c=i%7,r=Math.floor(i/7),cx=gx+c*(cw+gap),cy=gy+r*(ch+gap),out=k.slice(0,7)!==cur,ds=map[k]||[],isT=k===today;
      x.globalAlpha=out?.45:1;
      rr(x,cx,cy,cw,ch,18);x.fillStyle=ds.length?K.sf:K.sf2;x.fill();x.lineWidth=isT?2.5:1.5;x.strokeStyle=isT?K.pr:K.ln;x.stroke();
      x.beginPath();x.arc(cx+26,cy+26,16,0,7);
      if(isT){x.fillStyle=K.sf2;x.fill();x.lineWidth=2.5;x.strokeStyle=K.pr;x.stroke()}
      x.fillStyle=K.tx;x.font="700 18px "+SN;x.textAlign="center";x.fillText(+k.slice(8),cx+26,cy+32);x.textAlign="left";
      ds.slice(0,2).forEach(function(ev,n){
        var cc=hex(cat(ev)),ey=cy+52+n*29,bw=cw-16;
        x.save();rr(x,cx+8,ey,bw,25,7);x.clip();x.fillStyle=mix(cc,K.sf,.16);x.fillRect(cx+8,ey,bw,25);x.fillStyle=cc;x.fillRect(cx+8,ey,4,25);x.restore();
        x.font="600 13px "+SN;x.fillStyle=K.tx;x.fillText(fit(x,(ev.allDay?"":tm(ev.start)+" ")+ev.title,bw-16),cx+18,ey+17)});
      if(ds.length>2){x.font="600 14px "+SN;x.fillStyle=K.mu;x.fillText("+"+(ds.length-2)+" mais",cx+12,cy+52+58+16)}
      x.globalAlpha=1}
    y+=gh+46;

    /* lista de atividades */
    x.font="800 34px "+SN;x.fillStyle=K.tx;x.fillText("Atividades do mês",P,y+30);
    x.font="600 19px "+SN;x.fillStyle=K.mu;x.textAlign="right";x.fillText(evs.length?evs.length+(evs.length>1?" atividades":" atividade"):"",W-P,y+28);x.textAlign="left";
    y+=56;
    if(!evs.length){
      rr(x,P,y,cw0,110,22);x.fillStyle=K.sf;x.fill();x.strokeStyle=K.ln;x.lineWidth=1.5;x.stroke();
      x.font="italic 600 22px "+SN;x.fillStyle=K.mu;x.textAlign="center";x.fillText("Nenhuma atividade cadastrada neste mês.",W/2,y+62);x.textAlign="left";y+=110+14}
    evs.slice(0,MAXL).forEach(function(ev){
      var c=cat(ev),tagW=0,sub=when(ev)+(ev.location?" · "+ev.location:"");
      x.font="700 16px "+SN;tagW=x.measureText(c.name).width+30;
      var tw=cw0-30-84-24-tagW-24;x.font="700 25px "+SN;var tl=wrap(x,ev.title,tw,2),h=26+tl.length*31+8+24+24;
      x.save();x.shadowColor="rgba(74,10,16,"+(dark?".35":".06")+")";x.shadowBlur=18;x.shadowOffsetY=6;rr(x,P,y,cw0,h,22);x.fillStyle=K.sf;x.fill();x.restore();
      rr(x,P,y,cw0,h,22);x.strokeStyle=K.ln;x.lineWidth=1.5;x.stroke();
      x.save();rr(x,P,y,cw0,h,22);x.clip();x.fillStyle=hex(c);x.fillRect(P,y,7,h);x.restore();
      var dx=P+30+42;x.textAlign="center";x.fillStyle=K.tx;x.font="800 38px "+SN;x.fillText(+ev.sk.slice(8),dx,y+h/2+6);
      x.fillStyle=K.mu;x.font="700 15px "+SN;x.fillText(DW[dow(ev.sk)].toUpperCase(),dx,y+h/2+28);x.textAlign="left";
      var bx=P+30+84+24,by=y+26;x.font="700 25px "+SN;x.fillStyle=K.tx;
      tl.forEach(function(l,n){x.fillText(l,bx,by+22+n*31)});
      x.font="400 19px "+SN;x.fillStyle=K.mu;x.fillText(fit(x,sub,tw),bx,by+tl.length*31+22+6);
      var px=P+cw0-24-tagW,py=y+h/2-16;rr(x,px,py,tagW,32,16);x.fillStyle=mix(hex(c),K.sf,.16);x.fill();
      x.font="700 16px "+SN;x.fillStyle=dark?hex(c):mix(hex(c),"#000000",.72);x.textAlign="center";x.fillText(c.name,px+tagW/2,py+22);x.textAlign="left";
      y+=h+14});
    if(evs.length>MAXL){x.font="600 20px "+SN;x.fillStyle=K.mu;x.textAlign="center";x.fillText("+ "+(evs.length-MAXL)+" atividades. Veja todas no portal.",W/2,y+26);x.textAlign="left";y+=44}

    /* rodapé */
    y+=10;x.fillStyle=K.ln;x.fillRect(P,y,cw0,1.5);y+=40;
    x.font="600 19px "+SN;x.fillStyle=K.mu;x.textAlign="center";
    x.fillText((I.name||"")+" nº "+(I.number||"")+" · "+(I.order||"")+" · "+[I.city,I.state].filter(Boolean).join(", "),W/2,y);x.textAlign="left";
    return y+P}

  var probe=document.createElement("canvas").getContext("2d"),H=Math.ceil(render(probe,6000)),cv=document.createElement("canvas");
  cv.width=Math.round(W*SC);cv.height=Math.round(H*SC);var x=cv.getContext("2d");x.scale(SC,SC);render(x,H);return cv}
function save(b,n){var a=el("a",{href:URL.createObjectURL(b),download:n});document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},4000)}
function exportPng(btn){
  if(S.st.month==="load")return;var old=btn.textContent;btn.disabled=true;btn.textContent="Gerando…";
  var fonts=document.fonts&&document.fonts.load?Promise.all(['700 20px "Cormorant Garamond"','400 16px Inter','600 16px Inter','700 16px Inter','800 16px Inter'].map(function(f){return document.fonts.load(f)})).catch(function(){}):Promise.resolve();
  var li=new Promise(function(r){var im=new Image();im.onload=function(){r(im)};im.onerror=function(){r(null)};im.src="assets/images/logo.png"});
  Promise.all([fonts,li]).then(function(v){
    function make(l){return new Promise(function(res,rej){try{paint(l).toBlob(function(b){b?res(b):rej(new Error("blob"))},"image/png")}catch(e){rej(e)}})}
    return make(v[1]).catch(function(){return make(null)})})
  .then(function(blob){var name="calendario-559-"+S.y+"-"+pad(S.m+1)+".png",f=null;try{f=new File([blob],name,{type:"image/png"})}catch(e){}
    if(f&&navigator.canShare&&navigator.canShare({files:[f]})&&matchMedia("(pointer:coarse)").matches)return navigator.share({files:[f],title:"Calendário de "+MN[S.m]}).catch(function(e){if(!e||e.name!=="AbortError")save(blob,name)});
    save(blob,name)})
  .catch(function(){R.status.textContent="Não foi possível gerar a imagem neste aparelho."})
  .then(function(){btn.disabled=false;btn.textContent=old})}

/* ---------- montagem ---------- */
function init(box){
  var n=dkey(new Date());S.y=+n.slice(0,4);S.m=+n.slice(5,7)-1;box.classList.add("custom");prune();
  var bar=el("div",{"class":"cal-bar"}),t=el("h3",{"aria-live":"polite"}),nv=el("div",{"class":"cal-nav"});
  function nb(txt,lab,fn,cls){var b=el("button",{type:"button","class":"btn sec "+(cls||""),"aria-label":lab},txt);b.addEventListener("click",fn);return b}
  function step(d){var m=S.m+d,y=S.y;if(m<0){m=11;y--}if(m>11){m=0;y++}go(y,m,null)}
  nv.appendChild(nb("‹","Mês anterior",function(){step(-1)},"icon"));
  nv.appendChild(nb("Hoje","Ir para hoje",function(){var k=dkey(new Date());go(+k.slice(0,4),+k.slice(5,7)-1,k)}));
  nv.appendChild(nb("›","Próximo mês",function(){step(1)},"icon"));
  var tl=el("div",{"class":"cal-tools"}),sv=nb("Salvar imagem","Salvar imagem do mês",function(){exportPng(sv)});tl.appendChild(nv);tl.appendChild(sv);
  bar.appendChild(t);bar.appendChild(tl);
  var lg=el("div",{"class":"legend"});function legend(){lg.textContent="";cats.forEach(function(c){var s=el("span",0,c.name);s.style.setProperty("--c",hex(c));lg.appendChild(s)})}legend();
  if(window.MutationObserver)new MutationObserver(function(){legend();draw()}).observe(document.documentElement,{attributes:true,attributeFilter:["class"]});
  var wk=el("div",{"class":"wk","aria-hidden":"true"});DW.forEach(function(w){wk.appendChild(el("span",0,w))});
  R.title=t;R.grid=el("div",{"class":"days",role:"group","aria-label":"Dias do mês"});R.panel=el("div",{"class":"cal-list","aria-live":"polite"});R.status=el("p",{"class":"note",role:"status"});
  [bar,lg,wk,R.grid,R.panel,R.status].forEach(function(x){box.appendChild(x)});

  /* seleção de datas (um toque; outro toque no mesmo dia desfaz) */
  R.grid.addEventListener("click",function(e){var b=e.target.closest(".day");if(!b)return;var k=b.getAttribute("data-k");
    if(k===S.sel){S.sel=null;draw();return}
    go(+k.slice(0,4),+k.slice(5,7)-1,k);
    var r=R.panel.getBoundingClientRect();if(r.top>innerHeight*.7)scrollBy({top:r.top-innerHeight*.45,behavior:reduced()?"auto":"smooth"})});
  /* setas do teclado e deslize no celular */
  R.grid.addEventListener("keydown",function(e){var d={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];if(!d)return;
    var all=[].slice.call(R.grid.children),i=all.indexOf(document.activeElement);if(i<0)return;e.preventDefault();var j=Math.max(0,Math.min(all.length-1,i+d));all[j].focus()});
  var x0=0,y0=0;
  R.grid.addEventListener("touchstart",function(e){x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
  R.grid.addEventListener("touchend",function(e){var t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;if(Math.abs(dx)>70&&Math.abs(dy)<40)step(dx<0?1:-1)},{passive:true});

  var dlg=document.getElementById("dlg");dlg.querySelector(".x").addEventListener("click",function(){dlg.close()});dlg.addEventListener("click",function(e){if(e.target===dlg)dlg.close()});
  refresh(false);
  setInterval(function(){if(!document.hidden)refresh(true)},EVERY*60000);
  document.addEventListener("visibilitychange",function(){if(!document.hidden&&Date.now()-tried>60000)refresh(true)});
}
window.Cal={publicUrl:pubUrl,enabled:function(){return ok(C.calendarFeedUrl)||(!!C.calendarApiKey&&!!calId())},init:init};
})();
