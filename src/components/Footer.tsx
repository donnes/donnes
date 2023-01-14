import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { Menu } from '../services/graphql/types'

type FooterProps = {
  menus?: Menu[]
}

export function Footer({ menus = [] }: FooterProps) {
  return (
    <footer className="relative pt-8 md:pt-12">
      <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-radial to-transparent pt-8 opacity-40 blur-3xl dark:from-indigo-700 dark:via-indigo-900" />

      <div className="border-t px-4 py-6 pt-8 dark:border-zinc-50 dark:border-opacity-5 sm:px-8 lg:px-12">
        <div className="mx-auto lg:max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col">
              <Image
                src="/logo.svg"
                width={105.6}
                height={24}
                alt="Donald Silveira"
              />
              <ul className="mt-4 flex flex-row gap-6">
                {menus?.map((menuItem) => (
                  <li key={menuItem.slug} className="flex items-center">
                    <Link
                      href={menuItem.href}
                      className="font-light transition dark:text-indigo-300 dark:hover:text-indigo-500"
                    >
                      {menuItem.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-base font-light dark:text-indigo-300 md:mt-0">
              &copy; {format(new Date(), 'yyyy')} Donald Silveira. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
