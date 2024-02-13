import {
  FeatureFlag as TFeatureFlag,
  Author as TAuthor,
  Menu as TMenu,
  Post as TPost,
  Project as TProject,
} from '../services/graphql/types'
import { Api } from '../services/api'
import { Navbar } from '../components/Navbar'
import { Hero } from '../components/Hero'
import { Posts } from '../components/Posts'
import { Projects } from '../components/Projects'
import { Footer } from '../components/Footer'

type HomeProps = {
  disabledFeatures: TFeatureFlag['featureName'][]
  menus?: TMenu[]
  author?: TAuthor
  posts?: TPost[]
  projects?: TProject[]
}

export async function getStaticProps() {
  const featureFlags = await Api.getFeatureFlags()
  const menus = await Api.getMenu()
  const author = await Api.getAuthor()
  const posts = await Api.getPosts({ limit: 6 })
  const projects = await Api.getProjects({ limit: 4 })

  const disabledFeatures = featureFlags
    .filter((f) => !f.enabled)
    .map((f) => f.featureName)

  return {
    props: {
      disabledFeatures,
      menus: menus.filter((m) => !disabledFeatures.includes(m.slug)),
      author,
      posts,
      projects,
    },
    revalidate: 10, // In seconds
  }
}

function Home({ disabledFeatures, menus, author, posts, projects }: HomeProps) {
  const canDisplayBlogPosts = !disabledFeatures.includes('blog')

  return (
    <>
      <Navbar menus={menus} />

      <main className="relative">
        <Hero author={author} />

        <div className="relative min-h-[400px] overflow-hidden border-t pt-8 dark:border-zinc-50 dark:border-opacity-5 md:pt-12">
          <div className="absolute inset-x-0 top-0 -z-10 h-16 bg-gradient-radial to-transparent pt-8 opacity-40 blur-3xl dark:from-indigo-700 dark:via-indigo-900" />

          {canDisplayBlogPosts && posts?.length && <Posts posts={posts} />}

          <Projects projects={projects} />
        </div>
      </main>
    </>
  )
}

export default Home
