import fs from 'node:fs';
import { chromium } from 'playwright';
const m = JSON.parse(fs.readFileSync('data/map.json'));
const path = g => g.map(poly => poly.map(r => { let s=''; for(let i=0;i<r.length;i+=2) s+=(i?'L':'M')+r[i]+','+r[i+1]; return s+'Z'; }).join('')).join('');
const tc = {mountain:'#00000030',hills:'#00000018',desert:'#ffe08030',forest:'#00400030',marsh:'#0040ff30',plains:'#0000',urban:'#ffffff30'};
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.w} ${m.h}" width="${m.w}" height="${m.h}" style="background:#1d3a52">`;
for (const p of m.provinces) svg += `<path d="${path(p.g)}" fill="${m.countries[p.t].color}" stroke="#0006" stroke-width="1"/><path d="${path(p.g)}" fill="${tc[p.tr]}"/>`;
const f = m.fronts.find(f=>f.id===(process.argv[2]||'afg'));
for (const [id,d] of f.iranOrder){const p=m.provinces[id];svg+=`<text x="${p.c[0]}" y="${p.c[1]}" font-size="11" text-anchor="middle" fill="#fff">${d}</text>`}
for (const [id,d] of f.enemyOrder){const p=m.provinces[id];svg+=`<text x="${p.c[0]}" y="${p.c[1]}" font-size="11" text-anchor="middle" fill="#ff0">${d}</text>`}
for (const p of m.provinces) if(p.city&&p.vp>=10) svg+=`<circle cx="${p.city[0]}" cy="${p.city[1]}" r="4" fill="#fff"/><text x="${p.city[0]+6}" y="${p.city[1]-4}" font-size="16" fill="#fff">${p.n}</text>`;
for (const r of m.rivers){let s='';for(let i=0;i<r.p.length;i+=2)s+=(i?'L':'M')+r.p[i]+','+r.p[i+1];svg+=`<path d="${s}" fill="none" stroke="#4af" stroke-width="2"/>`}
for (const r of m.railways){let s='';for(let i=0;i<r.p.length;i+=2)s+=(i?'L':'M')+r.p[i]+','+r.p[i+1];svg+=`<path d="${s}" fill="none" stroke="${r.stage?'#888':'#000'}" stroke-width="2" stroke-dasharray="6 3"/>`}
for (const l of m.lakes){let s='';for(let i=0;i<l.p.length;i+=2)s+=(i?'L':'M')+l.p[i]+','+l.p[i+1];svg+=`<path d="${s}Z" fill="#1d3a52"/>`}
svg += '</svg>';
const b = await chromium.launch(); const pg = await b.newPage({viewport:{width:m.w,height:m.h}});
await pg.setContent(`<body style="margin:0">${svg}</body>`);
await pg.screenshot({path:process.argv[3]||'prev.png'});
await pg.screenshot({path:(process.argv[3]||'prev.png').replace('.png','-iran.png'),clip:{x:1450,y:650,width:1700,height:1300}});
await b.close();
