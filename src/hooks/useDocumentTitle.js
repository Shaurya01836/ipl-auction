import { useEffect } from 'react'

export function useDocumentTitle(title, description) {
  useEffect(() => {
    if (title) {
      document.title = title
    }
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute('content', description)
      } else {
        metaDescription = document.createElement('meta')
        metaDescription.name = 'description'
        metaDescription.content = description
        document.head.appendChild(metaDescription)
      }
    }
  }, [title, description])
}

export default useDocumentTitle
