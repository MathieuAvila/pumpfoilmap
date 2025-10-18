/** @jest-environment jsdom */
import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { act } from 'react-dom/test-utils';
// Mock maplibre-gl to avoid WebGL in Jest
jest.mock('maplibre-gl', () => {
  class Map {
    private handlers: Record<string, Array<(...args: any[]) => void>> = {};
    constructor(_: any) {}
    on(event: string, cb: any) {
      (this.handlers[event] ||= []).push(cb);
    }
    getStyle() { return { layers: [] }; }
    getSource() { return null; }
    addSource() {}
    addLayer() {}
    getCanvas() { return { style: {} } as any; }
    project(coords: any) { return coords; }
    queryRenderedFeatures() { return []; }
    easeTo() {}
  }
  class Popup {
    setLngLat() { return this; }
    setHTML() { return this; }
    addTo() { return this; }
  }
  return { __esModule: true, default: { Map }, Map, Popup };
});

// @ts-ignore: component under test
import MapWeb from '../Map.web';

describe('MapWeb picking uses latest callback after refresh', () => {
  test('PFM_TEST.pickAt calls new onPickLocation after props update', async () => {
    const calls: any[] = [];
    const firstCb = (p: { lon: number; lat: number }) => calls.push(['first', p]);
    const secondCalls: any[] = [];
    const secondCb = (p: { lon: number; lat: number }) => secondCalls.push(['second', p]);

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOMClient.createRoot(container);

    // Initial render with first callback
  root.render(<MapWeb points={[{ lat: 48.85, lon: 2.35, title: 'A' }] as any} picking onPickLocation={firstCb} />);
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  expect((global as any).PFM_TEST?.pickAt).toBeDefined();

    // Re-render with updated callback (simulating refresh after deletion)
  root.render(<MapWeb points={[] as any} picking onPickLocation={secondCb} />);
  await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

  // Use helper to simulate a pick
  (global as any).PFM_TEST.pickAt(1, 2);

    // First callback should not be used anymore
    expect(calls.length).toBe(0);
    // Latest callback receives the event
    expect(secondCalls.length).toBe(1);
    expect(secondCalls[0][1]).toEqual({ lon: 1, lat: 2 });
  });
});
