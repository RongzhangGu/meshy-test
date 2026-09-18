import React, {useId} from 'react';

// Visible object bounds in the existing atlases, padded to preserve soft edges.
// Fitting the actual silhouette keeps transparent sprite margins out of the layout.
const bounds = {
  keychain:[78,8,279,427], chibi:[538,9,255,428], vinyl:[976,25,261,418],
  brick:[94,451,255,413], lamp:[500,468,334,375],
  keycap:[107,71,689,782], pixel:[1051,145,611,670],
  egg:[62,39,399,459], collapsible:[583,70,396,395], plantpot:[1049,69,460,417],
  terrain:[12,589,506,394], pixleap:[596,533,328,452],
};

export default function ProductCutout({product}) {
  const clipId=useId();
  // Use the open-eyed keepsake from the original scene, not the concept atlas cat.
  if(product.id==='pet') return <svg className="opening-output" viewBox="215 35 795 1210" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
    <image href="/assets/pet-cutout.png" width="1254" height="1254"/>
  </svg>;
  // Frame the exact official product photo instead of the generated atlas variant.
  if(product.id==='magnet') return <svg className="opening-output" viewBox="73 74 481 479" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
    <defs><clipPath id={clipId}><rect x="73" y="74" width="481" height="479"/></clipPath></defs>
    <image href="/assets/magnet.webp" width="640" height="640" clipPath={`url(#${clipId})`}/>
  </svg>;
  const catalogue=product.catalogueAtlasIndex!==undefined;
  const atlas=catalogue?'catalogue-cutouts-v2.png':product.extraAtlasIndex===undefined?'creation-atlas-cutout-v2.png':'creation-extras-cutout.png';
  const [x,y,width,height]=bounds[product.id];
  return <svg className="opening-output" viewBox={bounds[product.id].join(' ')} preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
    <defs><clipPath id={clipId}><rect x={x} y={y} width={width} height={height}/></clipPath></defs>
    <image href={`/assets/${atlas}`} width={catalogue?1536:1774} height={catalogue?1024:887} clipPath={`url(#${clipId})`}/>
  </svg>;
}
