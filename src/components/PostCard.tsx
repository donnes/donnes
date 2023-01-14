import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Post } from '../services/graphql/types'

type PostCardProps = {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article>
      <Link href={`/blog/${post.slug}`} className="group h-full">
        <div className="flex h-full flex-col overflow-hidden rounded-lg font-sans dark:bg-brand-800">
          <Image
            src={post.coverImage.url}
            className="h-60 w-full scale-100 object-cover blur-0 grayscale-0 duration-700 ease-in-out lg:h-72"
            alt={post.title}
            loading="lazy"
            width={550}
            height={300}
          />

          <div className="flex flex-1 flex-col gap-y-4 p-6">
            <h2 className="flex-none text-2xl font-bold dark:text-zinc-50">
              {post.title}
            </h2>

            <p className="flex-1 flex-col text-base dark:text-zinc-300">
              {post.copy}
            </p>

            <div className="flex items-center justify-between">
              <time className="text-sm text-indigo-300">
                {format(new Date(post.date), 'MMMM dd yyyy')}
              </time>

              <span className="relative flex items-center text-base text-indigo-300">
                Read more
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="ml-2 h-6 w-6 transition-all group-hover:ml-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}
