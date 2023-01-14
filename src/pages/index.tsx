import {
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
  menus?: TMenu[]
  author?: TAuthor
  posts?: TPost[]
  projects?: TProject[]
}

export async function getStaticProps() {
  const menus = await Api.getMenu()
  const author = await Api.getAuthor()
  const posts = await Api.getPosts({ limit: 6 })
  const projects = await Api.getProjects({ limit: 4 })

  return {
    props: {
      menus,
      author,
      posts,
      projects,
    },
    revalidate: 10, // In seconds
  }
}

function Home({ menus, author, posts, projects }: HomeProps) {
  return (
    <>
      <Navbar menus={menus} />

      <main>
        <Hero author={author} />

        <Posts posts={posts} />

        <Projects projects={projects} />
      </main>

      <Footer menus={menus} />
    </>
  )
}

export default Home
