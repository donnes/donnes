import Image from 'next/image'
import Link from 'next/link'
import cn from 'classnames'
import { Navbar as TNavbar } from '../services/graphql/types'
import useScrollPosition from '../hooks/useScrollPosition'

const CV_LINK =
  'https://drive.google.com/file/d/1tG3Wp1BhMmyu7EVFNrEWbM4JPjuqoU3f/view?usp=share_link'

type NavbarProps = {
  links?: TNavbar[]
}

export const Navbar = ({ links }: NavbarProps) => {
  const position = useScrollPosition()

  const navClassName = cn({
    'bg-indigo-900 bg-opacity-10 dark:border-zinc-50': position >= 5,
  })

  return (
    <nav
      className={`supports-backdrop-blur:bg-white/95 sticky top-0 z-20 border-b border-transparent backdrop-blur transition-colors duration-300 dark:border-opacity-10 ${navClassName}`}
    >
      <div className="px-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl lg:max-w-5xl">
          <div className="flex h-16 items-center justify-between">
            <ul className="flex flex-1 flex-row gap-6">
              <li className="flex items-center">
                <Link href="/">
                  <span className="sr-only">Donald</span>
                  <Image
                    src="/logo-letter.svg"
                    width={30}
                    height={30}
                    alt="Donald Silveira"
                  />
                </Link>
              </li>
              {links?.map((item) => (
                <li key={item.slug} className="hidden items-center md:flex">
                  <Link
                    href={item.href}
                    className="font-light text-zinc-900 transition dark:text-white dark:hover:text-indigo-700"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden md:flex md:justify-end">
              <Link
                href={CV_LINK}
                target="_blank"
                className="inline-block rounded-full bg-indigo-600 px-4 py-1.5 text-base font-normal leading-7 text-white ring-1 ring-indigo-700 transition hover:bg-indigo-700 hover:ring-indigo-800"
              >
                Download CV
              </Link>
            </div>
            <div className="flex h-10 flex-row gap-x-6 md:hidden">
              <Link
                href={CV_LINK}
                target="_blank"
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
              </Link>
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
          </div>
        </div>
      </div>
    </nav>
  )
}
