import {writeFile} from 'node:fs/promises';
import {generateTrack,serializeTrack,validateTrack} from '../packages/shared/src/track-generator.ts';
const track=generateTrack(),errors=validateTrack(track);
if(errors.length)throw Error(errors.join('\n'));
writeFile('levels/canyon-coop.json',serializeTrack(track)+'\n').then(()=>console.log(`Generated ${track.spline_nodes.length} nodes, ${track.track_segments.length} edges, ${track.hazards.length} hazards.`)).catch(error=>{console.error(error);process.exitCode=1;});
