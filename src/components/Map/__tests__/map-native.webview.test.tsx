import React from 'react';
import renderer, { act } from 'react-test-renderer';

// Mock react-native-webview to capture props and the ref instance
jest.mock('react-native-webview', () => {
  const React = require('react');
  let lastProps: any = null;
  let lastInstance: any = null;
  const WebView = React.forwardRef((props: any, ref: any) => {
    lastProps = props;
    lastInstance = { postMessage: jest.fn() };
    if (ref) {
      ref.current = lastInstance;
    }
    // Return a lightweight host element
    return React.createElement('WebView', props, null);
  });
  (WebView as any).__getLast = () => ({ props: lastProps, instance: lastInstance });
  return { WebView };
});

import MapNative from '../Map.native';

const getMockWebView = () => {
  const { WebView } = require('react-native-webview');
  return (WebView as any).__getLast();
};

describe('Map.native WebView wrapper', () => {
  it('sends update messages to WebView when props change', () => {
    const pointsA = [{ lat: 1, lon: 2, title: 'A' }];
    const pointsB = [{ lat: 3, lon: 4, title: 'B' }, { lat: 5, lon: 6, title: 'C' }];

    const onPick = jest.fn();

    const tree = renderer.create(
      <MapNative points={pointsA as any} picking={false} onPickLocation={onPick} />
    );

    // Update props: picking -> true and new points
    act(() => {
      tree.update(<MapNative points={pointsB as any} picking={true} onPickLocation={onPick} />);
    });

    const { instance } = getMockWebView();
    expect(instance).toBeTruthy();
    expect(instance.postMessage).toHaveBeenCalled();

    const raw = instance.postMessage.mock.calls[0][0];
    const parsed = JSON.parse(raw);
    expect(parsed.type).toBe('update');
    expect(parsed.payload.picking).toBe(true);
    // minimal sanity check on geojson payload
    expect(parsed.payload.data.type).toBe('FeatureCollection');
    expect(Array.isArray(parsed.payload.data.features)).toBe(true);
    expect(parsed.payload.data.features.length).toBe(2);
  });

  it('invokes onPickLocation when WebView posts a pick message', () => {
    const points = [{ lat: 1, lon: 2, title: 'A' }];
    const onPick = jest.fn();

    renderer.create(<MapNative points={points as any} picking={true} onPickLocation={onPick} />);
    const { props } = getMockWebView();

    // Simulate a postMessage from WebView content
    const event = { nativeEvent: { data: JSON.stringify({ type: 'pick', lat: 42.12345, lon: 3.98765 }) } } as any;
    act(() => {
      props.onMessage?.(event);
    });

    expect(onPick).toHaveBeenCalledWith({ lat: 42.12345, lon: 3.98765 });
  });
});
