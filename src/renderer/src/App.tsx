import { useLocation, Routes, Route } from 'react-router-dom'
import { InstallerProvider } from './components/InstallerContext'
import Layout from './components/Layout'
import WelcomeScreen from './components/WelcomeScreen'
import DetailsScreen from './components/DetailsScreen'
import FeaturesScreen from './components/FeaturesScreen'
import LocationScreen from './components/LocationScreen'

function AppContent(): React.JSX.Element {
  const location = useLocation()

  const sidebarImages: Record<string, string> = {
    '/': '',
    '/details':
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAd_pV46GkM78NkBdswnP2fZvZF86ANaaepyAr1h55RgSYf2PjylBifQEAKHcVhSuSM5lSQ0P4JNNzZV8fJgx_KrGSI2SLM3npx_QmhHahaT9Iata3sjiVac_1-9BVgUZTrM7MUg10IfVwvX0Pqv9fv_wjLhY6WWzgUF-QEJ154FkJ3TblOxKVDx4KmaBwnzoacbjrMGrX--zkCleaf1zzPRagbseM7-Odj4abQbK9e8KgZiEVEa58HIhapSTq_Uw83ePld3BJhc_XI',
    '/features':
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAt_bZi48jO43_CUwszj9Z0lU3T6FJxT9CpWkAmMGK_d8iWRkhPQKDJJLOmtQkKTXiXtg7kfJgGWD5Xcbec7pIyzXifINlp1lOPdricRlxySOy4cMWMkGMHzNvVRBRCkznY7S6GqNHv9bRptYsNxuVtG65RSzMsyWvskzZeyx4-ogr_HaLb2m1Z_32c1WkmZ6pwDnJqqgEMJ1M3cn-Ttl07oijpZzlG2wEggIMuwQDOcJwuJHKgG6csivEb_xEOCv5_wDTTHxDQN7Cc',
    '/location':
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAd_pV46GkM78NkBdswnP2fZvZF86ANaaepyAr1h55RgSYf2PjylBifQEAKHcVhSuSM5lSQ0P4JNNzZV8fJgx_KrGSI2SLM3npx_QmhHahaT9Iata3sjiVac_1-9BVgUZTrM7MUg10IfVwvX0Pqv9fv_wjLhY6WWzgUF-QEJ154FkJ3TblOxKVDx4KmaBwnzoacbjrMGrX--zkCleaf1zzPRagbseM7-Odj4abQbK9e8KgZiEVEa58HIhapSTq_Uw83ePld3BJhc_XI'
  }

  return (
    <Layout activeStep={location.pathname} sidebarImg={sidebarImages[location.pathname]}>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/details" element={<DetailsScreen />} />
        <Route path="/features" element={<FeaturesScreen />} />
        <Route path="/location" element={<LocationScreen />} />
      </Routes>
    </Layout>
  )
}

function App(): React.JSX.Element {
  return (
    <InstallerProvider>
      <AppContent />
    </InstallerProvider>
  )
}

export default App
