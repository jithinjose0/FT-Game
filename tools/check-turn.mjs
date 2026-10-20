// Tests actual TURN allocation using credentials issued to an opted-in game client.
// Never prints credentials, SDP, IP candidates or provider secrets.
import {Client} from '@colyseus/sdk';
import net from 'node:net';
import tls from 'node:tls';
import dgram from 'node:dgram';
import {randomBytes,createHash,createHmac} from 'node:crypto';

const attr=(type,value)=>{const h=Buffer.alloc(4);h.writeUInt16BE(type);h.writeUInt16BE(value.length,2);return Buffer.concat([h,value,Buffer.alloc((4-value.length%4)%4)]);};
function request(attributes,key){
  const body=Buffer.concat(attributes),header=Buffer.alloc(20);header.writeUInt16BE(3);header.writeUInt16BE(body.length+(key?24:0),2);header.writeUInt32BE(0x2112a442,4);randomBytes(12).copy(header,8);
  const packet=Buffer.concat([header,body]);return key?Buffer.concat([packet,attr(8,createHmac('sha1',key).update(packet).digest())]):packet;
}
function parse(packet){const attrs=new Map();for(let p=20;p+4<=packet.length;){const type=packet.readUInt16BE(p),length=packet.readUInt16BE(p+2);attrs.set(type,packet.subarray(p+4,p+4+length));p+=4+length+(4-length%4)%4;}const error=attrs.get(9);return {type:packet.readUInt16BE(0),attrs,error:error?error[2]*100+error[3]:undefined};}
async function probe(url,username,credential){
  const match=/^(turns?):([^:?]+)(?::(\d+))?(?:\?transport=(udp|tcp))?$/.exec(url);
  if(!match)return {url,result:'Unsupported TURN URL'};
  const secure=match[1]==='turns',host=match[2],port=Number(match[3]||(secure?5349:3478)),udp=!secure&&match[4]!=='tcp';
  const socket=udp?dgram.createSocket('udp4'):secure?tls.connect({host,port,servername:host}):net.connect({host,port});
  const pending=new Set();let incoming=Buffer.alloc(0);
  const receive=packet=>{for(const listener of pending)listener(packet);};
  if(udp)socket.on('message',receive);else socket.on('data',chunk=>{incoming=Buffer.concat([incoming,chunk]);while(incoming.length>=20&&incoming.length>=20+incoming.readUInt16BE(2)){const size=20+incoming.readUInt16BE(2),packet=incoming.subarray(0,size);incoming=incoming.subarray(size);receive(packet);}});
  const exchange=packet=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(listener);reject(Error('Relay timed out'));},8000);
    const listener=response=>{if(!response.subarray(8,20).equals(packet.subarray(8,20)))return;clearTimeout(timer);pending.delete(listener);resolve(parse(response));};pending.add(listener);
    if(udp)socket.send(packet,port,host,error=>{if(error){clearTimeout(timer);pending.delete(listener);reject(error);}});else socket.write(packet);
  });
  try{
    if(!udp)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Connection timed out')),8000);socket.once(secure?'secureConnect':'connect',()=>{clearTimeout(timer);resolve();});socket.once('error',error=>{clearTimeout(timer);reject(error);});});
    socket.on('error',()=>{});
    const transport=attr(0x19,Buffer.from([17,0,0,0])),challenge=await exchange(request([transport]));
    if(challenge.error!==401)return {url,result:`Unexpected challenge ${challenge.error||challenge.type}`};
    const realm=challenge.attrs.get(0x14),nonce=challenge.attrs.get(0x15);if(!realm||!nonce)return {url,result:'Missing authentication challenge'};
    const key=createHash('md5').update(`${username}:${realm.toString()}:${credential}`).digest();
    const result=await exchange(request([transport,attr(6,Buffer.from(username)),attr(0x14,realm),attr(0x15,nonce)],key));
    return {url,result:result.type===0x103&&result.attrs.has(0x16)?'TURN allocation succeeded':`TURN allocation failed (${result.error||result.type})`};
  }catch(error){return {url,result:error.code||error.message};}finally{if(udp)socket.close();else socket.destroy();}
}
const address=process.argv[2]||'wss://fc-game.onrender.com';
const deadline=setTimeout(()=>{console.error('Diagnostic deadline exceeded');process.exit(1);},45000);
const room=await new Client(address).create('raft',{name:'Voice diagnostic',course:'lagoon'});
try{
  const config=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Voice configuration timed out')),10000);room.onMessage('snapshot',()=>{});room.onMessage('voice-peers',()=>{});room.onMessage('voice-config',value=>{clearTimeout(timer);resolve(value);});room.send('voice-ready',true);});
  let count=0;
  for(const server of config.iceServers)for(const url of typeof server.urls==='string'?[server.urls]:server.urls)if(url.startsWith('turn')){console.log(JSON.stringify(await probe(url,server.username,server.credential)));count++;}
  if(!count)console.log('No TURN servers configured');
}finally{clearTimeout(deadline);await Promise.race([room.leave(),new Promise(resolve=>setTimeout(resolve,1000))]);process.exit(0);}
