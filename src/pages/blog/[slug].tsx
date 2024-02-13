import { GetStaticProps } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import {
  GetPostQueryVariables,
  Menu as TMenu,
  Post as TPost,
} from '../../services/graphql/types'
import { Api } from '../../services/api'
import { Navbar } from '../../components/Navbar'
import { Footer } from '../../components/Footer'
import { PageHeader } from '../../components/PageHeader'

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

  const postContent = await serialize(post.content ?? '')

  return {
    props: {
      post: {
        ...post,
        content: postContent,
      },
      menus,
    },
    revalidate: 10,
  }
}

const markdownComponents = {
  Image,
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
          images: [
            {
              url: post?.coverImage.url ?? '',
              width: 1200,
              height: 600,
              alt: post?.title,
            },
          ],
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
        <p className="text-md self-start dark:text-zinc-50">
          {`By ${post?.authors[0].name} `}
          <time dateTime={post?.createdAt} className="dark:text-indigo-300">
            {post?.formattedCreatedAt}
          </time>
        </p>
      </PageHeader>

      <main className="relative min-h-[400px] overflow-hidden border-t py-8 dark:border-zinc-50 dark:border-opacity-5 md:py-12">
        <div className="absolute inset-x-0 top-0 -z-10 h-16 bg-gradient-radial to-transparent pt-8 opacity-40 blur-3xl dark:from-indigo-700 dark:via-indigo-900" />

        <div className="px-4 sm:px-8 lg:px-12">
          <div className="mx-auto lg:max-w-5xl">
            <article className="prose max-w-none prose-a:text-indigo-300 hover:prose-a:text-indigo-500 prose-img:my-0 dark:prose-invert lg:prose-xl">
              <MDXRemote
                {...(post?.content as any)}
                components={markdownComponents}
              />
            </article>

            <Link
              href="/blog"
              className="mt-4 inline-block rounded-full bg-indigo-600 px-4 py-1.5 text-base font-normal leading-7 text-white transition hover:bg-indigo-700"
            >
              Back to Blog Home
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

export default Post
