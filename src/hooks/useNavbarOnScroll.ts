import { useState, useEffect, useCallback } from 'react'

export function useNavbarOnScroll() {
  const [lastScrollPos, setLastScrollPos] = useState(0)
  const [ticking, setTicking] = useState(true)

  const onApplyStyles = useCallback(() => {
    const navbar = document.querySelector('nav')
    if (lastScrollPos > 10 && !navbar?.classList.contains('scroll')) {
      navbar?.classList.add('scroll')
    } else if (lastScrollPos <= 10 && navbar?.classList.contains('scroll')) {
      navbar?.classList.remove('scroll')
    }
    setTicking(false)
  }, [lastScrollPos])

  const onScroll = useCallback(() => {
    setLastScrollPos(document.body.scrollTop)

    if (!ticking) {
      window.requestAnimationFrame(() => {
        onApplyStyles()
      })
      setTicking(true)
    }
  }, [ticking, onApplyStyles])

  useEffect(() => {
    onApplyStyles()

    document.body.addEventListener('scroll', onScroll)
    return () => document.body.removeEventListener('scroll', onScroll)
  }, [onApplyStyles, onScroll])
}
