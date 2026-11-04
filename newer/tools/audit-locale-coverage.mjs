/* Source-only release gate: distinguish English fallbacks from completed translations.
   Never generate or publish unapproved exhibition copy. */
import fs from 'node:fs';
const rooms=['antijudaism.html','antisemitism.html','exhibition.html',
  'colonialism.html','apartheid.html','genocide.html',
  'historical-sources.html','deicide-museum-film.html'];
const destinations=['antijudaism.html','antisemitism.html','exhibition.html','historical-sources.html'];
const report={complete:false,locales:{},missingTranslationPages:0,unmarkedFallbacks:0};
for(const lang of ['ru','he']){
  const html=fs.readFileSync(lang+'/entrance.html','utf8');
  const missing=rooms.filter(file=>!fs.existsSync(lang+'/'+file));
  const unmarked=destinations.filter(file=>!html.includes('href="'+file+'" hreflang="en"'));
  report.locales[lang]={missingTranslationPages:missing,unmarkedEnglishFallbacks:unmarked};
  report.missingTranslationPages+=missing.length;
  report.unmarkedFallbacks+=unmarked.length;
}
report.complete=report.missingTranslationPages===0 && report.unmarkedFallbacks===0;
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--strict')&&!report.complete)process.exitCode=1;
