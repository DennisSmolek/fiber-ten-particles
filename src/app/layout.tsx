import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Fiber 10 — A new shape for React',
  description: 'A living particle study of React Three Fiber v10. WebGPU, TSL, and compute, in motion.',
};
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
