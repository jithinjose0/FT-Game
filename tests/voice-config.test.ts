import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {voiceConfiguration,voiceIceServers,voiceStatus,configuredVoiceIceServers} from '../packages/server/src/voice.ts';

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

test('managed TURN credentials are fetched privately and provider failures are sanitized',async()=>{
  const keys=['VOICE_METERED_HOST','VOICE_METERED_API_KEY'] as const,previous=keys.map(key=>process.env[key]),originalFetch=globalThis.fetch;
  try{
    process.env.VOICE_METERED_HOST='test-app.metered.live';
    process.env.VOICE_METERED_API_KEY='private-test-api-key';
    globalThis.fetch=async input=>{
      const url=new URL(String(input));assert.equal(url.hostname,'test-app.metered.live');assert.equal(url.searchParams.get('apiKey'),'private-test-api-key');
      return new Response(JSON.stringify([{urls:'stun:relay.example.com:80'},{urls:['turns:relay.example.com:443?transport=tcp'],username:'issued-user',credential:'issued-password'}]));
    };
    const result=await configuredVoiceIceServers('player');
    assert.equal(result.length,2);assert.ok(!JSON.stringify(result).includes('private-test-api-key'));
    globalThis.fetch=async()=>new Response('provider-private-detail',{status:401});
    await assert.rejects(configuredVoiceIceServers('player'),/rejected the credential request/);
    globalThis.fetch=async()=>new Response(JSON.stringify([{urls:'https://not-turn.example.com'}]));
    await assert.rejects(configuredVoiceIceServers('player'),/invalid server URLs/);
    process.env.VOICE_METERED_HOST='localhost';assert.throws(voiceConfiguration,/Metered hostname/);
  }finally{globalThis.fetch=originalFetch;keys.forEach((key,i)=>{if(previous[i]===undefined)delete process.env[key];else process.env[key]=previous[i];});}
});
