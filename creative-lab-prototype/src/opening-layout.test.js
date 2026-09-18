import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogueLayout,openingLayout} from './opening-layout.js';

test('the orbit resolves into fourteen equally sized, non-overlapping, reachable categories',()=>{
  for(const [width,height] of [[335,748],[680,748],[960,520],[1376,772],[1800,900]]) {
    const tiles=openingLayout(width,height,1,2.7);
    assert.equal(tiles.length,14);
    if(width>=1200){
      const layout=catalogueLayout(width),originalWidth=(width-22*4)/5;
      assert.equal(layout.columns,6);
      assert.deepEqual([...new Set(tiles.map(tile=>tile.y))].map(y=>tiles.filter(tile=>tile.y===y).length),[6,6,2]);
      assert.ok(Math.abs(layout.cardHeight-(originalWidth+76)*layout.cardScale)<.01);
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

test('the desktop orbit rises on the left and descends on the right before unfolding',()=>{
  const left=openingLayout(1376,772,0,-Math.PI/2)[0];
  const right=openingLayout(1376,772,0,Math.PI/2)[0];
  assert.ok(right.x>left.x);
  assert.ok(right.y-left.y>300);
  assert.deepEqual(openingLayout(1376,772,1,-Math.PI/2),openingLayout(1376,772,1,Math.PI/2));
});


test('front examples have stronger perspective while final cards share the same scale',()=>{
  const front=openingLayout(1376,772,0,0)[0];
  const back=openingLayout(1376,772,0,Math.PI)[0];
  const projectedWidth=tile=>tile.width*tile.scale*1000/(1000-tile.z);
  assert.ok(projectedWidth(front)>projectedWidth(back)*2);
  assert.ok(projectedWidth(front)<415);
});


test('all fourteen examples stay present from the opening through the complete catalogue',()=>{
  for(const phase of [0,1.2,3.4]) {
    const opening=openingLayout(1376,772,0,phase);
    assert.equal(opening.filter(card=>card.opacity>0).length,14);
    const expanded=openingLayout(1376,772,1,phase);
    assert.equal(expanded.filter(card=>card.opacity===1).length,14);
  }
  const partial=openingLayout(1376,772,.7);
  assert.equal(partial.filter(card=>card.opacity>0).length,14);
});
