import React from 'react'
import { Link } from 'react-router-dom'
import './styles.scss'

class ViewHome extends React.Component {
  render(){
    return (
      <div className="viewHome">
        <Link className="btn" to="/video-chat">Join Video Chat</Link>
      </div>
    )
  }
}

export default ViewHome
