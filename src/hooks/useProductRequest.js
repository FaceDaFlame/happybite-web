import { useEffect, useState } from 'react'

// Loader identity changes when the slug changes. A previous response must
// never replace the next product, including when requests finish out of order.
export default function useProductRequest(loader) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)
  useEffect(() => {
    let active = true
    loader().then(
      (data) => {
        if (active) setResult({ loader, attempt, data, error: false })
      },
      () => {
        if (active) setResult({ loader, attempt, data: null, error: true })
      },
    )
    return () => {
      active = false
    }
  }, [loader, attempt])
  const current = result?.loader === loader && result.attempt === attempt
  return {
    data: current ? result.data : null,
    error: current && result.error,
    loading: !current,
    retry: () => setAttempt((value) => value + 1),
  }
}
