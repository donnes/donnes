import Image from 'next/image'
import Link from 'next/link'
import { Menu as TMenu } from '../services/graphql/types'
import { useNavbarOnScroll } from '../hooks/useNavbarOnScroll'

const CTA_LINK = 'https://calendly.com/donaldsilveira/book'
const CTA_TEXT = "Let's Talk"

type NavbarProps = {
  menus?: TMenu[]
}

export const Navbar = ({ menus }: NavbarProps) => {
  useNavbarOnScroll()

  return (
    <nav className="sticky top-0 z-40 border-b border-transparent transition-all duration-150 ease-in-out">
      <div className="px-4 sm:px-8 lg:px-12">
        <div className="mx-auto lg:max-w-5xl">
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
              {menus?.map((menuItem) => (
                <li key={menuItem.slug} className="hidden items-center md:flex">
                  <Link
                    href={menuItem.href}
                    className="font-light transition dark:text-white dark:hover:text-indigo-500"
                  >
                    {menuItem.title}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden md:flex md:justify-end">
              <Link
                href={CTA_LINK}
                target="_blank"
                className="inline-block rounded-full bg-indigo-600 px-4 py-1.5 text-base font-normal leading-7 text-white transition hover:bg-indigo-700"
              >
                {CTA_TEXT}
              </Link>
            </div>
            <div className="flex h-10 flex-row gap-x-6 md:hidden">
              <Link
                href={CTA_LINK}
                target="_blank"
                className="inline-flex items-center gap-x-1 rounded-full bg-indigo-600 px-4 py-1.5 text-base font-semibold leading-7 text-white transition hover:bg-indigo-700"
              >
                {CTA_TEXT}
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
