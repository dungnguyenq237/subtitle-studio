// Run through the documented CUA Playwright surface; no private browser APIs.
// Import into cua_repl, pass the active tab, base URL and expected locale catalogs.
const check = (condition, message) => { if (!condition) throw new Error(message); };
export async function localeMatrix(tab, base, catalogs, locales, app) {
 await tab.goto(base);
 await tab.playwright.locator('html[data-i18n-ready="true"]').waitFor({state:'attached'});
 const input = app === 'subtitle-studio' ? '#source' : '#title';
 const original = app === 'subtitle-studio' ? '1\n00:00:01,000 --> 00:00:03,000\nA toast' : 'A toast';
 await tab.playwright.locator(input).fill(original);
 if (app === 'subtitle-studio') await tab.playwright.locator('#process').click();
 const originalOutput = app === 'subtitle-studio' ? await tab.playwright.locator('#output').textContent() : null;
 const result=[];
 for (const locale of locales) {
  await tab.playwright.locator('#site-language').selectOption(locale.code);
  await tab.playwright.locator(`html[lang="${locale.code}"]`).waitFor({state:'attached'});
  const actual = await tab.playwright.evaluate(({input,app}) => ({
   lang:document.documentElement.lang,dir:document.documentElement.dir,
   value:document.querySelector(input).value,
   output:document.querySelector('#output')?.textContent,
   label:document.querySelector(app==='subtitle-studio'?'#process':'#generate').textContent.trim().replace(/\s*[→↗]\s*$/,''),
   overflow:document.documentElement.scrollWidth > innerWidth+1,
   scripts:[...document.scripts].some(s=>s.src.includes('googlesyndication'))
  }),{input,app});
  check(actual.lang===locale.code && actual.dir===locale.dir,`${app}/${locale.code}: language/direction`);
  check(actual.value===original,`${app}/${locale.code}: input changed`);
  if (originalOutput) check(actual.output===originalOutput,`${app}/${locale.code}: exported text changed`);
  const expected=catalogs[locale.code][app==='subtitle-studio'?'k283':'k231'];
  check(actual.label===expected,`${app}/${locale.code}: button not translated (${actual.label})`);
  check(!actual.overflow,`${app}/${locale.code}: horizontal overflow`);
  check(!actual.scripts,`${app}/${locale.code}: advertising activated`);
  result.push({language:locale.code,pass:true});
 }
 return result;
}
export async function subtitleFlow(tab, base) {
 await tab.goto(base+'?lang=vi');
 await tab.playwright.locator('html[lang="vi"]').waitFor({state:'attached'});
 await tab.playwright.locator('#source').fill('1\n00:00:04,000 --> 00:00:06,000\nA toast');
 await tab.playwright.locator('#offset').fill('-2');
 await tab.playwright.locator('#format').selectOption('vtt');
 await tab.playwright.locator('#process').click();
 check((await tab.playwright.locator('#output').textContent()).includes('00:00:02.000 --> 00:00:04.000\nA toast'),'VTT export incorrect');
 check(await tab.playwright.locator('#download').isEnabled(),'download disabled');
 await tab.playwright.locator('#site-language').selectOption('ar');
 await tab.playwright.locator('html[lang="ar"]').waitFor({state:'attached'});
 check(await tab.playwright.locator('#download').isEnabled(),'language change invalidates output');
 await tab.playwright.locator('#offset').fill('-10');
 await tab.playwright.locator('#process').click();
 check(!(await tab.playwright.locator('#download').isEnabled()),'negative cue can be downloaded');
 check((await tab.playwright.locator('#status').textContent()).trim().length>0,'missing validation');
 return {conversion:true,outputPreserved:true,negativeOffset:true};
}
export async function partyFlow(tab,base) {
 await tab.goto(base+'?lang=vi');
 await tab.playwright.locator('html[lang="vi"]').waitFor({state:'attached'});
 await tab.playwright.locator('#title').fill('A toast');
 await tab.playwright.locator('#generate').click();
 check(await tab.playwright.locator('#print').isEnabled(),'bingo cannot print');
 await tab.playwright.locator('#site-language').selectOption('ar');
 await tab.playwright.locator('html[lang="ar"]').waitFor({state:'attached'});
 check((await tab.playwright.locator('#preview .preview-title').textContent())==='A toast','user title translated');
 check(await tab.playwright.locator('#print').isEnabled(),'locale disabled print');
 await tab.playwright.locator('#mode').selectOption('search');
 await tab.playwright.locator('#generate').click();
 await tab.playwright.locator('#next').click();
 check((await tab.playwright.locator('#page-number').textContent())==='2 / 2','answer key missing');
 await tab.playwright.locator('#items').fill('你好');
 await tab.playwright.locator('#generate').click();
 check(!(await tab.playwright.locator('#print').isEnabled()),'unsupported words printable');
 check((await tab.playwright.locator('#status').textContent()).trim().length>0,'missing word validation');
 await tab.playwright.locator('#mode').selectOption('bingo');
 check((await tab.playwright.locator('#title').getAttribute('value'))!==null,'title control missing');
 const saved=await tab.playwright.evaluate(()=>document.querySelector('#title').value);
 check(saved==='A toast','switching modes lost bingo draft');
 return {bingo:true,wordSearch:true,answerKey:true,validation:true,drafts:true};
}
export async function contentMatrix(tab,base,pages,catalogs,locales){
 const results=[];
 for(const page of pages){
  await tab.goto(base+page+'?lang=en');
  await tab.playwright.locator('html[data-i18n-ready="true"]').waitFor({state:'attached'});
  const title=await tab.title();
  const key=Object.keys(catalogs.en).find(k=>catalogs.en[k]===title);
  check(Boolean(key),`${page}: title missing from source catalog`);
  for(const locale of locales){
   await tab.playwright.locator('#site-language').selectOption(locale.code);
   await tab.playwright.locator(`html[lang="${locale.code}"]`).waitFor({state:'attached'});
   const state=await tab.playwright.evaluate(()=>({title:document.title,lang:document.documentElement.lang,dir:document.documentElement.dir,
    canonical:document.querySelector('link[rel="canonical"]')?.href,
    overflow:document.documentElement.scrollWidth>innerWidth+1,
    htmlH1:document.querySelectorAll('h1').length,
    links:[...document.querySelectorAll('a[href]')].filter(a=>a.origin===location.origin&&!a.hasAttribute('download')&&(/\.html$/.test(a.pathname)||a.pathname.endsWith('/'))).map(a=>a.search),
    ads:[...document.scripts].some(s=>s.src.includes('googlesyndication'))}));
   check(state.title===catalogs[locale.code][key],`${page}/${locale.code}: title mismatch`);
   check(state.dir===locale.dir,`${page}/${locale.code}: direction mismatch`);
   check(state.htmlH1===1&&!state.overflow,`${page}/${locale.code}: heading/layout`);
   check(!state.canonical.includes('?'),`${page}/${locale.code}: canonical changed`);
   check(!state.ads,`${page}/${locale.code}: ads activated`);
   check(state.links.every(search=>new URLSearchParams(search).get('lang')===(locale.code==='en'?null:locale.code)),`${page}/${locale.code}: lost link language`);
   results.push({page,language:locale.code,pass:true});
  }
 }
 return results;
}

// Focused regressions: generated clone provenance, protected user content and exact errors.
// Keep independent of the smoke flows so a failure identifies the regression directly.
const interpolate = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key]));
async function selectLocale(tab, code) {
 await tab.playwright.locator('#site-language').selectOption(code);
 await tab.playwright.locator(`html[lang="${code}"]`).waitFor({state:'attached'});
}
async function statusEquals(tab, expected, context) {
 const actual=(await tab.playwright.locator('#status').textContent()).trim();
 check(actual===expected,`${context}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
export async function regressionFlow(tab,base,catalogs,app) {
 await tab.goto(base+'?lang=vi');
 await tab.playwright.locator('html[data-i18n-ready="true"][lang="vi"]').waitFor({state:'attached'});
 if(app==='subtitle-studio') {
  await selectLocale(tab,'ar');
  await tab.playwright.locator('#source').fill('1\n00:00:04,000 --> 00:00:06,000\nFREE');
  await tab.playwright.locator('#offset').fill('-10');
  await tab.playwright.locator('#process').click();
  await statusEquals(tab,catalogs.ar.k361,'Arabic negative-offset error');
  check(!(await tab.playwright.locator('#download').isEnabled()),'negative-offset error permits download');
  await tab.playwright.locator('#offset').fill('0');
  const invalidTimestamp='00:99:04,000';
  await tab.playwright.locator('#source').fill(`1\n${invalidTimestamp} --> 00:00:06,000\nFREE`);
  await tab.playwright.locator('#process').click();
  await statusEquals(tab,interpolate(catalogs.ar.k204,{value:invalidTimestamp}),'Arabic invalid-timestamp error');
  check(!(await tab.playwright.locator('#download').isEnabled()),'invalid-timestamp error permits download');
  return {exactNegativeOffsetError:true,exactTimestampError:true};
 }
 check(app==='party-paper',`Unsupported regression app: ${app}`);
 const userTitle='FREE';
 const items=['FREE','A toast',...Array.from({length:22},(_,i)=>`Guest ${i+1}`)];
 await tab.playwright.locator('#title').fill(userTitle);
 await tab.playwright.locator('#items').fill(items.join('\n'));
 await tab.playwright.locator('#count').fill('2');
 await tab.playwright.locator('#generate').click();
 await tab.playwright.locator('#next').click();
 check((await tab.playwright.locator('#page-number').textContent())==='2 / 2','bingo Next failed');
 // The second preview is cloned from an already translated hidden print sheet.
 // Its original English source must survive vi -> Next -> en and subsequent switches.
 for(const code of ['vi','en','ar','en']) {
  await selectLocale(tab,code);
  const state=await tab.playwright.evaluate(()=>({
   title:document.querySelector('#title').value,items:document.querySelector('#items').value,
   previewTitle:document.querySelector('#preview .preview-title [data-user-content]').textContent,
   previewInstruction:document.querySelector('#preview .print-sheet > p.small').textContent,
   previewCells:[...document.querySelectorAll('#preview .cell:not(.free)')].map(el=>el.textContent).sort(),
   center:document.querySelector('#preview .cell.free').textContent,
   sheets:[...document.querySelectorAll('#sheets .print-sheet')].map(sheet=>({
    title:sheet.querySelector('.preview-title [data-user-content]').textContent,
    instruction:sheet.querySelector('p.small').textContent,
    cells:[...sheet.querySelectorAll('.cell:not(.free)')].map(el=>el.textContent).sort()
   }))
  }));
  check(state.title===userTitle&&state.previewTitle===userTitle,`${code}: FREE user title changed`);
  check(state.items===items.join('\n'),`${code}: bingo input changed`);
  check(JSON.stringify(state.previewCells)===JSON.stringify([...items].sort()),`${code}: bingo user cells changed`);
  check(state.center===catalogs[code].k145,`${code}: generated free center not translated`);
  check(state.previewInstruction===interpolate(catalogs[code].k083,{number:2,count:2}),`${code}: cloned bingo instruction retained previous locale`);
  check(state.sheets.length===2,`${code}: missing print sheets`);
  state.sheets.forEach((sheet,index)=>{
   check(sheet.title===userTitle&&JSON.stringify(sheet.cells)===JSON.stringify([...items].sort()),`${code}: print-sheet user content changed`);
   check(sheet.instruction===interpolate(catalogs[code].k083,{number:index+1,count:2}),`${code}: hidden bingo instruction not translated`);
  });
 }
 await selectLocale(tab,'vi');
 await tab.playwright.locator('#mode').selectOption('search');
 await tab.playwright.locator('#title').fill(userTitle);
 const words='FREE\nPARTY\nMUSIC';
 await tab.playwright.locator('#items').fill(words);
 await tab.playwright.locator('#size').selectOption('14');
 await tab.playwright.locator('#generate').click();
 for(const code of ['vi','en','ar','en']) {
  await selectLocale(tab,code);
  // Return to the puzzle to verify the user word list as well as the key page.
  if(await tab.playwright.locator('#previous').isEnabled()) await tab.playwright.locator('#previous').click();
  const puzzle=await tab.playwright.evaluate(()=>({
   title:document.querySelector('#title').value,items:document.querySelector('#items').value,
   instruction:document.querySelector('#preview .print-sheet > p.small').textContent,
   wordList:document.querySelector('#preview .print-sheet > p[data-user-content]').textContent,
   printWordList:document.querySelector('#sheets .print-sheet > p[data-user-content]').textContent
  }));
  check(puzzle.title===userTitle&&puzzle.items===words,`${code}: word-search input changed`);
  check(puzzle.wordList==='FREE · PARTY · MUSIC'&&puzzle.printWordList===puzzle.wordList,`${code}: FREE user word list translated`);
  check(puzzle.instruction===catalogs[code].k149,`${code}: puzzle instruction not translated`);
  await tab.playwright.locator('#next').click();
  const answer=await tab.playwright.evaluate(()=>({
   previewTitle:document.querySelector('#preview .preview-title [data-user-content]').textContent,
   label:document.querySelector('#preview .preview-title > span:not([data-user-content])')?.textContent,
   instruction:document.querySelector('#preview .print-sheet > p.small').textContent,
   printTitle:document.querySelector('#sheets .print-sheet:last-child .preview-title [data-user-content]').textContent,
   printLabel:document.querySelector('#sheets .print-sheet:last-child .preview-title > span:not([data-user-content])')?.textContent,
   printInstruction:document.querySelector('#sheets .print-sheet:last-child > p.small').textContent
  }));
  check(answer.previewTitle===userTitle&&answer.printTitle===userTitle,`${code}: answer-key user title translated`);
  check(answer.label===catalogs[code].k444&&answer.printLabel===catalogs[code].k444,`${code}: answer-key label missing or not translated`);
  check(answer.instruction===catalogs[code].k305&&answer.printInstruction===catalogs[code].k305,`${code}: cloned answer-key instruction retained previous locale`);
 }
 await selectLocale(tab,'ar');
 await tab.playwright.locator('#items').fill('你好');
 await tab.playwright.locator('#size').selectOption('14');
 await tab.playwright.locator('#generate').click();
 await statusEquals(tab,interpolate(catalogs.ar.k369,{size:14}),'Arabic unsupported word-search error');
 check(!(await tab.playwright.locator('#print').isEnabled()),'unsupported words permit printing');
 return {cloneSwitchback:true,answerKeyLabels:true,userContentPreserved:true,exactWordSearchError:true};
}
export async function mobileMatrix(tab,fixture,locales){
 await tab.goto(fixture);
 const results=[];
 for(const app of ['subtitle-studio','party-paper']){
  await tab.playwright.locator('#app').selectOption(app);
  const frame=tab.playwright.frameLocator('iframe');
  await frame.locator(app==='party-paper'?'#generate':'#process').waitFor({state:'visible'});
  await frame.locator('html[data-i18n-ready="true"]').waitFor({state:'attached'});
  for(const width of ['320','390']){
   await tab.playwright.locator('#width').selectOption(width);
   for(const locale of locales){
    await frame.locator('#site-language').selectOption(locale.code);
    await frame.locator(`html[lang="${locale.code}"]`).waitFor({state:'attached'});
    const metrics=await frame.locator('html').evaluate(el=>({width:el.ownerDocument.defaultView.innerWidth,scroll:el.scrollWidth}));
    if(metrics.scroll>metrics.width+1) console.error('[e2e:mobile]',{app,width,locale:locale.code,...metrics});
    check(metrics.scroll<=metrics.width+1,`${app}/${width}/${locale.code}: horizontal overflow ${JSON.stringify(metrics)}`);
    results.push({app,width,language:locale.code,pass:true});
   }
  }
 }
 return results;
}
export async function persistenceFlow(tab,base){
 await tab.goto(base+'?lang=en');
 await tab.playwright.locator('html[data-i18n-ready="true"]').waitFor({state:'attached'});
 await selectLocale(tab,'vi');
 await tab.playwright.locator('header nav a[href*="guide.html"]').click();
 await tab.playwright.locator('html[data-i18n-ready="true"][lang="vi"]').waitFor({state:'attached'});
 check((await tab.url()).includes('lang=vi'),'guide navigation lost language');
 await tab.goto(base);
 await tab.playwright.locator('html[lang="vi"]').waitFor({state:'attached'});
 await selectLocale(tab,'en');
 await tab.playwright.locator('#site-language').press('ArrowDown');
 await tab.playwright.locator('html[lang="zh"]').waitFor({state:'attached'});
 return {navigation:true,storedPreference:true,keyboard:true};
}
