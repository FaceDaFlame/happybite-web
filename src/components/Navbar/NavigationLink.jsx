import { Link, NavLink, useMatch } from 'react-router-dom'
import Icon from '@/components/Icon'

export default function NavigationLink({
  label,
  to,
  mobile = false,
  locked = false,
  onClick,
}) {
  const productDetail = useMatch('/produk/:slug')
  const className = mobile
    ? 'block rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-blush'
    : 'rounded-full px-3 py-3 text-xs font-semibold transition hover:bg-blush xl:px-4'
  return to.includes('#') ? (
    <Link to={to} onClick={onClick} className={`${className} text-muted`}>
      {locked && (
        <Icon name="lock" className="mr-1 inline-block h-3 w-3 align-middle" />
      )}
      {label}
    </Link>
  ) : (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `${className} ${isActive || (to === '/katalog' && productDetail) ? 'bg-blush text-chocolate' : 'text-muted'}`
      }
    >
      {locked && (
        <Icon name="lock" className="mr-1 inline-block h-3 w-3 align-middle" />
      )}
      {label}
    </NavLink>
  )
}
