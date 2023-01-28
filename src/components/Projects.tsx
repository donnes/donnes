import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import cn from 'classnames'
import Markdown from 'markdown-to-jsx'
import { Project } from '../services/graphql/types'
import { useMemo, useState } from 'react'

type ProjectProps = {
  projects?: Project[]
}

export function Projects({ projects = [] }: ProjectProps) {
  const [selectedProjectSlug, setSelectedProject] = useState<
    string | undefined
  >(undefined)

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.slug === selectedProjectSlug)
  }, [projects, selectedProjectSlug])

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
                'relative cursor-pointer overflow-hidden rounded-lg font-sans dark:bg-brand-800',
                {
                  'md:col-span-2': index === 0 || index === 3,
                  'md:col-span-1': index === 1 || index === 2,
                },
              )

              return (
                <motion.div
                  key={project.slug}
                  layoutId={project.slug!}
                  className={className}
                  onClick={() => setSelectedProject(project.slug!)}
                >
                  <motion.div className="absolute inset-0 z-0 opacity-40">
                    <Image
                      src={project.image[0].url}
                      className="object-cover"
                      alt={project.title}
                      loading="lazy"
                      fill
                    />
                  </motion.div>
                  <motion.div className="relative z-10 flex h-64 flex-col justify-end gap-y-1 p-8">
                    <motion.h2 className="text-3xl font-semibold text-zinc-50">
                      {project.title}
                    </motion.h2>
                    <motion.h3 className="text-base font-semibold text-indigo-400">
                      {project.subtitle}
                    </motion.h3>
                    <motion.ul className="mt-2 flex list-none flex-row flex-wrap gap-3">
                      {project.tags.map((tag) => (
                        <motion.li
                          key={tag}
                          className="rounded-full bg-indigo-900 px-2 py-1 text-xs text-indigo-300"
                        >
                          {tag}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                </motion.div>
              )
            })}

            <AnimatePresence>
              {selectedProject && (
                <>
                  <motion.div
                    key="modal"
                    className="fixed inset-x-0 top-24 z-20 m-auto h-[calc(100%_-_8rem)] w-[90%] max-w-3xl pr-4"
                    layoutId={selectedProjectSlug}
                  >
                    <motion.div className="relative flex h-full flex-col gap-4 overflow-y-auto rounded-lg p-8 font-sans scrollbar-hide dark:bg-brand-800">
                      <motion.div className="flex flex-row items-center justify-between">
                        <motion.h2 className="text-3xl font-semibold dark:text-zinc-50">
                          {selectedProject.title}
                        </motion.h2>

                        <motion.button
                          onClick={() => setSelectedProject(undefined)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-8 w-8"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </motion.button>
                      </motion.div>

                      {selectedProject.subtitle && (
                        <motion.h5 className="text-base font-semibold dark:text-indigo-400">
                          {selectedProject.subtitle}
                        </motion.h5>
                      )}

                      <motion.ul className="flex list-none flex-row flex-wrap gap-3">
                        {selectedProject.tags.map((tag) => (
                          <motion.li
                            key={tag}
                            className="rounded-full bg-indigo-900 px-2 py-1 text-xs text-indigo-300"
                          >
                            {tag}
                          </motion.li>
                        ))}
                      </motion.ul>

                      <motion.div className="project-markdown">
                        <Markdown>{selectedProject.description}</Markdown>
                      </motion.div>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="-z-5 absolute inset-0 dark:bg-brand-900"
                    key="backdrop"
                    onClick={() => setSelectedProject(undefined)}
                    variants={{
                      hidden: {
                        opacity: 0,
                        transition: {
                          duration: 0.16,
                        },
                      },
                      visible: {
                        opacity: 0.8,
                        transition: {
                          delay: 0.04,
                          duration: 0.2,
                        },
                      },
                    }}
                    initial="hidden"
                    exit="hidden"
                    animate="visible"
                  />
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
