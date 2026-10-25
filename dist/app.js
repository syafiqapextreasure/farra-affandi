const isMalay=document.documentElement.lang.startsWith('ms');
const languageMenu=document.querySelector('.language-switch');
document.addEventListener('click',event=>{if(languageMenu&&!languageMenu.contains(event.target))languageMenu.open=false});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&languageMenu?.open){languageMenu.open=false;languageMenu.querySelector('summary').focus()}});
// Keep the same page, selected product and section when switching language.
document.querySelectorAll('[data-language]').forEach(link=>{
 const syncLanguageTarget=()=>{const target=new URL(link.getAttribute('href'),location.href);target.search=location.search;target.hash=location.hash;link.href=target.href};
 syncLanguageTarget();link.addEventListener('click',syncLanguageTarget);
});
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('#site-nav');
toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle?.getAttribute('aria-expanded')==='true'){toggle.setAttribute('aria-expanded','false');nav.classList.remove('is-open');toggle.focus()}});
document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===document.body.dataset.page)a.setAttribute('aria-current','page')});
const form=document.querySelector('#enquiry-form');
if(form){
 const topic=new URLSearchParams(location.search).get('interest');
 const select=form.elements.interest;
 if(topic&&Array.from(select.options).some(o=>o.value===topic))select.value=topic;
 const d=new Date();const localDay=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);form.elements.date.min=localDay;
 let currentMessage='';
 form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;
  const fields=new FormData(form);const name=String(fields.get('name')||'').trim();
  const interest=select.selectedOptions[0].textContent.trim();
  const lines=[isMalay?`Hi Farra${name?`, saya ${name}`:''}. Saya ingin bertanya tentang ${interest}.`:`Hi Farra${name?`, my name is ${name}`:''}. I would like to ask about ${interest}.`];
  if(fields.get('date'))lines.push(`${isMalay?'Tarikh pilihan':'Preferred date'}: ${fields.get('date')}`);
  if(String(fields.get('area')||'').trim())lines.push(`${isMalay?'Kawasan':'Area'}: ${String(fields.get('area')).trim()}`);
  if(String(fields.get('message')||'').trim())lines.push(String(fields.get('message')).trim());
  lines.push(isMalay?'Boleh kongsikan slot yang tersedia, harga semasa dan butiran sesi? Terima kasih.':'Could you share availability, the current price and session details? Thank you.');
  currentMessage=lines.join('\n\n');document.querySelector('#message-preview').textContent=currentMessage;
  document.querySelector('#send-whatsapp').href='https://wa.me/60122754883?text='+encodeURIComponent(currentMessage);
  const result=document.querySelector('#message-result');result.hidden=false;document.querySelector('#copy-status').textContent='';result.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
 });
 document.querySelector('#copy-message').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentMessage);document.querySelector('#copy-status').textContent=isMalay?'Mesej telah disalin. Paste ke dalam chat anda dengan Farra.':'Message copied. Paste it into your conversation with Farra.'}catch{document.querySelector('#copy-status').textContent=isMalay?'Fungsi salin tidak tersedia dalam browser ini. Pilih dan salin mesej di atas, atau buka WhatsApp.':'Copy is unavailable in this browser. Select and copy the message above, or open WhatsApp.'}});
}
