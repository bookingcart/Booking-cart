import { Suspense } from 'react';
import StaysResultsPageInner from '@/views/StaysResultsPage';

export default function StaysResultsPage() {
  return (
    <Suspense>
      <StaysResultsPageInner />
    </Suspense>
  );
}
