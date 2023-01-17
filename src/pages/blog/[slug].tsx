import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import {
  GetPostQueryVariables,
  Menu as TMenu,
  Post as TPost,
} from '../../services/graphql/types'
import { Api } from '../../services/api'
import { Navbar } from '../../components/Navbar'
import { Footer } from '../../components/Footer'
import { PageHeader } from '../../components/PageHeader'
import Markdown from 'markdown-to-jsx'

type PostProps = {
  menus?: TMenu[]
  post?: TPost & {
    formattedCreatedAt?: string
  }
}

export async function getStaticPaths() {
  const slugs = await Api.getPostsSlug()

  const paths = slugs.map((slug) => ({
    params: { slug },
  }))

  return {
    paths,
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps<
  any,
  GetPostQueryVariables
> = async ({ params }) => {
  const post = await Api.getPost({ slug: params?.slug as string })
  const menus = await Api.getMenu()

  return {
    props: {
      post,
      menus,
    },
    revalidate: 10,
  }
}

function Post({ post, menus }: PostProps) {
  return (
    <>
      <NextSeo
        title={post?.title}
        description={post?.copy}
        canonical={`https://donnes.vercel.app/blog/${post?.slug}`}
        openGraph={{
          type: 'article',
          article: {
            publishedTime: post?.createdAt,
            modifiedTime: post?.updatedAt,
            authors: post?.authors.map(
              (author) => `https://donnes.vercel.app/authors/${author.slug}`,
            ),
            tags: post?.tags,
          },
          url: `https://donnes.vercel.app/blog/${post?.slug}`,
          site_name: "Donald's Blog | Never. Stop. Learning.",
        }}
      />
      <Navbar menus={menus} />

      <PageHeader>
        <h1 className="text-6xl font-semibold text-zinc-50">{post?.title}</h1>
      </PageHeader>

      <main className="relative min-h-[400px] overflow-hidden border-t pt-8 dark:border-zinc-50 dark:border-opacity-5 md:pt-12">
        <div className="absolute inset-x-0 top-0 -z-10 h-16 bg-gradient-radial to-transparent pt-8 opacity-40 blur-3xl dark:from-indigo-700 dark:via-indigo-900" />

        <div className="px-4 sm:px-8 lg:px-12">
          <div className="mx-auto lg:max-w-5xl">
            <Markdown>{post?.content ?? ''}</Markdown>
          </div>
        </div>
      </main>

      <Footer menus={menus} />
    </>
  )
}

export default Post
