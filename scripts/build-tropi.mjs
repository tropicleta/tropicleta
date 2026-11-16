import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root='game/tropi/';
const hash=createHash('sha256');
for(const file of ['bike-model.mjs','bike-course.mjs','bike-geometry.mjs','bike-suspension.mjs','bike-spec.mjs','bike-cactus.mjs','ranking/replay.mjs'])hash.update(await readFile(root+file));
const rules='tropi-'+hash.digest('hex').slice(0,20);
await writeFile(root+'ruleset.mjs',`export const RULESET=${JSON.stringify(rules)};\n`);
await build({entryPoints:[root+'bike-client.mjs'],bundle:true,format:'esm',minify:true,define:{__TROPI_RANKING_ENABLED__:'true'},outfile:'public/juegos/tropi/bike.js'});
const version=createHash('sha256').update(await readFile('public/juegos/tropi/bike.js')).digest('hex').slice(0,12);
const html=await readFile('public/juegos/tropi/index.html','utf8');
await writeFile('public/juegos/tropi/index.html',html.replace(/bike\.js\?v=[a-f0-9]+/,`bike.js?v=${version}`));
console.log('Tropi ranking:',rules,version);
