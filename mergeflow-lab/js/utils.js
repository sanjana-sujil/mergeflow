/* utils.js: small helpers shared by every file ($ = getElementById, esc = HTML-escape, hash = short commit id) */
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const hash=s=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)}return(x>>>0).toString(16).padStart(8,'0').slice(0,7)};
