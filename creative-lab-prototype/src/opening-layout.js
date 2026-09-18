export const clamp = value => Math.max(0, Math.min(1, value));

export function catalogueLayout(width, mobile = width < 700, count = 14) {
  const columns = mobile ? 2 : width >= 1200 ? 6 : 3;
  const gap = mobile ? 14 : 22;
  const rowGap = mobile ? 36 : 76;
  const top = mobile ? 216 : 182;
  const cardWidth = (width - gap * (columns - 1)) / columns;
  const originalWidth = columns === 6 ? (width - gap * 4) / 5 : cardWidth;
  const cardScale = cardWidth / originalWidth;
  const orbitHeight = (mobile ? Math.max(138, originalWidth * .80) : Math.min(292, originalWidth * .80)) * cardScale;
  // Keep original square product scenes uncropped, including their raised top edge.
  const cardHeight = (originalWidth + (mobile ? 188 - 28 : 136 - 60)) * cardScale;
  const rows = Math.ceil(count / columns);
  return {columns, gap, rowGap, top, cardWidth, cardHeight, cardScale, orbitHeight, height:top + rows * cardHeight + (rows - 1) * rowGap + 24};
}

export function openingLayout(width, height, progress, phase = 0, mobile = width < 700, count = 14, openingCount = count) {
  const p = clamp(progress);
  const ease = p * p * (3 - 2 * p);
  const {columns, gap, rowGap, top, cardWidth, cardHeight, orbitHeight} = catalogueLayout(width, mobile, count);
  const radius = mobile ? width * .38 : Math.min(width * .38, 760);
  const tilt = mobile ? .1 : 20 * Math.PI / 180;
  return Array.from({length:count}, (_, index) => {
    const row = Math.floor(index / columns);
    const inRow = Math.min(columns, count - row * columns);
    const finalX = (width - inRow * cardWidth - (inRow - 1) * gap) / 2 + (index % columns) * (cardWidth + gap);
    const finalY = top + row * (cardHeight + rowGap);
    if(p === 1) return {x:finalX, y:finalY, z:0, rotateY:0, rotateZ:0, scale:1, opacity:1, width:cardWidth, height:cardHeight};
    if(index >= openingCount) {
      const appear = clamp((p - .45) / .55);
      const reveal = appear * appear * (3 - 2 * appear);
      return {x:finalX, y:finalY + 32 * (1 - reveal), z:0, rotateY:0, rotateZ:0, scale:.96 + .04 * reveal, opacity:reveal, width:cardWidth, height:cardHeight};
    }
    const angle = index * Math.PI * 2 / openingCount + phase;
    const depth = Math.cos(angle);
    const along = Math.sin(angle) * radius;
    const across = depth * (mobile ? 50 : 94);
    const orbitX = width / 2 + along * Math.cos(tilt) - across * Math.sin(tilt) - cardWidth / 2;
    const orbitY = height * .48 + along * Math.sin(tilt) + across * Math.cos(tilt) - orbitHeight / 2;
    const baseScale = (mobile ? 165 : Math.min(345, width * .228)) / cardWidth;
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
