// Non-destructive source audit for the official Three Eras exhibition.
// Run: node tools/audit-site-integrity.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const walk = (dir = '') => fs.readdirSync(path.join(root, dir), {withFileTypes:true})
  .flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name).replaceAll('\\','/')]);
const files = new Set(walk().filter(p => !p.startsWith('.git/')));
const htmlFiles = [...files].filter(p => p.endsWith('.html')).sort();
const problems = [], warnings = [];
const clean = s => s.replace(/&amp;/g, '&');
const decode = s => { try { return decodeURIComponent(s); } catch { return s; } };
const isExternal = s => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(s);
function resolve(baseFile, base, target) {
  let targetPath = clean(target).split(/[?#]/,1)[0];
  if (!targetPath || targetPath === '/') return null;
  const dir = path.posix.dirname(baseFile);
  const origin = base.startsWith('/') ? base.slice(1) : path.posix.normalize(path.posix.join(dir, base));
  return path.posix.normalize(targetPath.startsWith('/') ? targetPath.slice(1) : path.posix.join(origin, decode(targetPath)));
}
for (const file of htmlFiles) {
  const source = fs.readFileSync(path.join(root,file),'utf8');
  const base = source.match(/<base\s+href=["']([^"']+)["']/i)?.[1] ?? './';
  for (const match of source.matchAll(/\b(?:src|href|poster)=["']([^"']+)["']/gi)) {
    const value = match[1].trim();
    if (!value || value.startsWith('#') || isExternal(value) || /^(?:\.{1,2}\/)+$/.test(value)) continue;
    const target = resolve(file,base,value);
    if (target && !files.has(target) && !files.has(target.replace(/\/$/,'') + '/index.html') && ![...files].some(p => p.startsWith(target.replace(/\/$/,'')+'/'))) {
      problems.push(file + ': missing ' + value + ' -> ' + target);
    }
  }
  const anchors = [...source.matchAll(/\bid=["']([^"']+)["']/gi)].map(x=>x[1]);
  if (new Set(anchors).size < anchors.length) warnings.push(file+': duplicate id attribute');
  for (const match of source.matchAll(/\bhref=["']#([^"']+)["']/gi)) {
    const anchor = decode(match[1]);
    if (anchor && !anchors.includes(anchor)) problems.push(file+': missing same-page #'+anchor);
  }
  if (/\bname=["']robots["'][^>]+\bnoindex/i.test(source) && /\bdata-page-state=["']content["']/.test(source)) {
    warnings.push(file + ': content page is marked noindex');
  }
}
const reserved = [...files].filter(p => /^(?:he\/|ru\/)?pages\/page-\d+\.html$/.test(p));
if (reserved.length !== 60) problems.push('Expected 60 future-page shells, found '+reserved.length);
for (const file of reserved) {
  const source = fs.readFileSync(path.join(root,file),'utf8');
  if (!/name=["']robots["']\s+content=["']noindex,nofollow["']/.test(source)) problems.push(file+': blank-shell robots missing');
  if (!/data-page-state=["']blank["']/.test(source)) warnings.push(file+': future page has content state');
}
const filmFile = 'deicide-museum-film.html';
if (files.has(filmFile)) {
  const film = fs.readFileSync(path.join(root,filmFile),'utf8');
  const scenesMatch = film.match(/const SCENES=(\[[\s\S]*?\]);/);
  if (!scenesMatch) problems.push('Deicide film scenes array not found');
  else {
    const scenes = JSON.parse(scenesMatch[1]);
    let total=0;
    for (const [i,scene] of scenes.entries()) {
      if (!files.has(scene.photo)) problems.push('Deicide scene '+(i+1)+' missing '+scene.photo);
      if (!(scene.duration>0)) problems.push('Deicide scene '+(i+1)+' invalid duration');
      total += scene.duration;
    }
    if (scenes.length !== 14) warnings.push('Deicide film scene count '+scenes.length+' (expected 14)');
    // The curated film is defined by its scene durations, not a legacy
    // proposed duration. Check that the playback control agrees instead.
    const slider = film.match(/<input\b[^>]*\bid=["']progress["'][^>]*>/i)?.[0];
    const seekMax = Number(slider?.match(/\bmax=["']([0-9]+(?:\.[0-9]+)?)["']/i)?.[1]);
    if (!slider || !Number.isFinite(seekMax) || Math.abs(total-seekMax)>0.05)
      problems.push('Deicide film total '+total+'s does not match transport maximum '+(slider ? seekMax : 'missing')+'s');
  }
}
console.log(JSON.stringify({htmlFiles:htmlFiles.length,assetFiles:files.size,blankShells:reserved.length,problems,warnings},null,2));
if (problems.length) process.exitCode = 1;
