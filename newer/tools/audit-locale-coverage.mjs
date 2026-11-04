/* Publication gate for localized historical rooms.
   Every translated destination must exist; any English fallback must be
   explicitly marked, never disguised as a translated room.
   Translation draft existence does not equal editorial approval. */
import fs from 'node:fs';
const rooms=['antijudaism.html','antisemitism.html','exhibition.html',
  'colonialism.html','apartheid.html','genocide.html',
  'historical-sources.html','deicide-museum-film.html'];
const destinations=['antijudaism.html','antisemitism.html','exhibition.html','historical-sources.html'];
const report={structurallyComplete:false,editoriallyApproved:false,locales:{},missingTranslationPages:0,incorrectFallbackLabels:0};
for(const lang of ['ru','he']){
  const html=fs.readFileSync(lang+'/entrance.html','utf8');
  const missing=rooms.filter(file=>!fs.existsSync(lang+'/'+file));
  const incorrect=destinations.filter(file=>{
    const local=fs.existsSync(lang+'/'+file);
    const englishFlag=html.includes('href="'+file+'" hreflang="en"');
    return local?englishFlag:!englishFlag;
  });
  const pages=rooms.filter(file=>fs.existsSync(lang+'/'+file));
  const missingRTL=lang==='he'&&pages.some(file=>!/<html\b[^>]*\bdir=["']rtl["']/i.test(fs.readFileSync(lang+'/'+file,'utf8')));
  report.locales[lang]={pages:pages.length,missingTranslationPages:missing,
    incorrectlyMarkedDestinations:incorrect,missingRTL};
  report.missingTranslationPages+=missing.length;
  report.incorrectFallbackLabels+=incorrect.length;
  if(missingRTL)report.incorrectFallbackLabels++;
}
report.structurallyComplete=report.missingTranslationPages===0&&report.incorrectFallbackLabels===0;
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--strict')&&!report.structurallyComplete)process.exitCode=1;
