/* The Three Eras exhibition: permanent pinned image-index and editorial interactions.
   Only text labels already used on live pages are exposed; no historical prose added.
   The initial cinema opening remains visually uninterrupted; the timeline follows it. */
(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  if (!body || body.dataset.pageState === 'blank' || document.querySelector('.gallery-rail')) return;
  const lang = (root.lang || 'en').toLowerCase();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const movieEntrance = body.classList.contains('official-entrance');
  const assetRoot = new URL('.', document.currentScript?.src || document.baseURI);
  const abs = relative => new URL(relative,assetRoot).href;
  const localeLabels = lang==='he' ? [
    'שלוש תקופות של שנאת יהודים','אנטי־יהדות','דחיית ישו ובהריגתו',
    'שימוש בדמם','הרעלת בארות','אנטישמיות','אנטי־ציונות',
    'קולוניאליזם','אפרטהייד','רצח עם'
  ] : lang==='ru' ? [
    'Три эпохи ненависти к евреям','Антииудаизм','убийстве Христа',
    'убийстве христианских детей','отравлении колодцев',
    'Антисемитизм','Антисионизм','колониализм','апартеид','геноцид'
  ] : null;
  const items = [
    {href:'entrance.html',img:'assets/door-antijudaism-kile.jpg',index:'00',name:'The Three Eras'},
    {href:'antijudaism.html',img:'assets/antijudaism-1.jpg',index:'I',name:'Anti-Judaism'},
    {href:'antijudaism.html#deicide-cinema',img:'assets/deicide-cinema/scene_01.webp',index:'01',name:'Deicide Libel'},
    {href:'antijudaism.html#libel-blood',img:'assets/antijudaism-3.jpg',index:'02',name:'Blood Libel'},
    {href:'antijudaism.html#libel-well',img:'assets/antijudaism-5.jpg',index:'03',name:'Well-Poisoning'},
    {href:'antisemitism.html',img:'assets/antisemitism-1.jpg',index:'II',name:'Antisemitism'},
    {href:'exhibition.html',img:'assets/door-antizionism-naya-source.jpg',index:'III',name:'Antizionism'},
    {href:'colonialism.html',img:'assets/naya-sayegh-1965.webp',index:'04',name:'Colonialism'},
    {href:'apartheid.html',img:'assets/naya-efimovsky-zionism-racism-1976.webp',index:'05',name:'Apartheid'},
    {href:'genocide.html',img:null,index:'06',name:'Genocide'}
  ];
  const el=(tag,className)=>{
    const result=document.createElement(tag);
    if(className)result.className=className;
    return result;
  };
  const rail=el('nav','gallery-rail');
  rail.setAttribute('aria-label',lang==='he'?'שלוש תקופות של שנאת יהודים':lang==='ru'?'Три эпохи ненависти к евреям':'The Three Eras of Jew-Hatred');
  rail.dataset.galleryRail='v1';
  if(lang==='he')rail.dir='rtl';
  if(lang!=='en')rail.classList.add('gallery-rail-compact');
  const track=el('div','gallery-rail-track');
  rail.appendChild(track);

  const links=[];
  for(const [i,item] of items.entries()){
    const name=localeLabels?.[i] || item.name;
    const link=el('a','gallery-rail-item');
    // All URLs are local and derived from existing exhibition routes and objects.
    link.href=abs(item.href);
    link.title=name;
    link.lang=lang;
    link.setAttribute('aria-label',name);
    link.dataset.galleryTarget=item.href;
    const pic=el('span','gallery-rail-picture');
    if(item.img){
      const img=document.createElement('img');
      img.src=abs(item.img);
      img.alt='';
      img.width=36;img.height=51;
      img.decoding='async';
      img.loading='lazy';
      pic.appendChild(img);
    } else {
      pic.classList.add('no-object');
      // No unrelated archival image is assigned to a historical category.
    }
    const label=el('span','gallery-rail-label');
    const num=el('span','gallery-rail-index');
    num.textContent=item.index;
    const title=el('span','gallery-rail-title');
    title.textContent=name;
    label.append(num,title);
    link.append(pic,label);
    track.appendChild(link);
    links.push(link);
  }
  if(movieEntrance){
    // Do not obscure the original cinematic entrance animation.
    const main=document.querySelector('main');
    const entry=main?.querySelector('.entry');
    if(entry)main.insertBefore(rail,entry);
    else main?.appendChild(rail);
  }else{
    const header=document.querySelector('.site-header');
    if(header)header.insertAdjacentElement('afterend',rail);
    else document.querySelector('main')?.insertAdjacentElement('beforebegin',rail);
  }
  if(!rail.isConnected)return;
  body.classList.add('gallery-has-rail');

  let raf=0;
  const pathname=location.pathname.split('/').filter(Boolean).at(-1)||'index.html';
  const activeNow=()=>{
    const current=pathname==='index.html'?'entrance.html':pathname;
    let href=current;
    if(current==='antijudaism.html'){
      for(const id of ['libel-well','libel-blood','deicide-cinema']){
        const section=document.getElementById(id);
        if(!section)continue;
        const box=section.getBoundingClientRect();
        if(box.top<innerHeight*.38&&box.bottom>105){
          href='antijudaism.html#'+id;
          break;
        }
      }
    }
    if(location.hash&&items.some(x=>x.href===current+location.hash))href=current+location.hash;
    let matched=false;
    for(const a of links){
      const value=a.dataset.galleryTarget;
      const isActive=value===href||(!matched&&value===current&&href===current);
      if(isActive){a.setAttribute('aria-current',value.includes('#')?'location':'page');matched=true;}
      else a.removeAttribute('aria-current');
    }
  };
  activeNow();
  const update=()=>{raf=0;activeNow()};
  addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(update)},{passive:true});
  addEventListener('hashchange',update);

  // A restrained magnetic interaction; no constant layout calculations.
  if(!reduced&&matchMedia('(hover:hover) and (pointer:fine)').matches){
    links.forEach(link=>{
      let move=0;
      link.addEventListener('pointermove',event=>{
        if(move)return;
        move=requestAnimationFrame(()=>{
          move=0;
          const b=link.getBoundingClientRect();
          const x=(event.clientX-(b.left+b.width/2))/b.width;
          const y=(event.clientY-(b.top+b.height/2))/b.height;
          link.style.setProperty('--gallery-mx',Math.max(-3,Math.min(3,x*5)).toFixed(1)+'px');
          link.style.setProperty('--gallery-my',Math.max(-2,Math.min(2,y*4)).toFixed(1)+'px');
        });
      });
      link.addEventListener('pointerleave',()=>{
        cancelAnimationFrame(move);move=0;
        link.style.removeProperty('--gallery-mx');
        link.style.removeProperty('--gallery-my');
      });
    });
  }

  // Anchor destinations already on this document remain ordinary links.
  // Deicide's film may start via its existing 36% intersection threshold.
  for(const anchor of document.querySelectorAll('main .aj-libel-head')){
    const title=anchor.querySelector('h3');
    if(!title || title.querySelector('a'))continue;
    const parent=anchor.closest('.aj-libel');
    if(!parent?.id)continue;
    const target=el('a','gallery-libel-title-link');
    target.href='#'+parent.id;
    target.setAttribute('aria-label',title.textContent);
    while(title.firstChild)target.appendChild(title.firstChild);
    title.appendChild(target);
  }

  // The 36-second 3D opening keeps every planned frame eagerly eligible.
  // For regular gallery pages, lazy-load only artwork lower in the document.
  const images=[...document.querySelectorAll('main img')].filter(image=>!image.closest('.gallery-rail,.cinema'));
  images.forEach((img,index)=>{
    img.decoding='async';
    if(index>2&&!img.hasAttribute('fetchpriority'))img.loading='lazy';
  });

  // On touch devices there is no hover. A photograph begins one restrained
  // 5.7s camera-in when its actual gallery frame first enters the viewport.
  // Never animate the 36s 3D opening or the dedicated full-screen film.
  if(!reduced && 'IntersectionObserver' in window &&
     matchMedia('(hover:none), (pointer:coarse)').matches){
    const frames=[...document.querySelectorAll(
      'main .door-art, main .art-open, main .aj-object, main .artifact figure, main .editorial-art figure, main figure'
    )].filter(frame=>frame.querySelector('img')&&!frame.closest('.cinema,.gallery-rail,.deicide-film-host'));
    const watcher=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        entry.target.classList.add('gallery-mobile-arrived');
        watcher.unobserve(entry.target);
      }
    },{threshold:0,rootMargin:'0px 0px -18% 0px'});
    frames.forEach(frame=>watcher.observe(frame));
  }
})();
