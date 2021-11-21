import React from 'react'
import io from 'socket.io-client'
import Peer from 'peerjs-client'
import { Link } from 'react-router-dom'
import HangupIcon from './hangupIcon'
import Video from './video'
import './styles.scss'

class ViewVideoChat extends React.Component{

  state = {
    myStream: null,
    myId: null,
    mySocket: null,
    myPeer: null,
    users: {},
  }

  async componentDidMount(){
    const myStream = await this.getMedia()
    const mySocket = await this.getSocket()
    const myId = mySocket.id
    const myPeer = await this.getPeer(myId, myStream)
    this.setState({ myStream, myId, mySocket, myPeer })
  }

  async componentDidUpdate(prevProps, prevState){
    if(!!this.state.myStream && !!this.state.mySocket && !!this.state.myPeer){

      // add my stream to my user
      if(!this.state.users?.[this.state.myId]?.stream){
        this.setState({ users: { ...this.state.users, [this.state.myId]: { ...this.state.users[this.state.myId], stream: this.state.myStream }}})
      }

      // users online but we havent connected yet so we call
      for(const user of Object.values(this.state.users).filter(user => !user.stream)){
        await this.callUser(user)
      }
    }
  }

  componentWillUnmount(){
    Object.values(this.state.users).forEach(this.hangUpOnUser)
    if(this.state.mySocket) this.state.mySocket.close()
    if(this.state.myPeer) this.state.myPeer.destroy()
    if(this.state.myStream) this.state.myStream.getTracks().forEach(track => track.stop())
  }

  getMedia(){
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }, audio: false,
    })
  }

  getSocket(){
    return new Promise((res,rej) => {
      const socket = io(process.env.REACT_APP_SOCKET)
      socket.on('connect', () => {
        socket.onAny((event, args) => {
          switch (event) {
            case 'users':
              // reduce into list of users keeping their stream and props...
              const users = args.reduce((map, i) => {
                if(!map[i]) map[i] = {}
                map[i].id = i
                map[i].stream = map[i].stream || null
                map[i].peerDataConnection = map[i].peerDataConnection || null
                return map
              }, { ...this.state.users })

              // remove disconnected users
              Object.keys(this.state.users).filter(userId => !args.includes(userId)).forEach(disconnectedUserId => {
                this.hangUpOnUser(users[disconnectedUserId], true)
                delete users[disconnectedUserId]
              })
              this.setState({users})
            break
            default:
            break
          }
        })
        res(socket)
      })
      socket.on('error', rej)
    })
  }

  getPeer(id, stream){
    return new Promise((res,rej) => {
      const peer = new Peer(`id${id}`, {
        host: process.env.REACT_APP_PEER,
        port: process.env.REACT_APP_PEER_PORT,
        secure: process.env.REACT_APP_PEER_PORT === '443' ? true : undefined,
        path: '/vvpc-peer',
        key: 'vvcp',
        debug: true,
      })

      // event: someone is calling so we answer
      peer.on('call', call => {
        call.answer(stream)
        call.on('stream', stream => {
          id = call.peer.substring(2) //remove the "id" prefix
          this.setState({ users: { ...this.state.users, [id]: { ...this.state.users[id], stream }}})
        })
      })

      peer.on('open', () => res(peer))

      peer.on('error', rej)
    })
  }

  callUser = (user) => {
    return new Promise((res,rej) => {
      if(!this.state.myPeer) throw new Error('peer connection not initialized yet')
      if(this.state.myId === user.id) return res()
      const conn = this.state.myPeer.connect('id'+user.id)
      conn.on('open', () => {
        const call = this.state.myPeer.call('id'+user.id, this.state.myStream)
        call.on('stream', stream => this.setState({ users: { ...this.state.users, [user.id]: { ...this.state.users[user.id], stream, peerDataConnection: conn }}}, res))
      })
      conn.on('error', () => this.hangUpOnUser(user))
      conn.on('close', () => this.hangUpOnUser(user))
    })
  }

  hangUpOnUser = (user, skipState = false) => {
    if(this.state.myId === user.id) return
    if(!!user.stream) user.stream.getTracks().forEach(track => track.stop())
    if(!!user.peerDataConnection) user.peerDataConnection.close()
    if(!skipState){
      const nextUsers = { ...this.state.users }
      delete nextUsers[user.id]
      this.setState({ users: nextUsers })
    }
  }

  render(){
    console.log('>> render state', this.state)
    var users = Object.values(this.state.users)
      .filter(u => !!u.stream)
      .sort((a,b) => {
        a = this.state.myId === a.id ? 0 : 1
        b = this.state.myId === b.id ? 0 : 1
        return b-a
      })
    return (
      <div className="viewVideoChat">
        <div className="overlay"></div>
        <div className="modal">
          <div className="modal__wrap">
            {users.map(user => (
              <div key={'id-'+user.stream.id} className={`modal__box ${user.id === this.state.myId ? 'modal__box--my' : ''}`}>
                <Video className="modal__video" srcObject={user.stream}/>
              </div>
            ))}
          </div>
          <div className="label">Sound muted</div>
          <Link className="hangup" to="/"><HangupIcon/></Link>
        </div>
      </div>
    )
  }
}

export default ViewVideoChat
