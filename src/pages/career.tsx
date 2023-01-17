import { Menu as TMenu } from '../services/graphql/types'
import { Api } from '../services/api'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { PageHeader } from '../components/PageHeader'

type CareerProps = {
  menus?: TMenu[]
}

export async function getStaticProps() {
  const menus = await Api.getMenu()

  return {
    props: {
      menus,
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

function Career({ menus }: CareerProps) {
  return (
    <>
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
              <div className="relative flex flex-col items-end justify-start">
                <div className="absolute top-1 -right-6">
                  <Dot />
                </div>
                <h3 className="text-right text-xl font-semibold text-indigo-300">
                  Senior Frontend Engineer (Contact)
                </h3>
                <h4 className="text-right text-lg font-bold text-zinc-200">
                  AccessFintech
                </h4>
                <p className="text-right text-sm text-zinc-300">
                  Implemented new features and bugs fix on the React.js platform
                  Implemented Unit and E2E tests with Cypress Implemented
                  GraphQL queries and mutations Perform code reviews and code
                  quality assurance Worked on a new frontend architecture
                  proposal using Next.js
                </p>
              </div>
              <div className="flex items-start justify-start">
                <div className="rounded-full bg-indigo-900 px-2 py-1 text-xs text-indigo-300">
                  Jun 2022 — Nov 2022
                </div>
              </div>

              <div className="flex items-start justify-end">
                <div className="rounded-full bg-indigo-900 px-2 py-1 text-xs text-indigo-300">
                  Nov 2021 — Present
                </div>
              </div>
              <div className="relative flex flex-col items-start justify-end">
                <div className="absolute top-1 -left-6">
                  <Dot />
                </div>
                <p>aoksaoskosaksa</p>
                <p>aoksaoskosaksa</p>
                <p>aoksaoskosaksa</p>
                <p>aoksaoskosaksa</p>
                <p>aoksaoskosaksa</p>
                <p>aoksaoskosaksa</p>
                <p>aoksaoskosaksa</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer menus={menus} />
    </>
  )
}

export default Career
