import { useState, useEffect } from 'react'

const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    const updatePosition = () => {
      setScrollPosition(document.body.scrollTop)
    }
    updatePosition()
    document.body.addEventListener('scroll', updatePosition)
    return () => document.body.removeEventListener('scroll', updatePosition)
  }, [])

  return scrollPosition
}

export default useScrollPosition
