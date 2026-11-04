(() => {
  'use strict';
  if (!document.body.classList.contains('gallery-polished')) return;
  // The existing images become inspection buttons; captions stay one line.
  document.querySelectorAll('.aj-object').forEach(figure=>{
    const image=figure.querySelector(':scope > img');if(!image)return;
    const button=document.createElement('button');button.type='button';button.className='art-open aj-inspect';
    button.dataset.image=image.getAttribute('src');
    button.dataset.title=figure.querySelector('.caption-name,.object-name')?.textContent.trim()||image.alt;
    button.setAttribute('aria-label','Enlarge '+button.dataset.title);button.setAttribute('aria-haspopup','dialog');
    image.before(button);button.append(image);
  });
  const triggers=[...document.querySelectorAll('main .art-open')];
  if(!triggers.length)return;
  triggers.forEach(button=>button.setAttribute('aria-haspopup','dialog'));
  const viewer=document.createElement('dialog');viewer.id='artwork-inspector';
  viewer.setAttribute('aria-labelledby','inspection-caption');
  viewer.innerHTML='<div class="inspection-toolbar"><div class="inspection-tools"><button class="inspection-control" type="button" data-action="out" aria-label="Zoom out">−</button><button class="inspection-control" type="button" data-action="reset" aria-label="Fit artwork to screen">↔</button><button class="inspection-control" type="button" data-action="in" aria-label="Zoom in">+</button></div><button class="inspection-control inspection-close" type="button" data-action="close" aria-label="Close artwork">×</button></div><div class="inspection-stage"><img class="inspection-image" alt="" draggable="false"></div><p class="inspection-caption" id="inspection-caption"></p><span class="inspection-status" aria-live="polite"></span>';
  document.body.append(viewer);
  const stage=viewer.querySelector('.inspection-stage'),image=stage.querySelector('img'),caption=viewer.querySelector('.inspection-caption'),status=viewer.querySelector('.inspection-status');
  let zoom=1,x=0,y=0,opener=null,previousOverflow='',previousScroll=0;
  const pointers=new Map();let gesture=null;
  const clampPan=()=>{
    const maxX=Math.max(0,(image.clientWidth*zoom-stage.clientWidth)/2),maxY=Math.max(0,(image.clientHeight*zoom-stage.clientHeight)/2);
    x=Math.max(-maxX,Math.min(maxX,x));y=Math.max(-maxY,Math.min(maxY,y));
  };
  const paint=()=>{clampPan();image.style.setProperty('--inspect-zoom',zoom);image.style.setProperty('--pan-x',x+'px');image.style.setProperty('--pan-y',y+'px');stage.classList.toggle('is-zoomed',zoom>1.01)};
  const setZoom=(value,cx,cy)=>{
    const next=Math.max(1,Math.min(5,value)),ratio=next/zoom;
    if(Number.isFinite(cx)){const r=stage.getBoundingClientRect();x=(x-(cx-r.left-r.width/2))*ratio+(cx-r.left-r.width/2);y=(y-(cy-r.top-r.height/2))*ratio+(cy-r.top-r.height/2)}
    zoom=next;if(zoom===1)x=y=0;paint();status.textContent=Math.round(zoom*100)+'%';
  };
  const open=button=>{
    opener=button;previousScroll=scrollY;previousOverflow=document.body.style.overflow;
    const object=button.closest('.aj-object,.gallery-object-column,article.artifact');
    caption.textContent=object?.querySelector('.object-caption-line')?.textContent.trim().replace(/\s*·\s*/g,' · ')||button.dataset.title||button.querySelector('img')?.alt||'';
    image.alt=button.dataset.title||button.querySelector('img')?.alt||'';
    image.src=button.dataset.image||button.querySelector('img')?.currentSrc||button.querySelector('img')?.src;
    zoom=1;x=y=0;paint();viewer.showModal();document.body.style.overflow='hidden';document.body.classList.add('artwork-inspection-open');
    viewer.querySelector('[data-action=close]').focus({preventScroll:true});
  };
  // Capture supersedes the older simple lightbox without changing the opening animation's script.
  document.addEventListener('click',event=>{
    const button=event.target.closest('main .art-open');if(!button)return;
    event.preventDefault();event.stopPropagation();open(button);
  },true);
  viewer.addEventListener('click',event=>{
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='close')viewer.close();else if(action==='in')setZoom(zoom*1.4);else if(action==='out')setZoom(zoom/1.4);else if(action==='reset')setZoom(1);
  });
  image.addEventListener('load',paint);
  viewer.addEventListener('close',()=>{
    pointers.clear();gesture=null;stage.classList.remove('is-dragging');document.body.classList.remove('artwork-inspection-open');document.body.style.overflow=previousOverflow;
    opener?.focus({preventScroll:true});window.scrollTo({top:previousScroll,behavior:'instant'});image.removeAttribute('src');
  });
  viewer.addEventListener('keydown',event=>{
    if(event.key==='+'||event.key==='='){event.preventDefault();setZoom(zoom*1.2)}
    else if(event.key==='-'){event.preventDefault();setZoom(zoom/1.2)}
    else if(event.key==='0'){event.preventDefault();setZoom(1)}
    else if(zoom>1&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();x+=event.key==='ArrowLeft'?60:event.key==='ArrowRight'?-60:0;y+=event.key==='ArrowUp'?60:event.key==='ArrowDown'?-60:0;paint();
    }
  });
  stage.addEventListener('wheel',event=>{event.preventDefault();setZoom(zoom*Math.exp(-event.deltaY*.0015),event.clientX,event.clientY)},{passive:false});
  stage.addEventListener('dblclick',event=>{event.preventDefault();setZoom(zoom>1?1:2.5,event.clientX,event.clientY)});
  const beginGesture=()=>{
    const points=[...pointers.values()];
    if(points.length>=2)gesture={distance:Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y),zoom,x,y,cx:(points[0].x+points[1].x)/2,cy:(points[0].y+points[1].y)/2};
    else if(points.length)gesture={start:points[0],x,y};else gesture=null;
  };
  stage.addEventListener('pointerdown',event=>{
    if(event.button!==0&&event.pointerType==='mouse')return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});stage.setPointerCapture(event.pointerId);beginGesture();stage.classList.add('is-dragging');
  });
  stage.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId)||!gesture)return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...pointers.values()];
    if(points.length>=2&&gesture.distance){
      const distance=Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y),cx=(points[0].x+points[1].x)/2,cy=(points[0].y+points[1].y)/2;
      zoom=Math.max(1,Math.min(5,gesture.zoom*distance/Math.max(1,gesture.distance)));const ratio=zoom/gesture.zoom,r=stage.getBoundingClientRect();
      x=(gesture.x-(gesture.cx-r.left-r.width/2))*ratio+(cx-r.left-r.width/2);y=(gesture.y-(gesture.cy-r.top-r.height/2))*ratio+(cy-r.top-r.height/2);paint();
    }else if(gesture.start&&zoom>1){x=gesture.x+event.clientX-gesture.start.x;y=gesture.y+event.clientY-gesture.start.y;paint()}
  });
  const endPointer=event=>{pointers.delete(event.pointerId);beginGesture();if(!pointers.size)stage.classList.remove('is-dragging')};
  stage.addEventListener('pointerup',endPointer);stage.addEventListener('pointercancel',endPointer);
  addEventListener('resize',()=>{if(viewer.open)paint()},{passive:true});
})();
