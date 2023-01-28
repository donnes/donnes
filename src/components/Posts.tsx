import { Post } from '../services/graphql/types'
import { PostCard } from './PostCard'

type PostProps = {
  posts?: Post[]
}

export function Posts({ posts = [] }: PostProps) {
  return (
    <section>
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
