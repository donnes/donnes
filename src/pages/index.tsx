import { Author as TAuthor, Navbar as TNavbar } from '../services/graphql/types'
import { Api } from '../services/api'
import { Navbar } from '../components/Navbar'
import { Hero } from '../components/Hero'

type HomeProps = {
  author?: TAuthor
  navbarLinks?: TNavbar[]
}

export async function getStaticProps() {
  const author = await Api.getAuthor()
  const navbarLinks = await Api.getNavbarLinks()

  return {
    props: {
      author,
      navbarLinks,
    },
    revalidate: 10, // In seconds
  }
}

function Home({ author, navbarLinks }: HomeProps) {
  return (
    <div className="bg-indigo-900 bg-opacity-20">
      <Navbar links={navbarLinks} />

      <main className="h-[calc(100vh_-_4.1rem)] pt-6 lg:pt-28">
        <Hero author={author} />
      </main>
    </div>
  )
}

export default Home
