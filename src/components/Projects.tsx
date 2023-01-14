import { motion } from 'framer-motion'
import cn from 'classnames'
import { Project } from '../services/graphql/types'

type ProjectProps = {
  projects?: Project[]
}

export function Projects({ projects = [] }: ProjectProps) {
  return (
    <section className="pt-8 md:pt-12">
      <div className="px-4 sm:px-8 lg:px-12">
        <div className="mx-auto lg:max-w-5xl">
          <h2 className="section-title">Expertise in Action</h2>

          <h3 className="section-subtitle">
            A selection of my most excited professional projects
          </h3>

          <div className="mt-10 grid gap-6 md:grid-cols-[2fr_1fr_2fr]">
            {projects.map((project, index) => {
              const className = cn(
                'overflow-hidden rounded-lg font-sans dark:bg-brand-800',
                {
                  'md:col-span-2': index === 0 || index === 3,
                  'md:col-span-1': index === 1 || index === 2,
                },
              )

              return (
                <motion.div
                  key={project.slug}
                  layoutId={project?.slug!}
                  className={className}
                  onClick={() => console.log('clicked')}
                >
                  <motion.div className="flex h-64 flex-col justify-end gap-y-1 p-8">
                    <motion.h2 className="text-3xl font-semibold text-zinc-50">
                      {project.title}
                    </motion.h2>
                    <motion.h5 className="text-base font-semibold text-indigo-400">
                      {project.subtitle}
                    </motion.h5>
                    <motion.ul className="list-none">
                      {project.tags.map((tag) => (
                        <motion.li
                          key={tag}
                          className="mr-2 inline-block rounded-full bg-indigo-900 px-2 py-1 text-xs text-indigo-300"
                        >
                          {tag}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
