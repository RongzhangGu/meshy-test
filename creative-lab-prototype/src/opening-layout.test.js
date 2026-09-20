import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogueLayout,openingLayout} from './opening-layout.js';

test('the orbit resolves into fourteen equally sized, non-overlapping, reachable categories',()=>{
  for(const [width,height] of [[335,748],[680,748],[960,520],[1376,772],[1800,900]]) {
    const tiles=openingLayout(width,height,1,2.7);
    assert.equal(tiles.length,14);
    if(width>=1200){
      const layout=catalogueLayout(width);
      assert.equal(layout.columns,6);
      assert.deepEqual([...new Set(tiles.map(tile=>tile.y))].map(y=>tiles.filter(tile=>tile.y===y).length),[6,6,2]);
      assert.ok(Math.abs(layout.cardHeight-136*layout.cardScale-layout.cardWidth)<.01,'the creation gets a full square image area above its caption');
    }
    for(const [i,tile] of tiles.entries()) {
      assert.equal(tile.z,0);assert.equal(Math.abs(tile.rotateY),0);assert.equal(Math.abs(tile.rotateZ),0);assert.equal(tile.scale,1);
      assert.ok(tile.x>=-.01&&tile.x+tile.width<=width+.01);
      assert.ok(tile.y>=0&&tile.y+tile.height<=catalogueLayout(width).height+.01);
      for(const other of tiles.slice(i+1))assert.ok(tile.x+tile.width<=other.x+.01||other.x+other.width<=tile.x+.01||tile.y+tile.height<=other.y+.01||other.y+other.height<=tile.y+.01);
    }
    assert.deepEqual(openingLayout(width,height,1,0),tiles);
  }
});

test('desktop reference composition stays fixed and still unfolds into the catalogue',()=>{
  const initial=openingLayout(1376,772,0,0);
  for(const phase of [1,2,3,4,5,6]) {
    assert.deepEqual(openingLayout(1376,772,0,phase),initial);
  }
  assert.deepEqual(openingLayout(1376,772,1,0),openingLayout(1376,772,1,6));
});


test('featured silhouettes balance the smaller examples and fit shorter desktop windows',()=>{
  const normal=openingLayout(1376,772,0,0);
  const short=openingLayout(1376,520,0,0);
  const projectedWidth=tile=>tile.width*tile.scale*1000/(1000-tile.z);
  for(const [index,tile] of normal.entries()) {
    if(tile.opacity===0)continue;
    assert.ok(projectedWidth(tile)<400);
    assert.ok(projectedWidth(short[index])<projectedWidth(tile));
  }
});


test('the reference composition reveals the two omitted products when the full catalogue unfolds',()=>{
  for(const phase of [0,1.2,3.4]) {
    const opening=openingLayout(1376,772,0,phase);
    assert.equal(opening.filter(card=>card.opacity>0).length,12);
    assert.equal(opening[4].opacity,0);
    assert.equal(opening[7].opacity,0);
    const expanded=openingLayout(1376,772,1,phase);
    assert.equal(expanded.filter(card=>card.opacity===1).length,14);
  }
  const partial=openingLayout(1376,772,.7);
  assert.equal(partial.filter(card=>card.opacity>0).length,14);
});
