import test from 'node:test';
import assert from 'node:assert/strict';
import { eligible, mountAd } from './assets/ads.js';
import { readFileSync } from 'node:fs';
const ready = { enabled: true, siteApproved: true, publisherId: 'ca-pub-1234567890123456', slotId: '1234567890' };
test('ads require approval, valid identifiers and affirmative consent', () => {
  assert.equal(eligible(ready, true), true);
  for (const consent of [false, undefined, null, 'true']) assert.equal(eligible(ready, consent), false);
  for (const changes of [{enabled:false},{siteApproved:false},{publisherId:''},{publisherId:'ca-pub-invalid'},{slotId:''}]) assert.equal(eligible({...ready,...changes}, true), false);
});
test('shipping configuration cannot request ads or expose the slot', async () => {
 const config = JSON.parse(readFileSync(new URL('./assets/ads-config.json', import.meta.url)));
 assert.equal(config.enabled, false);
 const slot = {hidden:true};
 const doc = {querySelector:()=>slot, createElement:()=>{throw new Error('Unexpected network setup');}};
 assert.equal(await mountAd(config,{consent:true,doc,win:{}}),false);
 assert.equal(await mountAd(ready,{doc,win:{}}),false);
 assert.equal(slot.hidden,true);
});
test('blocked advertising fails without breaking the tool', async () => {
 const slot = {hidden:true};
 const doc = {querySelector:()=>slot, createElement:()=>({}), head:{append:script=>script.onerror()}};
 assert.equal(await mountAd(ready,{consent:true,doc,win:{}}),false);
 assert.equal(slot.hidden,true);
});
