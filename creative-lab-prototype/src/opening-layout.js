export const clamp = value => Math.max(0, Math.min(1, value));

// Artwork and callouts measured against the supplied 2048 × 888 hero reference.
// [image x, y, width, height, depth, tilt, label x, label y].
// Brick and keycap join during the unfold; the complete catalogue stays intact.
export const heroPlacements = [
  [1324,456,205,315,80,10,1380,818], // Keychain
  [1070,426,224,376,140,-2,1100,845], // Chibi, featured beside Pixleap
  [1750,444,196,314,60,0,1805,800], // Vinyl
  [1810,143,180,263,40,-4,1800,88], // Pet, with its own space above the figures
  null,
  [1443,365,175,175,30,-4,1495,595], // Lamp
  [1570,576,145,159,20,8,1600,784], // Magnet, supporting the right-hand group
  null,
  [466,257,208,227,20,7,500,201], // Pixel
  [268,82,200,230,-20,-6,284,30], // Egg
  [35,145,235,210,0,-9,45,94], // Collapsible
  [130,335,270,245,80,0,170,618], // Plant pot
  [329,495,322,250,100,0,380,795], // Terrain
  [712,400,284,390,120,10,745,837], // Pixleap
];

// Each curve starts next to its caption and ends at its own cutout's edge.
// Coordinates share the product's local reference space, so both scale together.
export const heroCallouts = {
  keychain:'M15 -10 Q70 -10 65 -54',
  chibi:'M20 -10 Q70 -8 78 -45',
  vinyl:'M80 -10 Q95 -22 63 -47',
  pet:'M70 26 Q112 25 110 66',
  lamp:'M25 -12 Q10 -35 34 -48',
  magnet:'M10 -10 Q-18 -34 14 -47',
  pixel:'M40 28 Q5 34 0 58',
  egg:'M40 26 Q65 34 73 55',
  collapsible:'M112 28 Q144 31 135 64',
  plantpot:'M25 -10 Q80 -6 85 -40',
  terrain:'M35 -10 Q72 -7 90 -52',
  pixleap:'M45 -12 Q92 -15 93 -51',
};

export function heroComposition(width,height) {
  const scale=Math.min(width/2048,(height-92)/888);
  return {scale,left:(width-2048*scale)/2,top:Math.max(0,(height-92-888*scale)/2)};
}

export function catalogueLayout(width, mobile = width < 700, count = 14) {
  const columns = mobile ? 2 : width >= 1200 ? 6 : 3;
  const gap = mobile ? 14 : 22;
  const rowGap = mobile ? 36 : 76;
  const top = mobile ? 216 : 206;
  const cardWidth = (width - gap * (columns - 1)) / columns;
  const originalWidth = columns === 6 ? (width - gap * 4) / 5 : cardWidth;
  const cardScale = cardWidth / originalWidth;
  const orbitHeight = (mobile ? Math.max(138, originalWidth * .80) : Math.min(292, originalWidth * .80)) * cardScale;
  // Keep original square product scenes uncropped, including their raised top edge.
  const cardHeight = (originalWidth + (mobile ? 188 - 28 : 136)) * cardScale;
  const rows = Math.ceil(count / columns);
  return {columns, gap, rowGap, top, cardWidth, cardHeight, cardScale, orbitHeight, height:top + rows * cardHeight + (rows - 1) * rowGap + 24};
}

export function openingLayout(width, height, progress, phase = 0, mobile = width < 700, count = 14, openingCount = count) {
  const p = clamp(progress);
  const ease = p * p * (3 - 2 * p);
  const {columns, gap, rowGap, top, cardWidth, cardHeight, cardScale, orbitHeight} = catalogueLayout(width, mobile, count);
  const composition=heroComposition(width,height);
  // Reserve breathing room for the tools and filters even on shorter desktops.
  const orbitScale = mobile ? 1 : Math.min(1, (height - 120) / Math.min(width * .54, 860));
  const radius = (mobile ? width * .38 : Math.min(width * .38, 760)) * orbitScale;
  const tilt = mobile ? .1 : 20 * Math.PI / 180;
  return Array.from({length:count}, (_, index) => {
    const row = Math.floor(index / columns);
    const inRow = Math.min(columns, count - row * columns);
    const finalX = (width - inRow * cardWidth - (inRow - 1) * gap) / 2 + (index % columns) * (cardWidth + gap);
    const finalY = top + row * (cardHeight + rowGap);
    if(p === 1) return {x:finalX, y:finalY, z:0, rotateY:0, rotateZ:0, scale:1, opacity:1, width:cardWidth, height:cardHeight};
    if(index >= openingCount || (!mobile && !heroPlacements[index])) {
      const appear = clamp((p - .45) / .55);
      const reveal = appear * appear * (3 - 2 * appear);
      return {x:finalX, y:finalY + 32 * (1 - reveal), z:0, rotateY:0, rotateZ:0, scale:.96 + .04 * reveal, opacity:reveal, width:cardWidth, height:cardHeight};
    }
    if(!mobile) {
      const [x,y,w,h,z,tilt,labelX,labelY]=heroPlacements[index];
      const projection=1000/(1000-z);
      const heroWidth=w*composition.scale/projection;
      const heroHeight=h*composition.scale/projection+44*cardScale;
      const centerX=composition.left+(x+w/2)*composition.scale;
      const centerY=composition.top+(y+h/2)*composition.scale+22*cardScale*projection;
      const orbitX=width/2+(centerX-width/2)/projection-heroWidth/2;
      const orbitY=height/2+(centerY-height/2)/projection-heroHeight/2;
      return {x:orbitX+(finalX-orbitX)*ease,y:orbitY+(finalY-orbitY)*ease,
        z:z*(1-ease),rotateY:0,rotateZ:tilt*(1-ease),scale:1,
        opacity:1,width:heroWidth+(cardWidth-heroWidth)*ease,
        height:heroHeight+(cardHeight-heroHeight)*ease,
        labelX:labelX-x,labelY:labelY-y-h};
    }
    const angle = index * Math.PI * 2 / openingCount + phase;
    const depth = Math.cos(angle);
    const along = Math.sin(angle) * radius;
    const across = depth * (mobile ? 50 : 94) * orbitScale;
    const orbitX = width / 2 + along * Math.cos(tilt) - across * Math.sin(tilt) - cardWidth / 2;
    const orbitY = height * (mobile ? .48 : .45) + along * Math.sin(tilt) + across * Math.cos(tilt) - orbitHeight / 2;
    const baseScale = (mobile ? 165 : Math.min(345, width * .228)) * orbitScale / cardWidth;
    // A compact silhouette and a deeper orbit leave space for the complete collection.
    const scale = baseScale * (.83 + depth * .16);
    return {
      x:orbitX + (finalX - orbitX) * ease,
      y:orbitY + (finalY - orbitY) * ease,
      z:depth * (mobile ? 95 : 235) * (1 - ease),
      rotateY:-Math.sin(angle) * 32 * (1 - ease),
      rotateZ:(tilt * 180 / Math.PI * .4 - Math.sin(angle) * 7) * (1 - ease),
      scale:scale + (1 - scale) * ease,
      opacity:(.7 + (depth + 1) * .15) * (1 - ease) + ease,
      width:cardWidth, height:orbitHeight + (cardHeight - orbitHeight) * ease,
    };
  });
}
