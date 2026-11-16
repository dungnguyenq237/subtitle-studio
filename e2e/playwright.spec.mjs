import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {languages} from '../assets/languages.js';
import {localeMatrix,contentMatrix,subtitleFlow,partyFlow,regressionFlow,persistenceFlow} from './runner.mjs';
const app=JSON.parse(readFileSync(new URL('../package.json',import.meta.url))).name;
const catalogs=Object.fromEntries(languages.map(l=>[l.code,JSON.parse(readFileSync(new URL(`../assets/i18n/${l.code}.json`,import.meta.url)))]));
const base=process.env.E2E_BASE_URL||'http://127.0.0.1:8765/';
const adapter=page=>({playwright:page,goto:url=>page.goto(url),title:()=>page.title(),url:()=>page.url()});
test('all 38 workspace languages preserve user content',async({page})=>{await localeMatrix(adapter(page),base,catalogs,languages,app);});
test('all localized information pages keep metadata and links',async({page})=>{const pages=['about.html','privacy.html','contact.html','guide.html'];if(app==='subtitle-studio')pages.push('subtitle-delay.html','srt-vtt-conversion.html','subtitle-errors.html');await contentMatrix(adapter(page),base,pages,catalogs,languages);});
for(const width of [320,390])test(`all 38 locales fit ${width}px`,async({page})=>{await page.setViewportSize({width,height:900});await page.goto(base+'?lang=en');await expect(page.locator('html')).toHaveAttribute('data-i18n-ready','true');for(const locale of languages){await page.locator('#site-language').selectOption(locale.code);await expect(page.locator('html')).toHaveAttribute('lang',locale.code);const metrics=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));if(metrics.scroll>metrics.width+1)console.error('[e2e:mobile]',locale.code,metrics);expect(metrics.scroll,locale.code).toBeLessThanOrEqual(metrics.width+1);}});
test('localized main workflow',async({page})=>{await(app==='subtitle-studio'?subtitleFlow:partyFlow)(adapter(page),base);});
test('exact translated errors and generated-content regressions',async({page})=>{await regressionFlow(adapter(page),base,catalogs,app);});
test('navigation, stored preference and keyboard',async({page})=>{await persistenceFlow(adapter(page),base);});
test('failed catalog falls back without losing draft',async({page})=>{await page.route('**/i18n/ar.json',route=>route.abort());await page.goto(base+'?lang=en');await expect(page.locator('html')).toHaveAttribute('data-i18n-ready','true');const field=page.locator(app==='subtitle-studio'?'#source':'#title');await field.fill('FREE draft');await page.locator('#site-language').selectOption('ar');await expect(page.locator('.language-status')).toHaveText('Translation unavailable. Showing English.');await expect(field).toHaveValue('FREE draft');await expect(page.locator('html')).toHaveAttribute('lang','en');});
test('disabled storage and invalid URL locale remain usable',async({page})=>{await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage disabled','SecurityError');}}));await page.goto(base+'?lang=invalid');await expect(page.locator('html')).toHaveAttribute('data-i18n-ready','true');await page.locator('#site-language').selectOption('vi');await expect(page.locator('html')).toHaveAttribute('lang','vi');});
if(app==='subtitle-studio')test('real VTT download preserves text',async({page})=>{await page.goto(base+'?lang=vi');await expect(page.locator('html')).toHaveAttribute('lang','vi');await page.locator('#sample').click();await page.locator('#format').selectOption('vtt');await page.locator('#process').click();const pending=page.waitForEvent('download');await page.locator('#download').click();const download=await pending;const text=readFileSync(await download.path(),'utf8');expect(text).toMatch(/^WEBVTT\n\n/);expect(text).toContain('A small idea.');});
else test('RTL print layout excludes controls and produces a PDF',async({page},info)=>{await page.goto(base+'?lang=ar');await expect(page.locator('html')).toHaveAttribute('data-i18n-ready','true');await page.emulateMedia({media:'print'});await expect(page.locator('#sheets')).toBeVisible();await expect(page.locator('#sheets .print-sheet')).toHaveCount(4);await expect(page.locator('.language-control')).toBeHidden();await expect(page.locator('.settings')).toBeHidden();await expect(page.locator('[data-ad-slot]')).toBeHidden();const pdf=await page.pdf({format:'A4',printBackground:true});expect(pdf.length).toBeGreaterThan(1000);await info.attach('rtl-print.pdf',{body:pdf,contentType:'application/pdf'});});
test('theme follows system, responds to changes, and persists an explicit choice',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'}); await page.goto(base+'?lang=en');
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await expect(page.locator('[data-theme-choice="system"]')).toHaveAttribute('aria-pressed','true');
 await page.emulateMedia({colorScheme:'light'}); await expect(page.locator('html')).toHaveAttribute('data-theme','light');
 const field=page.locator(app==='subtitle-studio'?'#source':'#title');await field.fill('My untouched draft');
 await page.locator('[data-theme-choice="dark"]').click();
 await expect(field).toHaveValue('My untouched draft');
 await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.goto(base+'guide.html?lang=en'); await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.locator('[data-theme-choice="system"]').click(); await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});
test('theme keyboard controls remain usable when storage is denied',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError');}}));
 await page.goto(base+'?lang=en'); const dark=page.locator('[data-theme-choice="dark"]');
 await dark.focus();await dark.press('Enter');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.locator('[data-theme-choice="light"]').click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});
test('both themes have readable tokens, mobile RTL layout, and reduced motion',async({page},info)=>{
 function contrast(a,b){const lum=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'?lang=en');
 for(const mode of ['light','dark']){
  await page.locator('[data-theme-choice="'+mode+'"]').click();
  const pairs=await page.evaluate(()=>{
   const body=getComputedStyle(document.body),token=n=>body.getPropertyValue(n).trim();
   const names=['--ground','--surface','--surface-raised','--ink','--muted'];
   const values={};const probe=document.createElement('span');document.body.append(probe);
   for(const name of names){probe.style.color=token(name);values[name]=getComputedStyle(probe).color;}probe.remove();
   return values;
  });
  for(const fg of ['--ink','--muted'])for(const bg of ['--ground','--surface','--surface-raised'])expect(contrast(pairs[fg],pairs[bg]),mode+fg+bg).toBeGreaterThanOrEqual(4.5);
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/'+app+'-'+mode+'.png',fullPage:true,animations:'disabled'});
  await info.attach(mode,{body:await page.screenshot({animations:'disabled'}),contentType:'image/png'});
  await page.setViewportSize({width:320,height:900});await page.locator('#site-language').selectOption('ar');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(321);
  for(const button of await page.locator('[data-theme-choice]').all()){const box=await button.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  if(app==='party-paper'){
   await page.emulateMedia({media:'print'});await expect(page.locator('.theme-switch')).toBeHidden();
   await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');await page.emulateMedia({media:'screen'});
  }
  await page.locator('#site-language').selectOption('en');
 }
});
test('delayed brand font does not move the hero after first paint',async({page})=>{
 await page.addInitScript(()=>{
  window.__layoutShifts=[];
  new PerformanceObserver(list=>{
   for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__layoutShifts.push(entry.value);
  }).observe({type:'layout-shift',buffered:true});
 });
 await page.route('**/assets/studio.woff2',async route=>{
  await new Promise(resolve=>setTimeout(resolve,800));await route.continue();
 });
 await page.goto(base+'?lang=en');
 await expect(page.locator('html')).toHaveAttribute('data-i18n-ready','true');
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
 const cls=await page.evaluate(()=>window.__layoutShifts.reduce((sum,value)=>sum+value,0));
 console.log('[performance:delayed-font]',{cls});
 expect(cls).toBeLessThanOrEqual(.02);
});
