import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {voiceConfiguration,voiceIceServers,voiceStatus} from '../packages/server/src/voice.ts';

test('TURN configuration issues private expiring credentials and rejects incomplete setup',()=>{
  const keys=['VOICE_STUN_URLS','VOICE_TURN_URLS','VOICE_TURN_SECRET'] as const;
  const previous=keys.map(key=>process.env[key]);
  try{
    for(const key of keys)delete process.env[key];
    assert.deepEqual(voiceIceServers('player'),[]);
    assert.deepEqual(voiceStatus(),{stunConfigured:false,turnConfigured:false});
    process.env.VOICE_STUN_URLS='stun:relay.example.com:3478';
    process.env.VOICE_TURN_URLS='turn:relay.example.com:3478?transport=udp, turns:relay.example.com:5349?transport=tcp';
    assert.throws(voiceConfiguration,/Set both/);
    process.env.VOICE_TURN_SECRET='test-only-shared-secret';
    const before=Math.floor(Date.now()/1000),servers=voiceIceServers('player');
    assert.equal(servers.length,2);assert.equal(servers[1].urls.length,2);
    const username=servers[1].username!;
    const expires=Number(username.split(':')[0]);
    assert.ok(expires>=before+86400&&expires<=Math.floor(Date.now()/1000)+86400);
    assert.ok(username.endsWith(':player'));
    assert.equal(servers[1].credential,createHmac('sha1',process.env.VOICE_TURN_SECRET).update(username).digest('base64'));
    assert.ok(!JSON.stringify(servers).includes(process.env.VOICE_TURN_SECRET));
    assert.deepEqual(voiceStatus(),{stunConfigured:true,turnConfigured:true});
    process.env.VOICE_TURN_URLS='https://not-a-relay.example.com';
    assert.throws(voiceConfiguration,/turn: or turns:/);
  }finally{keys.forEach((key,i)=>{if(previous[i]===undefined)delete process.env[key];else process.env[key]=previous[i];});}
});
