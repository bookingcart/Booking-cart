import { useEffect } from 'react';
import { useLegacyScripts } from '../hooks/useLegacyScripts.js';

const SCRIPTS = ['/js/loading-ui.js','/js/flag-emoji.js','/data/visa-dataset.js','/data/visa-details.js','/js/world-map.js','/js/visa-tool.js'];

export default function VisaNewPage() {
  useEffect(() => { document.title = 'Visa | BookingCart'; }, []);
  useLegacyScripts(SCRIPTS, 'visa-new');
  return (
    <>
      
    </>
  );
}
