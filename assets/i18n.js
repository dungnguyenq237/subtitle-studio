import { languages } from './languages.js';
export { languages };
const sourceURL = new URL('./i18n/en.json', import.meta.url);
let source = {}, dictionary = {}, current = 'en', sequence = 0;
const originals = new WeakMap();
const attributes = new WeakMap();
const excluded = 'script,style,svg,pre,code,textarea,[data-user-content],.language-control,#output,#demo-clock,.cell:not(.free)';
export function resolveLanguage(value) { return languages.some(l => l.code === value) ? value : 'en'; }
export function buildTranslator(source, dictionary) {
 const reverse = new Map(Object.entries(source).map(([id,text])=>[text,id]));
 const patterns = Object.entries(source).filter(([,text])=>text.includes('{')).map(([id,text])=>{
  const names=[];
  const escaped=text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\{(\w+)\\\}/g,(_,name)=>{names.push(name);return '(.+?)';});
  return {id,names,regex:new RegExp('^'+escaped+'$')};
 });
 const render = text => {
  const id = reverse.get(text);
  if (id) return dictionary[id] ?? text;
  const stats = /^(\d+) (cues|notes)$/.exec(text);
  if (stats) return stats[1] + ' ' + render(stats[2]);
  const ends = /^Ends (.+)$/.exec(text); if (ends) return render('Ends') + ' ' + ends[1];
  for (const {regex,id:key,names} of patterns) {
   const match=regex.exec(text);
   if (match) return (dictionary[key]??source[key]).replace(/\{(\w+)\}/g,(_,name)=>match[names.indexOf(name)+1]);
  }
  return text;
 };
 return render;
}
let render = text => text;
export function translate(text) { return render(text); }
function excludedNode(node) {
 if (node.parentElement?.id === 'output' && !node.parentElement.dataset.userContent) return false;
 return !node.parentElement || node.parentElement.closest(excluded);
}
function localizeText(node) {
 if (excludedNode(node)) return;
 const text = node.nodeValue;
 const record = originals.get(node);
 const original = record && record.rendered === text ? record.original : text;
 const trimmed = original.trim();
 if (!trimmed) return;
 const rendered = original.replace(trimmed, () => translate(trimmed));
 originals.set(node,{original,rendered});
 if (rendered !== text) node.nodeValue = rendered;
}
function refresh(root = document.documentElement) {
 const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
 while (walker.nextNode()) localizeText(walker.currentNode);
 for (const el of root.querySelectorAll('[aria-label],[placeholder],meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]')) {
  if (el.closest('script,style,svg,pre,code,[data-user-content],.language-control')) continue;
  const record = attributes.get(el) ?? {};
  for (const name of ['aria-label','placeholder','content']) {
   if (!el.hasAttribute(name)) continue;
   const now = el.getAttribute(name);
   const original = record[name]?.rendered === now ? record[name].original : now;
   const rendered = translate(original);
   record[name] = {original,rendered};
   if (now !== rendered) el.setAttribute(name,rendered);
  }
  attributes.set(el,record);
 }
 for (const a of document.querySelectorAll('a[href]')) {
  const url = new URL(a.href,location.href);
  if (url.origin !== location.origin || a.hasAttribute('download') || !(/\.html$/.test(url.pathname) || url.pathname.endsWith('/'))) continue;
  current === 'en' ? url.searchParams.delete('lang') : url.searchParams.set('lang',current);
  a.href = url.pathname + url.search + url.hash;
 }
}
// cloneNode does not copy WeakMap source text. Preserve it before localizing previews.
export function cloneLocalized(node) {
 const clone=node.cloneNode(true);
 const originalWalker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
 const cloneWalker=document.createTreeWalker(clone,NodeFilter.SHOW_TEXT);
 while(originalWalker.nextNode() && cloneWalker.nextNode()) {
  const record=originals.get(originalWalker.currentNode);
  if(record) originals.set(cloneWalker.currentNode,{...record});
 }
 const oldElements=[node,...node.querySelectorAll('*')];
 const newElements=[clone,...clone.querySelectorAll('*')];
 oldElements.forEach((el,index)=>{
  const record=attributes.get(el);
  if(record) attributes.set(newElements[index],Object.fromEntries(Object.entries(record).map(([name,value])=>[name,{...value}])));
 });
 refresh(clone);
 return clone;
}
async function readCatalog(code) {
 const response = await fetch(new URL(`./i18n/${code}.json`,import.meta.url),{signal:AbortSignal.timeout(10000)});
 if (!response.ok) throw new Error('Translation unavailable');
 const data = await response.json();
 if (!data || Object.keys(source).some(key => typeof data[key] !== 'string')) throw new Error('Incomplete translation');
 return data;
}
export async function changeLanguage(code, {persist = true} = {}) {
 const requested = resolveLanguage(code), request = ++sequence;
 let next;
 try { next = requested === 'en' ? source : await readCatalog(requested); }
 catch { if (request === sequence) { await changeLanguage('en',{persist}); document.querySelector('.language-status').textContent = 'Translation unavailable. Showing English.'; } return false; }
 if (request !== sequence) return false;
 dictionary = next; render = buildTranslator(source,dictionary); current = requested;
 const locale = languages.find(l => l.code === current);
 document.documentElement.lang = current;
 document.documentElement.dir = locale.dir;
 document.querySelector('#site-language').value = current;
 document.querySelector('#site-language').setAttribute('aria-label',translate('Choose language'));
 document.querySelector('.language-status').textContent = '';
 document.querySelector('label[for="site-language"]').textContent = translate('Language');
 const url = new URL(location.href);
 current === 'en' ? url.searchParams.delete('lang') : url.searchParams.set('lang',current);
 history.replaceState(null,'',url);
 if (persist) try { localStorage.setItem('site-language',current); } catch { /* Storage may be disabled. */ }
 refresh();
 document.dispatchEvent(new CustomEvent('site-language-change',{detail:{language:current}}));
 return true;
}
async function start() {
 const header = document.querySelector('header'); if (!header) return;
 const control = document.createElement('div'); control.className = 'language-control no-print';
 const label = document.createElement('label');label.htmlFor = 'site-language';label.textContent = 'Language';
 const select = document.createElement('select');select.id = 'site-language';select.setAttribute('aria-label','Choose language');
 for (const locale of languages) { const option = new Option(`${locale.flag} ${locale.name}`,locale.code); option.lang = locale.code; option.dir = locale.dir;select.add(option); }
 const status = document.createElement('span');status.className = 'language-status';status.setAttribute('role','status');
 control.append(label,select,status);header.append(control);
 try { const response = await fetch(sourceURL,{signal:AbortSignal.timeout(10000)}); if (!response.ok) throw new Error(); source = await response.json(); } catch { select.disabled=true;status.textContent='Translation unavailable. Showing English.';return; }
 dictionary = source;
 select.addEventListener('change',()=>{void changeLanguage(select.value);});
 let saved;try{saved=localStorage.getItem('site-language');}catch{}
 const requested = new URL(location.href).searchParams.get('lang') ?? saved ?? 'en';
 await changeLanguage(requested,{persist:false});
 let queued=false;
 new MutationObserver(records=>{
  if (queued || records.every(r=>{ const el=r.target.nodeType===1?r.target:r.target.parentElement; return el?.closest('.language-control,#demo-clock,#output,[data-user-content]'); })) return;
  queued=true;queueMicrotask(()=>{queued=false;refresh();});
 }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder']});
 document.documentElement.dataset.i18nReady='true';
}
if (typeof document !== 'undefined') void start();
