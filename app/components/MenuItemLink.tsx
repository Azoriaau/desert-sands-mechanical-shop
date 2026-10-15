import {Link} from 'react-router';
import type {MenuLink} from '~/lib/menu';

/** Router link for store menu items, plain anchor for anything off-site. */
export function MenuItemLink({
  link,
  className,
  onClick,
  children,
}: {
  link: MenuLink;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (link.external) {
    return (
      <a href={link.href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link
      to={link.href}
      prefetch="intent"
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
