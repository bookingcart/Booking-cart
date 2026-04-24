import { Outlet, useLocation } from 'react-router-dom';
import BookingCartNavbar from '../components/BookingCartNavbar.jsx';

/** Shell for nested routes — shared navbar + page chrome. */
export default function AppLayout() {
  const { pathname } = useLocation();

  /* Derive which nav item to highlight */
  let activeNav = 'flights';
  if (pathname.startsWith('/stays')) activeNav = 'stays';
  else if (
    pathname.startsWith('/my-bookings') ||
    pathname.startsWith('/booking-details')
  ) activeNav = 'bookings';
  else if (pathname.startsWith('/events')) activeNav = 'events';

  return (
    <>
      <BookingCartNavbar activeNav={activeNav} />
      <Outlet />
    </>
  );
}
