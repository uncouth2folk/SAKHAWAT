/* ============ PARTICLE BACKDROP ============ */
(function(){
  const c=document.getElementById('particles');
  const ctx=c.getContext('2d');
  let w,h,parts=[];
  function resize(){w=c.width=innerWidth;h=c.height=innerHeight}
  resize();addEventListener('resize',resize);
  for(let i=0;i<70;i++)parts.push({
    x:Math.random()*w,y:Math.random()*h,
    vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,
    r:Math.random()*1.4+.3
  });
  (function loop(){
    ctx.clearRect(0,0,w,h);
    parts.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<0||p.x>w)p.vx*=-1;
      if(p.y<0||p.y>h)p.vy*=-1;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle='rgba(61,169,255,0.5)';ctx.fill();
    });
    requestAnimationFrame(loop);
  })();
})();

/* ============ ANATOMICAL SPINE (Three.js) ============ */
(function(){
  const canvas=document.getElementById('spine-canvas');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.1,100);
  camera.position.set(0,0,18);

  // lighting — clinical rim + warm fill so the red reads as marked bone, not plastic
  scene.add(new THREE.AmbientLight(0x223044,.6));
  const key=new THREE.DirectionalLight(0xffffff,.9);key.position.set(5,8,7);scene.add(key);
  const rim=new THREE.PointLight(0xff3344,1.4,40);rim.position.set(-6,2,6);scene.add(rim);
  const fill=new THREE.PointLight(0x3da9ff,.7,40);fill.position.set(6,-4,4);scene.add(fill);

  const spineGroup=new THREE.Group();
  scene.add(spineGroup);

  // materials
  const boneMat=new THREE.MeshPhongMaterial({
    color:0xff3344,emissive:0x3a0008,
    specular:0xffaab0,shininess:80
  });
  const discMat=new THREE.MeshPhongMaterial({
    color:0xffd4d8,emissive:0x220004,shininess:30,transparent:true,opacity:.85
  });
  const processMat=new THREE.MeshPhongMaterial({
    color:0xc81830,emissive:0x2a0006,shininess:60
  });

  /* Build a true S-curve along Y axis.
     Y range roughly +6 (skull base) to -7 (sacrum/coccyx).
     Curvature on X axis follows lordosis/kyphosis pattern. */
  function curveX(y){
    // cervical (y 4 to 6): forward (+x small)
    // thoracic (y -1 to 4): backward (-x)
    // lumbar (y -5 to -1): forward (+x)
    // sacrum (y < -5): backward slight
    if(y>4) return  0.35*Math.sin((y-4)*1.2);
    if(y>-1)return -0.55*Math.sin((y+1)/5*Math.PI);
    if(y>-5)return  0.6 *Math.sin((y+5)/4*Math.PI);
    return -0.25*(y+5);
  }
  function curveZ(y){return -0.15*Math.sin(y*.4)} // tiny depth wobble

  const VERTEBRAE=24; // 7 cervical + 12 thoracic + 5 lumbar
  const topY=5.8, bottomY=-5.2;
  const step=(topY-bottomY)/(VERTEBRAE-1);

  for(let i=0;i<VERTEBRAE;i++){
    const y=topY-i*step;
    const region = i<7 ? 'C' : i<19 ? 'T' : 'L';
    // size grows toward lumbar
    const sizeFactor = region==='C' ? .55 : region==='T' ? .75+(i-7)*.025 : 1.05+(i-19)*.04;

    const vert=new THREE.Group();

    // vertebral body — short cylinder, slight hourglass via two cones isn't needed; use cylinder w/ bevels
    const bodyGeom=new THREE.CylinderGeometry(0.55*sizeFactor,0.55*sizeFactor,0.45,24,1);
    const body=new THREE.Mesh(bodyGeom,boneMat);
    vert.add(body);

    // spinous process — small cone pointing back (-z) and slightly down
    const spGeom=new THREE.ConeGeometry(0.13*sizeFactor,0.7*sizeFactor,12);
    const sp=new THREE.Mesh(spGeom,processMat);
    sp.position.set(0,-0.05,-0.55*sizeFactor);
    sp.rotation.x=Math.PI/2 + 0.4;
    vert.add(sp);

    // transverse processes — two small cylinders out the sides
    const trGeom=new THREE.CylinderGeometry(0.08*sizeFactor,0.1*sizeFactor,0.55*sizeFactor,10);
    const trL=new THREE.Mesh(trGeom,processMat);
    trL.position.set(-0.5*sizeFactor,0,-0.15);
    trL.rotation.z=Math.PI/2;
    vert.add(trL);
    const trR=trL.clone();
    trR.position.set(0.5*sizeFactor,0,-0.15);
    vert.add(trR);

    // articular processes — small spheres at corners for facet joints
    const artGeom=new THREE.SphereGeometry(0.12*sizeFactor,8,8);
    [-0.35,-0.35].forEach((x,i)=>{
      const art=new THREE.Mesh(artGeom,processMat);
      art.position.set(x*(i?-1:1),0.2,-0.25*sizeFactor);
      vert.add(art);
    });

    vert.position.x=curveX(y);
    vert.position.y=y;
    vert.position.z=curveZ(y);
    spineGroup.add(vert);

    // intervertebral discs — between vertebrae
    if(i<VERTEBRAE-1){
      const y2=topY-(i+1)*step;
      const discY=(y+y2)*.5;
      const discGeom=new THREE.CylinderGeometry(0.58*sizeFactor,0.58*sizeFactor,0.15,20,2);
      const disc=new THREE.Mesh(discGeom,discMat);
      disc.position.x=curveX(discY);
      disc.position.y=discY;
      disc.position.z=curveZ(discY);
      spineGroup.add(disc);
    }
  }

  // Sacrum — triangular fused bone at base
  const sac=new THREE.Group();
  const sacGeom=new THREE.OctahedronGeometry(0.7,2);
  const sacMesh=new THREE.Mesh(sacGeom,boneMat);
  sacMesh.scale.set(1.2,0.8,1);
  sac.add(sacMesh);
  sac.position.set(curveX(-6.5),-6.5,curveZ(-6.5));
  spineGroup.add(sac);

  // initial animation state
  let animTarget={rx:0,ry:0};
  let animCur={rx:0,ry:0};

  window.addEventListener('mousemove',(e)=>{
    animTarget.ry=(e.clientX/innerWidth-0.5)*Math.PI*.3;
    animTarget.rx=(e.clientY/innerHeight-0.5)*Math.PI*.15;
  });

  function animate(){
    requestAnimationFrame(animate);
    
    // smooth damping
    animCur.rx+=(animTarget.rx-animCur.rx)*.08;
    animCur.ry+=(animTarget.ry-animCur.ry)*.08;
    
    spineGroup.rotation.x=animCur.rx;
    spineGroup.rotation.y=animCur.ry;
    
    renderer.render(scene,camera);
  }
  animate();

  // handle window resize
  window.addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });
})();