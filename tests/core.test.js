import test from 'node:test';import assert from 'node:assert/strict';import {parseSubtitles,shiftCues,serialize,timestamp} from '../core.js';
const source='1\r\n00:00:01,000 --> 00:00:03,000\r\nXin chào <i>world</i>\r\nsecond line\r\n';
test('SRT to VTT round trip preserves text and milliseconds',()=>{const {cues}=parseSubtitles(source);assert.deepEqual(parseSubtitles(serialize(cues,'vtt')).cues,cues);});
test('shifts precisely and rejects negative start',()=>{const {cues}=parseSubtitles(source);assert.equal(shiftCues(cues,.123)[0].start,1123);assert.throws(()=>shiftCues(cues,-2));});
test('rejects empty, invalid timestamps, reverse duration and malformed blocks',()=>{for(const s of ['', 'nonsense', '1\n00:00:99,000 --> 00:00:03,000\nX','1\n00:00:04,000 --> 00:00:03,000\nX'])assert.throws(()=>parseSubtitles(s));});
test('accepts VTT short timestamps and BOM',()=>{assert.equal(parseSubtitles('\uFEFFWEBVTT\n\nx\n00:01.100 --> 00:02.000 align:start\nHi').cues[0].start,1100);assert.equal(timestamp('01:00:00.000'),3600000);});
test('warns on overlap and long lines',()=>{const {warnings}=parseSubtitles(source+'\n2\n00:00:02,000 --> 00:00:04,000\n'+'x'.repeat(43));assert.equal(warnings.length,2);});
