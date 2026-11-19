import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { createNavigation } from './state/navigation'
import './styles.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('The portfolio mount point is missing.')
}

const navigation = createNavigation(window)
const initialView = navigation.restore()

createRoot(root).render(
  <StrictMode>
    <App navigation={navigation} initialView={initialView} />
  </StrictMode>,
)
