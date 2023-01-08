import { Author } from '../services/graphql/types'
import { Api } from '../services/api'
import { Navbar } from '../components/Navbar'
import { Hero } from '../components/Hero'
import { ParallaxText } from '../components/ParallaxText'

type HomeProps = {
  author?: Author
}

export async function getStaticProps() {
  const author = await Api.getAuthor()

  return {
    props: {
      author,
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 10, // In seconds
  }
}

function Home({ author }: HomeProps) {
  return (
    <>
      <Navbar />

      <main className="h-[2000px] pt-6 lg:pt-28">
        <Hero author={author} />
      </main>
    </>
  )
}

export default Home
