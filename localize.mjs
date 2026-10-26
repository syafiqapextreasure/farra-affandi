import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {optimizePage} from './seo.mjs';
const ms=JSON.parse(readFileSync(new URL('./translations-ms.json',import.meta.url),'utf8'));
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'");
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const enOverrides={
 'Dengan pengalaman 10 tahun dalam terapi kecantikan dan wellness, saya membantu anda memahami pilihan yang ada melalui penerangan dan bimbingan secara peribadi.':'With 10 years in beauty and wellness therapy, I help you understand your options through personal explanations and guidance.',
 '“Bermula dengan perbualan, diteruskan dengan bimbingan.”':'“It starts with a conversation and continues with guidance.”',
 'Sesi percubaan':'Trial session','Terapi Hydrogen':'Hydrogen Therapy','Kelas Mobile Spa':'Mobile Spa Class','Elysyle / Kelas Mobile Spa':'Elysyle / Mobile Spa Class',
 'Terapi Hydrogen / Personal sessions':'Hydrogen Therapy / Personal sessions','Possibility / Peluang bisnes':'Possibility / Business opportunities','Events / Bersama Farra':'Events / With Farra'
};
const enMessages={
 'Hi Farra, saya ingin berkenalan dan tahu lebih lanjut tentang servis anda.':'Hi Farra, I would like to connect and learn more about your services.',
 'Hi Farra, saya ingin tahu lebih lanjut tentang servis anda.':'Hi Farra, I would like to learn more about your services.',
 'Hi Farra, saya ingin bertanya tentang servis anda.':'Hi Farra, I would like to ask about your services.',
 'Hi Farra, saya berminat dengan Hydrogen Experience Day yang akan datang. Boleh kongsikan tarikh, lokasi, harga dan butiran pendaftaran terkini?':'Hi Farra, I am interested in the next Hydrogen Experience Day. Could you share the latest date, location, price and registration details?'
};
function translate(value,lang){
 const key=decode(value.trim());if(!key)return value;
 if(lang==='ms'&&/[A-Za-z]/.test(key)&&!(key in ms))throw new Error('Missing Bahasa Melayu translation: '+key);
 const text=lang==='ms'?(ms[key]??key):(enOverrides[key]??key);
 return value.replace(value.trim(),escape(text));
}
function languageBar(file,lang){
 const bm=lang==='ms'?file+'.html':'../'+file+'.html',en=lang==='en'?file+'.html':'en/'+file+'.html';
 return `<details class="language-switch"><summary aria-label="${lang==='ms'?'Pilihan bahasa: Bahasa Melayu':'Language selection: English'}" title="${lang==='ms'?'Tukar bahasa':'Change language'}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/></svg><span>${lang==='ms'?'BM':'EN'}</span><svg class="language-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></summary><div class="language-options" role="navigation" aria-label="${lang==='ms'?'Pilihan bahasa':'Language selection'}"><a data-language="ms" href="${bm}" lang="ms" hreflang="ms" ${lang==='ms'?'aria-current="true"':''}>Bahasa Melayu</a><a data-language="en" href="${en}" lang="en" hreflang="en" ${lang==='en'?'aria-current="true"':''}>English</a></div></details>`;
}
function render(source,file,lang){
 // Keep form values stable across languages so existing product enquiry links work.
 source=source.replace(/<option>([^<]+)<\/option>/g,(_,label)=>`<option value="${escape(decode(label))}">${label}</option>`);
 let html=source.split(/(<[^>]+>)/g).map(part=>{
  if(!part.startsWith('<'))return translate(part,lang);
  if(/^<meta\s/.test(part)&&/(?:name="description"|property="og:(?:title|description)")/.test(part))part=part.replace(/content="([^"]*)"/,(_,value)=>`content="${translate(value,lang)}"`);
  return part.replace(/(alt|aria-label|placeholder)="([^"]*)"/g,(_,key,value)=>`${key}="${translate(value,lang)}"`);
 }).join('');
 if(lang==='ms')html=html.replace('<h1>Hidrogen<br>Air</h1>','<h1>Air<br>hidrogen</h1>').replace('<h1>Hidrogen<br>Gogal</h1>','<h1>Gogal<br>hidrogen</h1>');
 html=html.replace('<html lang="en">',`<html lang="${lang==='ms'?'ms-MY':'en'}">`);
 if(lang==='en'){
  html=html.replace(/(src|href)="(assets\/[^\"]*|styles\.css|readability\.css|app\.js)"/g,'$1="../$2"');
  html=html.replace(/href="(https:\/\/wa.me\/[^\"]+)"/g,(_,url)=>{const u=new URL(decode(url));const msg=u.searchParams.get('text');if(msg&&!enMessages[msg])throw new Error('Missing English WhatsApp text');if(msg)u.searchParams.set('text',enMessages[msg]);return `href="${escape(u.href)}"`;});
 }
 const prefix=lang==='en'?'../':'';
 html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}language.css"><link rel="alternate" hreflang="ms" href="${lang==='en'?'../':''}${file}.html"><link rel="alternate" hreflang="en" href="${lang==='ms'?'en/':''}${file}.html"></head>`);
 if(html.includes('</header>'))html=html.replace('</nav></div></header>','</nav>'+languageBar(file,lang)+'</div></header>');
 else html=html.replace('<body>','<body><div class="standalone-language">'+languageBar(file,lang)+'</div>');
 html=optimizePage(html,file,lang);
 // Resolve links before removing file extensions so both language trees remain correct.
 return html.replace(/(href|src)="([^"]+)"/g,(match,key,value)=>{
  if(/^(https?:|tel:|mailto:|#|data:)/.test(value))return match;
  const target=new URL(value,'https://farraaffandi.com/'+(lang==='en'?'en/':''));
  target.pathname=target.pathname.replace(/\/index\.html$/,'/').replace(/\.html$/,'');
  return `${key}="${target.pathname}${target.search}${target.hash}"`;
 });
}
export function emitLocales(source,file){
 mkdirSync('dist/en',{recursive:true});
 writeFileSync(`dist/${file}.html`,render(source,file,'ms'));
 writeFileSync(`dist/en/${file}.html`,render(source,file,'en'));
}

