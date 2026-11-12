import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {languages,resolveLanguage,buildTranslator} from '../assets/i18n.js';
const read=code=>JSON.parse(readFileSync(new URL(`../assets/i18n/${code}.json`,import.meta.url)));
const tokens=text=>(text.match(/\{\w+\}/g)||[]).sort();
test('language registry preserves all 38 distinct Ethnologue varieties and RTL metadata',()=>{
 assert.equal(languages.length,38); assert.equal(new Set(languages.map(l=>l.code)).size,38);
 for(const code of ['zh','yue','wuu','ar','arz','apc','apd','pnb','bho']) assert.equal(resolveLanguage(code),code);
 for(const code of ['ar','ur','arz','pnb','fa','apc','apd']) assert.equal(languages.find(l=>l.code===code).dir,'rtl');
 assert.equal(resolveLanguage('../../invalid'),'en');assert.equal(resolveLanguage(null),'en');
});
for(const locale of languages){
 test(`complete ${locale.code} catalog with safe interpolation tokens`,()=>{
  const source=read('en'),target=read(locale.code);
  assert.deepEqual(Object.keys(target).sort(),Object.keys(source).sort());
  for(const key of Object.keys(source)){
   assert.equal(typeof target[key],'string',`${locale.code}/${key}`);
   assert.ok(target[key].trim(),`${locale.code}/${key} is empty`);
   assert.deepEqual(tokens(target[key]),tokens(source[key]),`${locale.code}/${key} placeholders`);
   assert.ok(!/<script\b|javascript:/i.test(target[key]));
  }
 });
}
test('AdSense remains verified and inactive; user output is excluded from translation',()=>{
 const config=JSON.parse(readFileSync(new URL('../assets/ads-config.json',import.meta.url)));
 assert.equal(config.publisherId,'ca-pub-4289587558749574');assert.equal(config.enabled,false);assert.equal(config.siteApproved,false);
 assert.match(readFileSync(new URL('../index.html',import.meta.url),'utf8'),/google-adsense-account/);
 const loader=readFileSync(new URL('../assets/i18n.js',import.meta.url),'utf8');
 assert.match(loader,/data-user-content/);assert.match(loader,/#output/);assert.match(loader,/\.cell:not/);
});

test('runtime interpolation preserves user values and handles dynamic counts',()=>{
 const render=buildTranslator({a:'Cue {number}: {value}',b:'cues',c:'Ends',d:'Card {number} of {count} · Five in a row wins!'}, {a:'Dòng {number}: {value}',b:'phụ đề',c:'Kết thúc',d:'Thẻ {number}/{count}'});
 assert.equal(render('Cue 2: <tag>$&'),'Dòng 2: <tag>$&');
 assert.equal(render('3 cues'),'3 phụ đề');
 assert.equal(render('Ends 00:00:03,000'),'Kết thúc 00:00:03,000');
 assert.equal(render('Card 2 of 4 · Five in a row wins!'),'Thẻ 2/4');
 assert.equal(render('Private user input'),'Private user input');
});
