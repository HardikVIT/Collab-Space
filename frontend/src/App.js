import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home/Home';
import Login from './pages/LoginAndSignup/Loginsignup';
import Whiteboard from './pages/whiteboard/Whiteboard';
import Chatroom from './pages/chatroom/mainchat';
import Header from './pages/header/Header';
import Footer from './pages/footer/Footer';
import AboutUs from './pages/aboutus/AboutUs';
import ResumeATS from './pages/ats/Hardik'
import Chatbot from './pages/chatbot/chatbot';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/whiteboard" element={<Whiteboard />} />
          <Route path="/chatroom" element={<Chatroom />} />
          <Route path="/aboutus" element={<AboutUs />} />
          <Route path='/ats' element={<ResumeATS/>}/>
          <Route path='chatbot' element={<Chatbot/>}/>
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

