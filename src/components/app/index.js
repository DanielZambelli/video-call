import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Home from '../../views/home'
import VideoChat from '../../views/videoChat'
import './styles.scss'

const App = () => {
  return (
    <div className="app">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/video-chat" element={<VideoChat />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
