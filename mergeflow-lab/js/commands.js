/* commands.js: terminal output, integrate() (merge / cherry-pick) and run(), the interpreter for every git command */
function integrate(kind,baseId,T,tname,pmsg){
 const H=tip(),r=threeWay(filesOf(baseId),filesOf(H),filesOf(T)),fs=Object.keys(r.conf);
 out('Three-way merge: base '+(baseId||'(none)')+', ours '+H+', theirs '+T,'mute');
 if(!fs.length){R.work={...r.res};const c=mk(kind==='merge'?"Merge branch '"+tname+"' into "+R.head:pmsg,kind==='merge'?[H,T]:[H],r.res);return out('Merged cleanly. ['+R.head+' '+c.id+'] '+c.msg,'ok')}
 R.merging={kind,target:T,tname,conf:r.conf,pmsg};R.work={...r.res};
 fs.forEach(f=>{R.work[f]=segText(r.conf[f],true);out('CONFLICT ('+(r.conf[f][0].del?'modify/delete':'content')+'): Merge conflict in '+f,'err')});
 out('Automatic merge failed; fix conflicts and then commit the result.','err');R.cur=fs[0]}


/* ---------- terminal ---------- */
function out(t,c){const d=document.createElement('div');if(c)d.className=c;d.textContent=t;$('log').appendChild(d);$('log').scrollTop=1e9}
const find=x=>Object.keys(R.commits).find(k=>k.startsWith(x));
function run(line){line=line.trim();if(!line)return;out('$ '+line,'cmd');
 const m=(line.match(/"[^"]*"|'[^']*'|\S+/g)||[]).map(x=>/^["'].*["']$/.test(x)?x.slice(1,-1):x);
 if(m[0]==='git')m.shift();const c=m.shift(),a=m,err=t=>out(t,'err');
 switch(c){
 case 'help':['git status | log [--all] [branch] | branch [name]','git switch [-c] <branch>   (or checkout)','git commit -m "msg"','git merge <branch> | merge --abort','git cherry-pick <commit-id>','git reset --hard   (discard changes, abort merge)','touch <file> | rm <file> | clear'].forEach(x=>out(x,'mute'));break;
 case 'clear':$('log').innerHTML='';break;
 case 'touch':if(!a[0])err('usage: touch <file>');else{if(!(a[0] in R.work))R.work[a[0]]='';R.cur=a[0]}break;
 case 'rm':if(!(a[0] in R.work))err('rm: no such file: '+a[0]);else{delete R.work[a[0]];if(R.merging&&R.merging.conf[a[0]])delete R.merging.conf[a[0]]}break;
 case 'status':out('On branch '+R.head);
  if(R.merging){out('You have unmerged paths ('+unres()+' conflicts left).');Object.keys(R.merging.conf).forEach(f=>out('  both modified: '+f,'err'))}
  else{const ch=changes();ch.length?ch.forEach(x=>out('  '+x)):out('nothing to commit, working tree clean','ok')}break;
 case 'log':{const all=a.includes('--all'),br=a.find(x=>!x.startsWith('-'));
  if(br&&R.branches[br]===undefined){err('fatal: unknown branch '+br);break}
  const set=all?new Set(Object.keys(R.commits)):anc(br?R.branches[br]:tip());
  if(!set.size)out('(no commits yet)','mute');
  [...set].map(id=>R.commits[id]).sort((x,y)=>y.n-x.n).forEach(k=>{const rf=Object.keys(R.branches).filter(b=>R.branches[b]===k.id).map(b=>(b===R.head?'HEAD -> ':'')+b);
   out('* '+k.id+(rf.length?' ('+rf.join(', ')+')':'')+' '+k.msg+(k.parents.length>1?'  [merge]':''))});break}
 case 'branch':if(!a[0]){Object.keys(R.branches).forEach(b=>out((b===R.head?'* ':'  ')+b,b===R.head?'ok':''))}
  else if(R.branches[a[0]]!==undefined)err('fatal: branch '+a[0]+' already exists');
  else if(!tip())err('fatal: make a commit first');
  else{R.branches[a[0]]=tip();R.lanes[a[0]]=Object.keys(R.lanes).length;out('Created branch '+a[0],'ok')}break;
 case 'switch':case 'checkout':{const b=a.find(x=>!x.startsWith('-')),mkb=a.includes('-c')||a.includes('-b');
  if(R.merging){err('error: finish or abort the current merge first (git merge --abort)');break}
  if(!b){err('usage: git switch [-c] <branch>');break}
  if(mkb){if(R.branches[b]!==undefined){err('fatal: branch '+b+' already exists');break}if(!tip()){err('fatal: make a commit first');break}R.branches[b]=tip();R.lanes[b]=Object.keys(R.lanes).length}
  else{if(R.branches[b]===undefined){err('fatal: invalid reference: '+b);break}if(dirty()){err('error: uncommitted changes would be overwritten. Commit or git reset --hard first.');break}}
  R.head=b;if(!mkb)R.work={...filesOf(tip())};out('Switched to branch '+b,'ok');break}
 case 'commit':{const i=a.indexOf('-m')>=0?a.indexOf('-m'):a.indexOf('-am'),msg=i>=0?a[i+1]:null;
  if(R.merging){const u=unres();if(u){err('error: cannot commit, '+u+' conflict'+(u>1?'s':'')+' still unresolved');break}
   const M=R.merging,files={...R.work};for(const f in M.conf)files[f]=segText(M.conf[f]);
   const k=mk(msg||(M.kind==='pick'?M.pmsg:"Merge branch '"+M.tname+"' into "+R.head),M.kind==='pick'?[tip()]:[tip(),M.target],files);
   R.merging=null;R.work={...files};out('['+R.head+' '+k.id+'] '+k.msg,'ok');break}
  if(!msg){err('usage: git commit -m "message"');break}
  if(!dirty()){err('nothing to commit, working tree clean');break}
  const k=mk(msg,tip()?[tip()]:[],R.work);out('['+R.head+' '+k.id+'] '+k.msg,'ok');break}
 case 'merge':{if(a[0]==='--abort'){if(!R.merging)err('fatal: no merge in progress');else{R.merging=null;R.work={...filesOf(tip())};out('Merge aborted.','ok')}break}
  const t=a[0];if(R.branches[t]===undefined){err('fatal: unknown branch '+t);break}
  if(R.merging){err('error: a merge is already in progress');break}
  if(dirty()){err('error: uncommitted changes would be overwritten. Commit or reset first.');break}
  const H=tip(),T=R.branches[t];
  if(H===T||anc(H).has(T)){out('Already up to date.');break}
  if(anc(T).has(H)){R.branches[R.head]=T;R.work={...filesOf(T)};out('Fast-forward: '+R.head+' moved to '+T+' (no merge commit needed)','ok');break}
  integrate('merge',lca(H,T),T,t);break}
 case 'cherry-pick':{const id=a[0]&&find(a[0]);if(!id){err('fatal: unknown commit '+a[0]);break}
  if(R.merging||dirty()){err('error: clean working tree required');break}
  if(anc(tip()).has(id)){out('Already part of this branch.');break}
  integrate('pick',R.commits[id].parents[0]||null,id,id,R.commits[id].msg);break}
 case 'reset':R.merging=null;R.work={...filesOf(tip())};out('Working tree reset to HEAD.','ok');break;
 default:err('git: unknown command '+c+'. Try help.')}
 render()}
