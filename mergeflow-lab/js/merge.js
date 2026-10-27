/* merge.js: merge engine. LCS diff, line-level diff3 (merge), per-file three-way merge (threeWay), conflict type (ctype) */
/* ---------- three-way line merge (diff3) ---------- */
function lcs(a,b){const n=a.length,m=b.length,w=m+1,d=new Uint16Array((n+1)*w);
 for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)d[i*w+j]=a[i]===b[j]?d[(i+1)*w+j+1]+1:Math.max(d[(i+1)*w+j],d[i*w+j+1]);
 const r=[];let i=0,j=0;while(i<n&&j<m){if(a[i]===b[j]){r.push([i,j]);i++;j++}else if(d[(i+1)*w+j]>=d[i*w+j+1])i++;else j++}return r}
function hunks(base,side,tag){const out=[];let i=0,j=0;
 for(const [mi,mj] of lcs(base,side).concat([[base.length,side.length]])){if(mi>i||mj>j)out.push({s:i,e:mi,lines:side.slice(j,mj),tag});i=mi+1;j=mj+1}return out}
function merge(base,ours,theirs){
 const all=hunks(base,ours,'o').concat(hunks(base,theirs,'t')).sort((x,y)=>x.s-y.s||x.e-y.e),out=[];let pos=0,k=0,cid=0;
 while(k<all.length){const g=[all[k]];let gs=all[k].s,ge=all[k].e;k++;
  while(k<all.length&&all[k].s<=ge){ge=Math.max(ge,all[k].e);g.push(all[k]);k++}
  if(gs>pos)out.push({type:'ok',lines:base.slice(pos,gs)});
  const side=tag=>{const ls=[];let p=gs;for(const h of g.filter(x=>x.tag===tag)){ls.push(...base.slice(p,h.s),...h.lines);p=h.e}ls.push(...base.slice(p,ge));return ls};
  const hO=g.some(x=>x.tag==='o'),hT=g.some(x=>x.tag==='t'),o=hO?side('o'):null,t=hT?side('t'):null;
  if(!hT)out.push({type:'ok',lines:o});else if(!hO)out.push({type:'ok',lines:t});
  else if(o.join('\n')===t.join('\n'))out.push({type:'ok',lines:o});
  else out.push({type:'conf',id:++cid,ours:o,theirs:t,base:base.slice(gs,ge),res:null,custom:''});
  pos=ge}
 if(pos<base.length)out.push({type:'ok',lines:base.slice(pos)});return out}


const ctype=s=>s.del?'modify/delete':!s.base.length?'add/add':'edit/edit';

function threeWay(B,O,T){const names=[...new Set([...Object.keys(B),...Object.keys(O),...Object.keys(T)])],res={},conf={};
 for(const f of names){const b=B[f],o=O[f],t=T[f];
  if(o===t){if(o!==undefined)res[f]=o;continue}
  if(b===o){if(t!==undefined)res[f]=t;continue}
  if(b===t){if(o!==undefined)res[f]=o;continue}
  const segs=(o===undefined||t===undefined)?[{type:'conf',id:1,del:true,ours:o===undefined?[]:o.split('\n'),theirs:t===undefined?[]:t.split('\n'),base:(b||'').split('\n'),res:null,custom:''}]:merge(b===undefined?[]:b.split('\n'),o.split('\n'),t.split('\n'));
  if(segs.some(s=>s.type==='conf'))conf[f]=segs;else res[f]=segs.flatMap(s=>s.lines).join('\n')}
 return{res,conf}}
