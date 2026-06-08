import { NavLink } from 'react-router-dom';

export default function AppNav() {
  return (
    <nav className="app-nav" aria-label="Primary">
      <div className="app-nav-inner">
        <div className="app-nav-brand">
          <span className="app-nav-title">DCA Command Center</span>
          <span className="app-nav-subtitle">Long-term investing workflow</span>
        </div>
        <div className="app-nav-links">
          <NavLink to="/" end className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink
            to="/historical-simulator"
            className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
          >
            Simulator
          </NavLink>
          <NavLink
            to="/tax-assistant"
            className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
          >
            Tax Assistant
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
