import { Post } from '../services/graphql/types'
import { PostCard } from './PostCard'

type PostProps = {
  posts?: Post[]
}

export function Posts({ posts = [] }: PostProps) {
  return (
    <section className="relative min-h-[400px] overflow-hidden border-t pt-8 dark:border-zinc-50 dark:border-opacity-5 md:pt-12">
      <div className="absolute inset-x-0 top-0 -z-10 h-16 bg-gradient-radial to-transparent pt-8 opacity-40 blur-3xl dark:from-indigo-700 dark:via-indigo-900" />

      <div className="px-4 sm:px-8 lg:px-12">
        <div className="mx-auto lg:max-w-5xl">
          <h2 className="section-title">Recent Posts</h2>

          <h3 className="section-subtitle">
            Journey through my experiences and learnings
          </h3>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
