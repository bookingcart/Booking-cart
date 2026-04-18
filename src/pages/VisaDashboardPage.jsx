import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';

const SCRIPTS = ['/js/loading-ui.js','/js/visa.js?v=1'];

export default function VisaDashboardPage() {
  useEffect(() => { document.title = 'Visa Dashboard | BookingCart'; }, []);
  useLegacyScripts(SCRIPTS, 'visa-dashboard');
  return (
    <>
      
    </>
  );
}
