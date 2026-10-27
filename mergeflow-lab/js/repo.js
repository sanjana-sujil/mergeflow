/* repo.js: repository model. State object R, commit creation, ancestors, merge base (lca), working-tree changes, conflict-resolution helpers */
/* ---------- repository model ---------- */
let R,hist=[],hi=0;
const fresh=()=>{R={commits:{},n:0,branches:{main:null},lanes:{main:0},head:'main',work:{},merging:null,cur:null}};
const tip=()=>R.branches[R.head];
const filesOf=id=>id?R.commits[id].files:{};
const anc=(id,s=new Set())=>{if(id&&!s.has(id)){s.add(id);R.commits[id].parents.forEach(p=>anc(p,s))}return s};
const lca=(a,b)=>{const A=anc(a),B=anc(b);let best=null;for(const x of A)if(B.has(x)&&(!best||R.commits[x].n>R.commits[best].n))best=x;return best};
function mk(msg,parents,files){const n=++R.n,id=hash(msg+n+JSON.stringify(files)+parents.join()),c={id,n,msg,parents,files:{...files},lane:R.lanes[R.head]};R.commits[id]=c;R.branches[R.head]=id;return c}
function changes(){const h=filesOf(tip()),w=R.work,r=[];for(const f of new Set([...Object.keys(h),...Object.keys(w)])){if(!(f in w))r.push('deleted:   '+f);else if(!(f in h))r.push('new file:  '+f);else if(h[f]!==w[f])r.push('modified:  '+f)}return r}
const dirty=()=>changes().length>0;
const resOf=s=>s.res==='ours'?s.ours:s.res==='theirs'?s.theirs:s.res==='both'?s.ours.concat(s.theirs):s.res==='custom'?(s.custom?s.custom.split('\n'):[]):null;
const segText=(segs,mark)=>segs.flatMap(s=>{if(s.type==='ok')return s.lines;const r=resOf(s);return r||(mark?['<<<<<<< HEAD',...s.ours,'=======',...s.theirs,'>>>>>>> '+R.merging.tname]:s.ours)}).join('\n');
const unres=()=>R.merging?Object.values(R.merging.conf).flat().filter(s=>s.type==='conf'&&!s.res).length:0;
