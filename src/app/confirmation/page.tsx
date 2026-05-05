import { Suspense } from 'react';
import ConfirmationPageInner from '@/views/ConfirmationPage';

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationPageInner />
    </Suspense>
  );
}

