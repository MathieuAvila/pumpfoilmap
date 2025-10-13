import dynamic from 'next/dynamic';

const RNApp = dynamic(() => import('../App'), { ssr: false });

export default function Home() {
  return <RNApp />;
}
