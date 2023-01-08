import Image from 'next/image'
import Link from 'next/link'
import cn from 'classnames'
import useScrollPosition from '../hooks/useScrollPosition'

const navItems = [
  {
    key: 'home',
    title: 'Home',
    href: '/',
  },
  {
    key: 'blog',
    title: 'Blog',
    href: '/blog',
  },
]

export const Navbar = () => {
  const position = useScrollPosition()

  const navClassName = cn({
    'bg-zinc-900': position > 10,
    'bg-opacity-70': position > 10,
    'border-zinc-800': position > 10,
  })

  return (
    <nav
      className={`supports-backdrop-blur:bg-white/95 sticky top-0 z-20 border-b border-transparent backdrop-blur transition-colors duration-300 ${navClassName}`}
    >
      <div className="px-4 sm:px-8 lg:px-12">
        <div className="mx-auto  max-w-2xl lg:max-w-5xl">
          <div
            className="flex h-16 items-center justify-between"
            aria-label="Global"
          >
            <div className="flex lg:min-w-0" aria-label="Global">
              <Link href="/">
                <span className="sr-only">Donald</span>
                <Image
                  src="/logo-letter.svg"
                  width={40}
                  height={40}
                  alt="Donald Silveira"
                />
              </Link>
            </div>
            <div className="flex h-10 flex-row gap-x-6 lg:hidden">
              <a
                href="#"
                className="inline-flex items-center gap-x-1 rounded-full bg-indigo-600 px-4 py-1.5 text-base font-semibold leading-7 text-white ring-1 ring-indigo-700 transition hover:bg-indigo-700 hover:ring-indigo-800"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <span>CV</span>
              </a>
              <button
                type="button"
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-zinc-900 dark:text-zinc-50"
              >
                <span className="sr-only">Open main menu</span>
                {/* Heroicon name: outline/bars-3 */}
                <svg
                  className="h-10 w-10"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </button>
            </div>
            <div className="hidden lg:ml-12 lg:flex lg:min-w-0 lg:flex-1 lg:gap-x-12">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="font-light text-zinc-900 transition dark:text-zinc-50 dark:hover:text-indigo-500"
                >
                  {item.title}
                </Link>
              ))}
            </div>
            <div className="hidden lg:flex lg:min-w-0 lg:justify-end">
              <a
                href="#"
                className="inline-block rounded-full bg-indigo-600 px-4 py-1.5 text-base font-normal leading-7 text-white ring-1 ring-indigo-700 transition hover:bg-indigo-700 hover:ring-indigo-800"
              >
                Download CV
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
