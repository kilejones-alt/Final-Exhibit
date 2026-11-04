/* Code/route parity only. Curatorial translation accuracy requires human approval. */
import fs from 'node:fs';
const rooms=['antijudaism.html','antisemitism.html','exhibition.html',
 'colonialism.html','apartheid.html','genocide.html',
 'historical-sources.html','deicide-museum-film.html'];
const entryTargets=['antijudaism.html','antisemitism.html','exhibition.html','historical-sources.html'];
const report={routeCoverageComplete:false,editorialTranslationApproved:false,locales:{},missingRooms:0,brokenLocalizedNavigation:0};
for(const lang of ['ru','he']){
 const html=fs.readFileSync(lang+'/entrance.html','utf8');
 const missingRooms=rooms.filter(name=>!fs.existsSync(lang+'/'+name));
 const brokenLocalizedNavigation=entryTargets.filter(name=>!html.includes('href="'+lang+'/'+name+'" hreflang="'+lang+'"'));
 report.locales[lang]={missingRooms,brokenLocalizedNavigation};
 report.missingRooms+=missingRooms.length;
 report.brokenLocalizedNavigation+=brokenLocalizedNavigation.length;
}
report.routeCoverageComplete=!report.missingRooms&&!report.brokenLocalizedNavigation;
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--strict')&&!report.routeCoverageComplete)process.exitCode=1;
