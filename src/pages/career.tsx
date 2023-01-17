import { Fragment, PropsWithChildren } from 'react'
import { NextSeo } from 'next-seo'
import { Menu as TMenu, Job as TJob } from '../services/graphql/types'
import { Api } from '../services/api'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { PageHeader } from '../components/PageHeader'

type CareerProps = {
  menus?: TMenu[]
  jobs?: TJob[]
}

export async function getStaticProps() {
  const menus = await Api.getMenu()
  const jobs = await Api.getJobs()

  return {
    props: {
      menus,
      jobs,
    },
    revalidate: 10, // In seconds
  }
}

function Dot() {
  return (
    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600">
      <div className="h-2 w-2 rounded-full bg-indigo-300" />
    </div>
  )
}

function Badge({ children }: PropsWithChildren) {
  return (
    <div className="rounded-full bg-indigo-900 px-2 py-1 text-xs text-indigo-300 md:flex">
      {children}
    </div>
  )
}

function Career({ menus, jobs }: CareerProps) {
  return (
    <>
      <NextSeo
        title="Career | Donald Silveira"
        description="A timeline of my career, experiences, and accomplishments"
        canonical="https://donnes.vercel.app/career"
      />

      <Navbar menus={menus} />

      <PageHeader>
        <h1 className="text-6xl font-semibold text-zinc-50">Experiences</h1>
        <h2 className="text-2xl font-semibold text-indigo-400">
          A timeline of my career and accomplishments
        </h2>
      </PageHeader>

      <main className="relative min-h-[400px] overflow-hidden border-t pt-8 dark:border-zinc-50 dark:border-opacity-5 md:pt-12">
        <div className="absolute inset-x-0 top-0 -z-10 h-16 bg-gradient-radial to-transparent pt-8 opacity-40 blur-3xl dark:from-indigo-700 dark:via-indigo-900" />

        <div className="px-4 sm:px-8 lg:px-12">
          <div className="relative mx-auto min-h-[400px] lg:max-w-5xl">
            <div className="absolute -top-5 left-[calc(50%_-_1px)] hidden h-full border-l-2 border-indigo-300 border-opacity-50 md:block" />

            <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
              {jobs?.map((job, index) => {
                const isLeft = index % 2 === 0

                if (isLeft) {
                  return (
                    <Fragment key={job.slug}>
                      <div className="relative flex flex-col gap-y-1 md:items-end md:justify-start md:gap-y-1">
                        <div className="absolute top-1 -right-6 hidden md:flex">
                          <Dot />
                        </div>
                        <div className="mb-2 flex md:hidden">
                          <Badge>
                            {job.startDate} — {job.endDate}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-semibold text-indigo-300 md:text-right">
                          {job.role}
                        </h3>
                        <h4 className="text-lg font-bold text-zinc-200 md:text-right">
                          {job.title}
                        </h4>
                        <div
                          className="text-sm text-zinc-300 md:text-right"
                          dangerouslySetInnerHTML={{
                            __html: job.description.html,
                          }}
                        />
                      </div>
                      <div className="hidden items-start justify-start md:flex">
                        <Badge>
                          {job.startDate} — {job.endDate}
                        </Badge>
                      </div>
                    </Fragment>
                  )
                }

                return (
                  <Fragment key={job.slug}>
                    <div className="hidden items-start justify-end md:flex">
                      <Badge>
                        {job.startDate} — {job.endDate}
                      </Badge>
                    </div>
                    <div className="relative flex flex-col items-start justify-end">
                      <div className="absolute top-1 -left-6 hidden md:flex">
                        <Dot />
                      </div>
                      <div className="mb-2 flex md:hidden">
                        <Badge>
                          {job.startDate} — {job.endDate}
                        </Badge>
                      </div>
                      <h3 className="text-left text-xl font-semibold text-indigo-300">
                        {job.role}
                      </h3>
                      <h4 className="text-left text-lg font-bold text-zinc-200">
                        {job.title}
                      </h4>
                      <div
                        className="text-left text-sm text-zinc-300"
                        dangerouslySetInnerHTML={{
                          __html: job.description.html,
                        }}
                      />
                    </div>
                  </Fragment>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer menus={menus} />
    </>
  )
}

export default Career
