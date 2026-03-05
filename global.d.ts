/* eslint-disable @typescript-eslint/no-explicit-any */
// Temporary global declarations to help the TypeScript server resolve imports
// Remove this file once the root cause (missing packages / VSCode TS config) is fixed

declare module 'next';
declare module 'next/image';
declare module 'next/link';
declare module 'next/font/google';
declare module '@vercel/analytics/next';
declare module 'lucide-react';

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
