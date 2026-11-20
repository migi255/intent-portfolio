import { createRoot, hydrateRoot } from 'react-dom/client'
import { PublicPortfolio } from './PublicPortfolio'
import './styles.css'
import './evidence.css'

const root = document.getElementById('root')
if (!root) throw new Error('The portfolio mount point is missing.')

const path = window.location.pathname
const params = new URLSearchParams(window.location.search)
if ((path === '/' || path === '/index.html') && (window.location.hash === '#results' ||
    ['q', 'view', 'filter', 'presentation'].some(key => params.has(key)))) {
  void Promise.all([import('./App'), import('./state/navigation')]).then(([{ App }, { createNavigation }]) => {
    const navigation = createNavigation(window)
    createRoot(root).render(<App navigation={navigation} initialView={navigation.restore()} />)
  })
} else {
  const page = <PublicPortfolio initialPath={path} publication={{
    origin: root.dataset.publicOrigin,
    generatedAt: root.dataset.evidenceGenerated,
  }} />
  if (root.dataset.prerendered === path || root.dataset.prerendered === path + '/') hydrateRoot(root, page)
  else createRoot(root).render(page)
}
