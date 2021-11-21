const Video = ({ srcObject, ...props }) => {
  const refVideo = (ref) => {
    if(ref) ref.srcObject = srcObject
  }
  const handle = (event) => event => event.target.play()
  return <video ref={refVideo} muted autoPlay playsInline {...props} onLoadedMetadata={handle} />
}

export default Video
