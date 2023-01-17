import { PropsWithChildren } from 'react'
import { HeroMesh } from './Svgs'

export function PageHeader({ children }: PropsWithChildren) {
  return (
    <header className="relative">
      <div className="mask-hero-grid pointer-events-none absolute inset-x-0 -top-48 bottom-0 -z-10 overflow-hidden dark:bg-grid-slate-400/[0.03]" />
      <div className="pointer-events-none absolute inset-x-0 -top-32 -z-20 flex transform-gpu justify-center overflow-hidden opacity-20 blur-3xl">
        <HeroMesh />
      </div>

      <div className="py-12 px-4 sm:px-8 lg:py-20 lg:px-12">
        <div className="mx-auto lg:max-w-5xl">
          <div className="flex flex-col items-center justify-center gap-4">
            {children}
          </div>
        </div>
      </div>
    </header>
  )
}
