import { Analytics } from '@vercel/analytics/react';
import PlantPal from './PlantPal';

export default function App() {
  return (
    <>
      <PlantPal />
      <Analytics />
    </>
  );
}
