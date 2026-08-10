import { NavLink } from 'react-router-dom';
import { HOME_STEPS } from './steps';
import { PATHS } from '../../routes/paths';

export default function StepsNav() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {HOME_STEPS.map(({ path, icon: Icon, title, desc }) => (
        <NavLink
          key={path}
          to={path}
          end={path === PATHS.HOME}
          className={({ isActive }) =>
            `flex items-center gap-4 rounded-xl2 p-5 transition-colors ${
              isActive ? 'bg-brand-600 text-white shadow-soft' : 'bg-white text-navy shadow-card hover:bg-slate-50'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${isActive ? 'bg-white text-brand-600' : 'bg-slate-100 text-slate-500'}`}>
                <Icon size={24} />
              </span>
              <span>
                <span className="block text-sm font-bold">{title}</span>
                <span className={`mt-1 block text-xs ${isActive ? 'text-white/85' : 'text-slate-500'}`}>{desc}</span>
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
