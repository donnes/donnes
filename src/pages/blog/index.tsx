import { NextSeo } from 'next-seo'
import { Menu as TMenu, Post as TPost } from '../../services/graphql/types'
import { Api } from '../../services/api'
import { Navbar } from '../../components/Navbar'
import { Footer } from '../../components/Footer'
import { PageHeader } from '../../components/PageHeader'
import { PostCard } from '../../components/PostCard'

type BlogProps = {
  menus?: TMenu[]
  posts?: TPost[]
}

export async function getStaticProps() {
  const menus = await Api.getMenu()
  const posts = await Api.getPosts({ limit: 16 })

  return {
    props: {
      menus,
      posts,
    },
    revalidate: 10, // In seconds
  }
}

function Blog({ menus, posts }: BlogProps) {
  return (
    <>
      <NextSeo
        title="Donald's Blog | Never. Stop. Learning."
        description="A blog dedicated for Software Engineers, as well for share personal experiences."
        canonical="https://donnes.vercel.app/blog"
      />

      <Navbar menus={menus} />

      <PageHeader>
        <h1 className="text-6xl font-semibold text-zinc-50">Blog</h1>
        <h2 className="text-2xl font-semibold text-indigo-400">
          Never. Stop. Learning.
        </h2>
      </PageHeader>

      <main className="relative min-h-[400px] overflow-hidden border-t py-8 dark:border-zinc-50 dark:border-opacity-5 md:py-12">
        <div className="absolute inset-x-0 top-0 -z-10 h-16 bg-gradient-radial to-transparent pt-8 opacity-40 blur-3xl dark:from-indigo-700 dark:via-indigo-900" />

        <div className="px-4 sm:px-8 lg:px-12">
          <div className="mx-auto lg:max-w-5xl">
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts?.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default Blog
