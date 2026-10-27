/* ui.js: rendering (commit graph, tabs, editor, conflict resolver, status) and all event listeners */
/* ---------- rendering ---------- */
const PAL=['var(--ours)','var(--theirs)','#b8741a','#178a8a','#b0386b','#5a7d1f'],col=l=>PAL[l%PAL.length];
function graph(){const cs=Object.values(R.commits).sort((a,b)=>a.n-b.n);
 if(!cs.length){$('graph').innerHTML='<p class="empty">No commits yet.</p>';return}
 const L=Object.keys(R.lanes).length,X=70,Y=48,P=44,W=Math.max(320,P*2+(cs.length-1)*X),H=44+(L-1)*Y+36,pos=c=>[P+(c.n-1)*X,44+c.lane*Y];
 let s='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Commit graph">';
 cs.forEach(c=>c.parents.forEach((p,i)=>{const pc=R.commits[p],[x1,y1]=pos(pc),[x2,y2]=pos(c);s+='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+col(i?pc.lane:c.lane)+'" stroke-width="3"/>'}));
 cs.forEach(c=>{const [x,y]=pos(c);s+='<g data-id="'+c.id+'"><title>'+esc(c.msg)+'</title><circle cx="'+x+'" cy="'+y+'" r="'+(c.parents.length>1?10:8)+'" fill="'+col(c.lane)+'" stroke="var(--panel)" stroke-width="2"/><text class="id" x="'+x+'" y="'+(y+24)+'" text-anchor="middle">'+c.id.slice(0,5)+'</text></g>'});
 const by={};for(const b in R.branches)if(R.branches[b])(by[R.branches[b]]=by[R.branches[b]]||[]).push(b);
 for(const id in by){const [x,y]=pos(R.commits[id]);s+='<text x="'+(x-8)+'" y="'+(y-16)+'" font-weight="500">'+esc(by[id].map(b=>(b===R.head?'HEAD → ':'')+b).join(', '))+'</text>'}
 $('graph').innerHTML=s+'</svg>';$('graphwrap').scrollLeft=1e6}
function status(){const u=unres(),el=$('st');
 el.className=R.merging?'bad':dirty()?'':'good';
 el.textContent=R.head+(R.merging?' · merging '+R.merging.tname+', '+u+' unresolved':dirty()?' · uncommitted changes':' · clean');
 $('ps').textContent=R.head+(R.merging?' (merging)':'')+' $'}
const blk=a=>a.length?esc(a.join('\n')):'<span class="empty">(no lines)</span>';
function resolver(){const f=R.cur,segs=R.merging.conf[f],d=$('ed');
 d.innerHTML='<p class="hint" style="margin:0 0 6px"><b>'+esc(f)+'</b> has conflicts. Choose a resolution for each, then run <code>git commit</code>.</p>';
 segs.forEach((s,i)=>{if(s.type==='ok'){const p=document.createElement('pre');p.className='code okseg';p.textContent=s.lines.join('\n');d.appendChild(p);return}
  const r=resOf(s),el=document.createElement('div'),bt=(a,t)=>'<button data-a="'+a+'" data-i="'+i+'">'+t+'</button>';
  el.className='conf'+(r?' done':'');
  el.innerHTML='<header><span>Conflict '+s.id+' ('+ctype(s)+')'+(r?' – resolved':'')+'</span><span class="sp"></span>'+bt('ours','Keep ours')+bt('theirs','Keep theirs')+bt('both','Keep both')+bt('custom','Edit')+(r?bt('undo','Undo'):'')+'</header>'+
   '<div class="sides"><div class="side o"><b>HEAD (ours)</b><pre class="code">'+blk(s.ours)+'</pre></div><div class="side t"><b>'+esc(R.merging.tname)+' (theirs)</b><pre class="code">'+blk(s.theirs)+'</pre></div></div>'+
   (s.res==='custom'?'<div class="res"><textarea data-i="'+i+'" aria-label="Custom resolution"></textarea></div>':r?'<div class="res"><pre class="code">'+blk(r)+'</pre></div>':'');
  d.appendChild(el);const ta=el.querySelector('textarea');if(ta)ta.value=s.custom})}
function render(){
 if(!(R.cur in R.work))R.cur=Object.keys(R.work)[0];
 $('tabs').innerHTML=Object.keys(R.work).map(f=>'<button data-f="'+esc(f)+'" class="'+(f===R.cur?'on':'')+'">'+esc(f)+(R.merging&&R.merging.conf[f]&&R.merging.conf[f].some(s=>s.type==='conf'&&!s.res)?'<i>●</i>':'')+'</button>').join('')||'<span class="hint">No files yet</span>';
 if(R.cur===undefined)$('ed').innerHTML='<p class="hint">Working tree is empty. Run <code>touch app.py</code> in the terminal.</p>';
 else if(R.merging&&R.merging.conf[R.cur])resolver();
 else{$('ed').innerHTML='<textarea id="wt" spellcheck="false" aria-label="Edit file"></textarea>';const w=$('wt');w.value=R.work[R.cur];w.oninput=e=>{R.work[R.cur]=e.target.value;status()}}
 graph();status()}

$('tabs').addEventListener('click',e=>{const b=e.target.closest('button[data-f]');if(b){R.cur=b.dataset.f;render()}});
$('graph').addEventListener('click',e=>{const g=e.target.closest('[data-id]');if(!g)return;const c=R.commits[g.dataset.id];
 $('info').textContent=c.id+' · "'+c.msg+'" · parents: '+(c.parents.join(', ')||'none')+' · files: '+Object.keys(c.files).join(', ')});
$('ed').addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(!b||!R.merging)return;const s=R.merging.conf[R.cur][+b.dataset.i],a=b.dataset.a;
 if(a==='undo')s.res=null;else{s.res=a;if(a==='custom'&&!s.custom)s.custom=s.ours.concat(s.theirs).join('\n')}render()});
$('ed').addEventListener('input',e=>{if(e.target.dataset.i!==undefined)R.merging.conf[R.cur][+e.target.dataset.i].custom=e.target.value});
$('cmd').addEventListener('keydown',e=>{
 if(e.key==='Enter'){const v=e.target.value;if(v.trim()){hist.push(v);hi=hist.length}e.target.value='';run(v)}
 else if(e.key==='ArrowUp'&&hi>0){hi--;e.target.value=hist[hi];e.preventDefault()}
 else if(e.key==='ArrowDown'){hi=Math.min(hi+1,hist.length);e.target.value=hist[hi]||''}});
['git status','git log --all','git branch','git commit -m ""','git merge '].forEach(t=>{const b=document.createElement('button');b.textContent=t.trim();
 b.onclick=()=>{const i=$('cmd');i.value=t;i.focus();if(t.endsWith('""')){i.setSelectionRange(t.length-1,t.length-1)}else if(!t.endsWith(' ')){i.value='';run(t)}};$('chips').appendChild(b)});
$('theme').onclick=()=>{const r=document.documentElement,d=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;r.dataset.theme=d?'light':'dark'};
