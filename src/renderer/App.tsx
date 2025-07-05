import { Container, Flex } from '@radix-ui/themes'
import { Sidebar } from './components/Layout/Sidebar'
import { MainPanel } from './components/Layout/MainPanel'
import './App.css'

function App() {
  return (
    <Container size="4" className="app-container">
      <Flex className="app-layout">
        <Sidebar />
        <MainPanel />
      </Flex>
    </Container>
  )
}

export default App
