from pathlib import Path
from html.parser import HTMLParser
import re, json

ROOT = Path.cwd()
SITE = ROOT / 'newer'
VERSION = '20261104-polish1'

class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.skip += 1
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.skip -= 1
    def handle_data(self, data):
        if not self.skip: self.parts.append(data)

def words(raw):
    p = VisibleText(); p.feed(raw)
    return re.sub(r'\s+', ' ', ' '.join(p.parts)).strip()

def replace_once(s, old, new, file):
    assert s.count(old) == 1, f'Expected exactly one match in {file}: {old[:85]}'
    return s.replace(old, new, 1)

def read(path):
    return path.read_bytes().decode('utf-8')

def write(path, s):
    path.write_bytes(s.encode('utf-8'))

changed = []
joins = {
    'antijudaism.html': [('associated with Dr.</p>\n<p>Naya Lekht', 'associated with Dr. Naya Lekht')],
    'colonialism.html': [
        ('“Israel: A Colonial-Settler State?”</p>\n<p>(1967)', '“Israel: A Colonial-Settler State?” (1967)'),
        ('In Beware: Zionism!</p>\n<p>(1969)', 'In Beware: Zionism! (1969)'),
    ],
}
for folder in [SITE, SITE/'ru', SITE/'he']:
    for path in sorted(folder.glob('*.html')):
        if path.name in ('index.html', 'deicide-museum-film.html', 'gallery.html', 'overview.html'):
            continue
        old = s = read(path)
        if folder == SITE:
            for before, after in joins.get(path.name, []):
                s = replace_once(s, before, after, str(path))
        s = re.sub(r'(museum-global\.js\?v=)[^"\'\s>]+', r'\g<1>'+VERSION, s)
        s = re.sub(r'(museum-precision-finish\.css\?v=)[^"\'\s>]+', r'\g<1>'+VERSION, s)
        if s != old:
            assert words(s) == words(old), f'Visible text changed: {path}'
            write(path, s); changed.append(str(path.relative_to(ROOT)))

path = SITE/'museum-global.js'
s = read(path)
s = replace_once(s, "eras: ['Antijudaism', 'Antisemitism', 'Antizionism']", "eras: ['Antijudaism', 'Antisemitism', 'Antizionism'], libels: ['Colonialism', 'Apartheid and Racism Libels', 'Genocide']", str(path))
s = replace_once(s, "eras: ['אנטי־יהדות', 'אנטישמיות', 'אנטי־ציונות']", "eras: ['אנטי־יהדות', 'אנטישמיות', 'אנטי־ציונות'], libels: ['קולוניאליזם', 'עלילות האפרטהייד והגזענות', 'רצח עם']", str(path))
s = replace_once(s, "eras: ['Антииудаизм', 'Антисемитизм', 'Антисионизм']", "eras: ['Антииудаизм', 'Антисемитизм', 'Антисионизм'], libels: ['Колониализм', 'Обвинения в апартеиде и расизме', 'Геноцид']", str(path))
for name, label, i in [('colonialism.html','Colonialism',0),('apartheid.html','Apartheid and Racism Libels',1),('genocide.html','Genocide',2)]:
    s = replace_once(s, f"[roomPrefix+'{name}', '{label}',", f"[roomPrefix+'{name}', text.libels[{i}],", str(path))
start = s.index('    const rect=link.getBoundingClientRect();')
end = s.index('    if(changed){', start)
assert "preview.style.top=top+'px';" in s[start:end]
block = """    const rect=link.getBoundingClientRect();
    const visual=window.visualViewport;
    const screenWidth=Math.min(innerWidth,visual?.width || innerWidth);
    const screenHeight=Math.min(innerHeight,visual?.height || innerHeight);
    const originX=visual?.offsetLeft || 0;
    const originY=visual?.offsetTop || 0;
    const edge=12;
    const desiredWidth=art ? Math.min(finePointer?460:292,screenWidth*(finePointer?.54:.77)) : Math.min(finePointer?275:225,screenWidth-28);
    const desiredHeight=art ? Math.min(finePointer?360:248,screenHeight*(finePointer?.46:.31)) : Math.min(finePointer?284:245,Math.max(165,screenHeight*.34));
    const vw=Math.max(1,Math.min(desiredWidth,screenWidth-edge*2));
    const vh=Math.max(1,Math.min(desiredHeight,screenHeight-edge*2));
    preview.style.width=vw+'px';
    preview.style.height=vh+'px';
    const left=Math.max(originX+edge,Math.min(originX+screenWidth-vw-edge,rect.left+rect.width/2-vw/2));
    preview.style.left=left+'px';
    let top=rect.bottom+10;
    if(top+vh>originY+screenHeight-edge)top=rect.top-vh-10;
    top=Math.max(originY+edge,Math.min(top,originY+screenHeight-vh-edge));
    preview.style.top=top+'px';
    // Retain the existing expansion from its dot, with no timing change.
    preview.style.setProperty('--dot-origin-x',(rect.left+rect.width/2-left).toFixed(1)+'px');
    preview.style.setProperty('--dot-origin-y',(rect.top+rect.height/2-top).toFixed(1)+'px');
"""
s = s[:start] + block + s[end:]
anchor = "  addEventListener('keydown',event=>{if(event.key==='Escape')closePreview()});"
s = replace_once(s, anchor, anchor+"\n  // Dismiss stale coordinates on rotation, browser resizing, or pinch zoom.\n  addEventListener('resize',closePreview,{passive:true});\n  window.visualViewport?.addEventListener('resize',closePreview,{passive:true});\n  window.visualViewport?.addEventListener('scroll',closePreview,{passive:true});", str(path))
write(path,s);changed.append(str(path.relative_to(ROOT)))

path = SITE/'museum-precision-finish.css'
s = read(path)
assert 'Final editorial and timeline polish' not in s
s += """
/* Final editorial and timeline polish: no page-layout or animation changes. */
body:is(.gallery-polished,.home-selected,.scholarly-sources) main :is(h1,h2,h3,h4){
  break-after:avoid;page-break-after:avoid;
}
body:is(.gallery-polished,.home-selected,.scholarly-sources) main :is(p,li){
  orphans:3;widows:3;
}
body.gallery-polished main .artifact-copy>.date{
  margin-block:8px 6px!important;
}
body.gallery-polished main .artifact-copy>.object-credit{
  margin-block:6px 0!important;line-height:1.5!important;
}
body.gallery-polished main .object-caption-line{
  column-gap:.55em!important;row-gap:4px!important;
}
body.museum-gallery-enabled #museum-gallery-rail .museum-rail-image[aria-current="page"]:not(:focus-visible):not(.is-revealed) .museum-rail-dot{
  background:#f0e4ec!important;opacity:1!important;
  box-shadow:0 0 0 3px rgba(224,205,219,.14)!important;
}
body.museum-gallery-enabled .museum-rail-preview .museum-rail-preview-title{
  white-space:normal!important;text-overflow:clip!important;
  overflow-wrap:anywhere;word-break:normal;min-width:0;
  line-height:1.4!important;text-align:start!important;
}
"""
write(path,s);changed.append(str(path.relative_to(ROOT)))
assert len(changed)==26, f'Unexpected changed file count: {len(changed)}'
print(json.dumps({'changed':changed,'htmlTextPreserved':True,'paragraphJoins':3,'timelineStops':7,'openingFilesChanged':False},ensure_ascii=False,indent=2))
