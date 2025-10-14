export { type HeatPoint, type MapProps } from './types';
// For TypeScript type resolution, point to web implementation by default.
// At runtime, React Native bundler will pick index.web.ts or index.native.ts.
export { default } from './index.web';
