import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import type { Score } from '@ft/shared';
import path from 'node:path';
const file=path.resolve(process.env.DATA_DIR || 'data','scores.json');
const cloud=process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY):null;
let queue=Promise.resolve();
async function localScores():Promise<Score[]> {try{return JSON.parse(await readFile(file,'utf8'));}catch{return [];}}
export async function scores():Promise<Score[]> {
  if(cloud) {const {data,error}=await cloud.from('runs').select('name,course,time,date,mode').order('time').limit(500);if(error)throw error;return data||[];}
  return (await localScores()).sort((a,b)=>a.time-b.time).slice(0,500);
}
export function saveScore(score:Score) {
  const task=queue.then(async()=>{
    if(cloud){const {error}=await cloud.from('runs').insert(score);if(error)throw error;return;}
    const list=await localScores();list.push(score);
    await mkdir(path.dirname(file),{recursive:true});
    await writeFile(file+'.tmp',JSON.stringify(list.sort((a,b)=>a.time-b.time).slice(0,500)));
    await rename(file+'.tmp',file);
  });
  queue=task.catch(()=>{});return task;
}
