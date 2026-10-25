import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {pageUrl} from './seo.mjs';
const files=readdirSync('dist',{recursive:true}).filter(p=>p.endsWith('.html'));
const sitemap=readFileSync('dist/sitemap.xml','utf8');
const titles=new Set();let pages=0;
for(const file of files){
 const html=readFileSync('dist/'+file,'utf8');
 if(file.endsWith('404.html')){assert.match(html,/name="robots" content="noindex,follow"/);continue}
 const lang=file.startsWith('en')?'en':'ms';const name=file.split(/[\\/]/).pop().replace('.html','');
 const url=pageUrl(name,lang);assert.ok(html.includes(`<link rel="canonical" href="${url}">`));assert.ok(sitemap.includes(`<loc>${url}</loc>`));
 const title=html.match(/<title>(.*?)<\/title>/)[1];assert.ok(!titles.has(title),'Duplicate title '+title);titles.add(title);
 for(const code of ['ms-MY','en','x-default'])assert.ok(html.includes(`hreflang="${code}" href="https://farraaffandi.com/`));
 const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(data['@context'],'https://schema.org');assert.ok(data['@graph'].some(n=>n.url===url));
 const faq=data['@graph'].find(n=>n['@type']==='FAQPage');if(faq)assert.ok(faq.mainEntity.length>0);
 assert.match(html,/<meta property="og:image" content="https:\/\/farraaffandi.com\/assets\//);
 assert.ok(!html.includes('language-chevron" aria-hidden="true">⌄'),'Old chevron found');pages++;
}
assert.equal(pages,30);assert.equal([...sitemap.matchAll(/<loc>/g)].length,30);assert.ok(!sitemap.includes('404.html'));
assert.match(readFileSync('dist/robots.txt','utf8'),/Sitemap: https:\/\/farraaffandi.com\/sitemap.xml/);
const config=JSON.parse(readFileSync('wrangler.jsonc','utf8').replace(/^\uFEFF/,''));assert.ok(existsSync(config.main));assert.equal(config.assets.html_handling,'none');
console.log('PASS: 30 unique bilingual SEO pages, sitemap, canonicals, hreflang, JSON-LD and Worker configuration.');
