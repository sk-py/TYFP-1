// VideoComponent.js
import React from "react";
import Webcam from "react-webcam";

const VideoComponent = ({ onUserMedia }) => {
  const webcamRef = React.useRef(null);

  const handleUserMedia = (stream) => {
    onUserMedia(stream);
  };

  React.useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(handleUserMedia)
      .catch((error) => console.error("Error accessing user media:", error));
  }, [handleUserMedia]);

  return <Webcam audio={true} video={true} ref={webcamRef} />;
};

export default VideoComponent;
