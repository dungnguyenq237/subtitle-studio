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
