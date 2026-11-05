/** @typedef {{start:number,end:number,text:string}} Cue */
export function timestamp(value) {
 const match=/^(?:(\d{2,}):)?([0-5]\d):([0-5]\d)[,.](\d{3})$/.exec(value.trim());
 if(!match) throw new Error(`Invalid timestamp: ${value}`);
 return ((Number(match[1]||0)*60+Number(match[2]))*60+Number(match[3]))*1000+Number(match[4]);
}
export function formatTime(ms,format='srt') {
 if(!Number.isSafeInteger(ms)||ms<0) throw new Error('Invalid timestamp value.');
 const hours=Math.floor(ms/3600000),minutes=Math.floor(ms/60000)%60,seconds=Math.floor(ms/1000)%60;
 return [hours,minutes,seconds].map(n=>String(n).padStart(2,'0')).join(':')+(format==='vtt'?'.':',')+String(ms%1000).padStart(3,'0');
}
/** @returns {{cues:Cue[],warnings:string[]}} */
export function parseSubtitles(input) {
 const normalized=input.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
 if(!normalized) throw new Error('Add a subtitle file or paste subtitle text first.');
 const blocks=normalized.split(/\n[ \t]*\n/);const cues=[],warnings=[];
 for(const block of blocks){
  const lines=block.split('\n');
  if(/^(WEBVTT(?:[ \t].*)?$|NOTE(?:[ \t]|$)|STYLE$|REGION$)/.test(lines[0])){if(!lines[0].startsWith('WEBVTT'))warnings.push('VTT metadata omitted from converted output.');continue;}
  const timing=lines.findIndex(line=>line.includes('-->'));
  if(timing<0||timing>1)throw new Error(`Cannot read subtitle block ${cues.length+1}. Expected SRT or WebVTT timestamps.`);
  const match=/^(\S+)\s+-->\s+(\S+)(.*)$/.exec(lines[timing]);
  if(!match)throw new Error('Malformed timing line.');
  const start=timestamp(match[1]),end=timestamp(match[2]),text=lines.slice(timing+1).join('\n');
  if(end<=start)throw new Error(`Cue ${cues.length+1} must end after it starts.`);
  if(!text.trim())throw new Error(`Cue ${cues.length+1} has no text.`);
  if(match[3].trim())warnings.push(`Cue ${cues.length+1}: positioning settings omitted.`);
  if(cues.length&&start<cues[cues.length-1].end)warnings.push(`Cue ${cues.length+1} overlaps the previous cue.`);
  if(text.split('\n').some(line=>line.length>42))warnings.push(`Cue ${cues.length+1} contains a line over 42 characters.`);
  cues.push({start,end,text});
 }
 if(!cues.length)throw new Error('No subtitle cues found.');
 return {cues,warnings};
}
export function shiftCues(cues,seconds){
 if(!Number.isFinite(seconds)||Math.abs(seconds)>86400)throw new Error('Choose an offset between -86400 and 86400 seconds.');
 const offset=Math.round(seconds*1000);
 if(cues.some(c=>c.start+offset<0))throw new Error('This offset moves a cue before 00:00:00. Reduce the negative offset.');
 return cues.map(c=>({...c,start:c.start+offset,end:c.end+offset}));
}
export function serialize(cues,format){
 if(!['srt','vtt'].includes(format))throw new Error('Unsupported output format.');
 return (format==='vtt'?'WEBVTT\n\n':'')+cues.map((c,i)=>`${i+1}\n${formatTime(c.start,format)} --> ${formatTime(c.end,format)}\n${c.text}`).join('\n\n')+'\n';
}
