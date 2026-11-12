import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSubtitles,shiftCues,serialize} from '../core.js';
const read=name=>readFileSync(new URL('../assets/examples/'+name,import.meta.url),'utf8');
test('published examples reproduce the documented offset and conversion',()=>{
 const cues=parseSubtitles(read('delay.srt')).cues;
 const shifted=shiftCues(cues,-2);
 assert.equal(shifted[0].start,4000);
 assert.equal(shifted[0].end,6500);
 assert.equal(serialize(shifted,'srt'),read('delay-fixed.srt'));
 assert.equal(serialize(cues,'vtt'),read('converted.vtt'));
});
