import { Link } from 'react-router-dom';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function Header() {
  const { user } = useCurrentUser();

  return (
    <header className="bg-gmb-orange text-white p-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <Link to="/" className="text-xl md:text-2xl font-bold">
          GOOD MORNING BITCOIN.COM
        </Link>
        <div className="flex items-center gap-6">
          <nav className="flex flex-wrap gap-4 text-sm md:text-base">
            <Link to="/about" className="hover:underline">About</Link>
            {user && (
              <Link to="/community" className="hover:underline">Community</Link>
            )}
            <a href="https://rustysats.com" className="hover:underline" target="_blank" rel="noopener noreferrer">RustySats</a>
            <a href="https://www.orangem.art/" className="hover:underline" target="_blank" rel="noopener noreferrer">Orange</a>
            <Link to="/shows" className="hover:underline">Shows</Link>
          </nav>
          <LoginArea className="max-w-48" />
        </div>
      </div>
    </header>
  );
}