import test from 'node:test';
import assert from 'node:assert/strict';
import { edgeScrollTravel } from '../src/experience/margin-motion.ts';
import { storyProgress, integrateDisplacement } from '../src/experience/choreography.ts';
test('scroll jumps, reverse travel, and document bounds resolve directly', () => {
  const anchors = [300, 1400, 3900, 5200, 6800];
  assert.equal(storyProgress(-10, anchors), 0);
  assert.equal(storyProgress(6800, anchors), 4);
  assert.equal(storyProgress(9999, anchors), 4);
  assert.equal(storyProgress(3900, anchors), 2);
  for (const p of [700, 2600, 4400, 6100]) {
    assert.ok(Math.abs(storyProgress(p + .001, anchors) - storyProgress(p - .001, anchors)) < .00001);
  }
  assert.equal(storyProgress(1400, anchors), 1);
});
test('a released displacement returns to the moving ideal without long-lived drift', () => {
  let x = 1, v = 0;
  for (let i = 0; i < 180; i++) [x, v] = integrateDisplacement(x, v, 0, 1 / 120);
  assert.ok(Math.abs(x) < .05);
  assert.ok(Math.abs(v) < .05);
  const currentIdeal = 5;
  assert.ok(Math.abs((currentIdeal + x) - currentIdeal) < .05);
});

test('reading zones hold the margin pose despite changing scroll', () => {
  const anchors = [0, 1000, 2300, 3000, 3400, 4000, 4700, 5300];
  const values = [0, 1, 1, 2, 2, 3, 3, 4];
  assert.equal(storyProgress(1500, anchors, values), 1);
  assert.equal(storyProgress(2200, anchors, values), 1);
  assert.equal(storyProgress(4300, anchors, values), 3);
});


test('parallax continues through a reading hold and freezes during the next morph', () => {
  const anchors = [0, 1000, 2300, 3000, 3400, 4000, 4700, 5300];
  assert.equal(edgeScrollTravel(700, anchors, .7, 1000), 0);
  assert.equal(edgeScrollTravel(1500, anchors, 1, 1000), 5);
  assert.equal(edgeScrollTravel(2100, anchors, 1, 1000), 11);
  assert.equal(edgeScrollTravel(2700, anchors, 1.5, 1000), 13);
  assert.equal(edgeScrollTravel(4100, anchors, 3, 1000), 1);
  assert.equal(edgeScrollTravel(5100, anchors, 3.7, 1000), 7);
  assert.equal(edgeScrollTravel(4400, anchors, 3, 1000), 4);
});
