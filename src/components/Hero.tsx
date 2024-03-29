import Image from 'next/image'
import Link from 'next/link'
import { Author as TAuthor } from '../services/graphql/types'
import { HeroMesh } from './Svgs'

type HeroProps = {
  author?: TAuthor
}

export function Hero({ author }: HeroProps) {
  return (
    <section className="relative">
      <div className="mask-hero-grid pointer-events-none absolute inset-x-0 -top-48 bottom-0 -z-10 overflow-hidden dark:bg-grid-slate-400/[0.03]" />
      <div className="pointer-events-none absolute inset-x-0 -top-32 -z-20 flex transform-gpu justify-center overflow-hidden opacity-20 blur-3xl">
        <HeroMesh />
      </div>

      <div className="py-14 px-4 sm:px-8 lg:py-32 lg:px-12">
        <div className="mx-auto lg:max-w-5xl">
          <div className="grid grid-cols-1 gap-x-20 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-5xl font-extrabold dark:text-zinc-50 sm:text-6xl">
                  {author?.name}
                </h1>
                <h2 className="font-normal dark:text-zinc-200 sm:text-xl">
                  {author?.jobTitle}
                </h2>
              </div>
              <p className="text-lg font-light dark:text-zinc-300">
                {author?.intro}
              </p>
              <ul className="flex list-none gap-4">
                <li>
                  <Link
                    href="https://github.com/donnes"
                    className="dark:fill-indigo-300 hover:dark:fill-indigo-500"
                    aria-label="Follow on GitHub"
                    target="_blank"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7 transition"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.475 2 2 6.588 2 12.253c0 4.537 2.862 8.369 6.838 9.727.5.09.687-.218.687-.487 0-.243-.013-1.05-.013-1.91C7 20.059 6.35 18.957 6.15 18.38c-.113-.295-.6-1.205-1.025-1.448-.35-.192-.85-.667-.013-.68.788-.012 1.35.744 1.538 1.051.9 1.551 2.338 1.116 2.912.846.088-.666.35-1.115.638-1.371-2.225-.256-4.55-1.14-4.55-5.062 0-1.115.387-2.038 1.025-2.756-.1-.256-.45-1.307.1-2.717 0 0 .837-.269 2.75 1.051.8-.23 1.65-.346 2.5-.346.85 0 1.7.115 2.5.346 1.912-1.333 2.75-1.05 2.75-1.05.55 1.409.2 2.46.1 2.716.637.718 1.025 1.628 1.025 2.756 0 3.934-2.337 4.806-4.562 5.062.362.32.675.936.675 1.897 0 1.371-.013 2.473-.013 2.82 0 .268.188.589.688.486a10.039 10.039 0 0 0 4.932-3.74A10.447 10.447 0 0 0 22 12.253C22 6.588 17.525 2 12 2Z"
                      />
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://linkedin.com/in/donaldsilveira"
                    className="dark:fill-indigo-300 hover:dark:fill-indigo-500"
                    aria-label="Follow on LinkedIn"
                    target="_blank"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7 transition"
                      aria-hidden="true"
                    >
                      <path d="M18.335 18.339H15.67v-4.177c0-.996-.02-2.278-1.39-2.278-1.389 0-1.601 1.084-1.601 2.205v4.25h-2.666V9.75h2.56v1.17h.035c.358-.674 1.228-1.387 2.528-1.387 2.7 0 3.2 1.778 3.2 4.091v4.715zM7.003 8.575a1.546 1.546 0 01-1.548-1.549 1.548 1.548 0 111.547 1.549zm1.336 9.764H5.666V9.75H8.34v8.589zM19.67 3H4.329C3.593 3 3 3.58 3 4.297v15.406C3 20.42 3.594 21 4.328 21h15.338C20.4 21 21 20.42 21 19.703V4.297C21 3.58 20.4 3 19.666 3h.003z"></path>
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://instagram.com/donaldsilveira"
                    className="dark:fill-indigo-300 hover:dark:fill-indigo-500"
                    aria-label="Follow on Instagram"
                    target="_blank"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7 transition"
                      aria-hidden="true"
                    >
                      <path d="M12 3c-2.444 0-2.75.01-3.71.054-.959.044-1.613.196-2.185.418A4.412 4.412 0 0 0 4.51 4.511c-.5.5-.809 1.002-1.039 1.594-.222.572-.374 1.226-.418 2.184C3.01 9.25 3 9.556 3 12s.01 2.75.054 3.71c.044.959.196 1.613.418 2.185.23.592.538 1.094 1.039 1.595.5.5 1.002.808 1.594 1.038.572.222 1.226.374 2.184.418C9.25 20.99 9.556 21 12 21s2.75-.01 3.71-.054c.959-.044 1.613-.196 2.185-.419a4.412 4.412 0 0 0 1.595-1.038c.5-.5.808-1.002 1.038-1.594.222-.572.374-1.226.418-2.184.044-.96.054-1.267.054-3.711s-.01-2.75-.054-3.71c-.044-.959-.196-1.613-.419-2.185A4.412 4.412 0 0 0 19.49 4.51c-.5-.5-1.002-.809-1.594-1.039-.572-.222-1.226-.374-2.184-.418C14.75 3.01 14.444 3 12 3Zm0 1.622c2.403 0 2.688.009 3.637.052.877.04 1.354.187 1.67.31.421.163.72.358 1.036.673.315.315.51.615.673 1.035.123.317.27.794.31 1.671.043.95.052 1.234.052 3.637s-.009 2.688-.052 3.637c-.04.877-.187 1.354-.31 1.67-.163.421-.358.72-.673 1.036a2.79 2.79 0 0 1-1.035.673c-.317.123-.794.27-1.671.31-.95.043-1.234.052-3.637.052s-2.688-.009-3.637-.052c-.877-.04-1.354-.187-1.67-.31a2.789 2.789 0 0 1-1.036-.673 2.79 2.79 0 0 1-.673-1.035c-.123-.317-.27-.794-.31-1.671-.043-.95-.052-1.234-.052-3.637s.009-2.688.052-3.637c.04-.877.187-1.354.31-1.67.163-.421.358-.72.673-1.036.315-.315.615-.51 1.035-.673.317-.123.794-.27 1.671-.31.95-.043 1.234-.052 3.637-.052Z"></path>
                      <path d="M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm0-7.622a4.622 4.622 0 1 0 0 9.244 4.622 4.622 0 0 0 0-9.244Zm5.884-.182a1.08 1.08 0 1 1-2.16 0 1.08 1.08 0 0 1 2.16 0Z"></path>
                    </svg>
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://twitter.com/donaldsilveira"
                    className="dark:fill-indigo-300 hover:dark:fill-indigo-500"
                    aria-label="Follow on Twitter"
                    target="_blank"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7 transition"
                      aria-hidden="true"
                    >
                      <path d="M20.055 7.983c.011.174.011.347.011.523 0 5.338-3.92 11.494-11.09 11.494v-.003A10.755 10.755 0 0 1 3 18.186c.308.038.618.057.928.058a7.655 7.655 0 0 0 4.841-1.733c-1.668-.032-3.13-1.16-3.642-2.805a3.753 3.753 0 0 0 1.76-.07C5.07 13.256 3.76 11.6 3.76 9.676v-.05a3.77 3.77 0 0 0 1.77.505C3.816 8.945 3.288 6.583 4.322 4.737c1.98 2.524 4.9 4.058 8.034 4.22a4.137 4.137 0 0 1 1.128-3.86A3.807 3.807 0 0 1 19 5.274a7.657 7.657 0 0 0 2.475-.98c-.29.934-.9 1.729-1.713 2.233A7.54 7.54 0 0 0 22 5.89a8.084 8.084 0 0 1-1.945 2.093Z"></path>
                    </svg>
                  </Link>
                </li>
              </ul>
            </div>

            <div className="relative hidden md:flex">
              <div className="absolute right-0 hidden md:-top-10 md:flex md:w-[400px] lg:-top-32 lg:w-[450px]">
                <Image src="/hero.png" alt="Hero" width={786} height={763} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
