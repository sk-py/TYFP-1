import React, { useEffect, useRef, useState } from "react";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import ACTIONS from "../Actions";
import PeerService from "../Service/Peer";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";
import toast from "react-hot-toast";

const EditorPages = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);
  const [offersObj, setoffersObj] = useState({});
  const [IsInitiator, setIsInitiator] = useState(false);
  const [IsSecondUser, setIsSecondUser] = useState(false);
  const [RemoteStream, setRemoteStream] = useState();
  let mySocketId = null;

  // const [myStream,setMyStream] = useState("");
  const reactNavigator = useNavigate();
  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("socket connection failed, try again later.");
        reactNavigator("/");
      }
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        userName: location.state?.userName,
      });

      socketRef.current.on("roomFull", ({ message }) => {
        reactNavigator("/");
        console.log("messsage", message);
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        async ({ clients, userName, socketId, storedOffer }) => {
          if (Object.keys(storedOffer).length > 2) {
            reactNavigator("/");
            toast.error("Room full contact meeting Host or Interviewer");
          }
          if (userName !== location.state?.userName) {
            toast.success(`${userName} joined the room.`);
            console.log(`${userName} joined`);
          }
          setClients(clients);
          mySocketId = socketId;
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });

          //!***----------------------------------------------------------- Continue from here ---------------------------------------- ***/;

          //! ---------------------- First to check whether thers any offer or answer ---------------------------------------**/

          // if (storedOffer) {
          //   const offerSocketId = Object.keys(storedOffer)[0];

          //   const extractedOffer = Object.values(storedOffer)[0];

          //   console.log("offerSocketId", extractedOffer);

          //   if (storedOffer?.offerSocketId?.type == "offer") {
          //     console.log(offerSocketId.type);
          //     console.log("YEs an offer");
          //   }
          // }

          if (Object.keys(storedOffer).length === 0) {
            try {
              const offer = await PeerService.getOffer();
              console.log(`offer created by user ${mySocketId}: ${offer}`);
              await socketRef.current.emit("offerCreated", {
                offer,
                mySocketId,
              });
              setIsInitiator(true);
            } catch (error) {
              console.log("Error while generating offer :", error);
            }
          }

          if (Object.keys(storedOffer).length === 1 && !IsInitiator) {
            ///** Continue from here ---  */
            //? Extracting offer object form the storedoffer and setting it as local description
            //? Can also extract only sdp from offer then adding type as offer then making a self offer object and pass it as offer to setRemoteDescription method.

            socketRef.current.emit("requestStoredOffer", mySocketId);

            socketRef.current.on("takeStoredOffer", async ({ storedOffer }) => {
              console.log("Stored Offer from take Stored offer", storedOffer);
            });

            const extractedOffer = await Object.values(storedOffer)[0];

            if (extractedOffer) {
              console.log("extractedOffer", extractedOffer);
              try {
                const answer = await PeerService.setRemoteDescription(
                  extractedOffer
                );
                console.log(
                  `Answer created from user ${mySocketId} : `,
                  answer
                );
                await socketRef.current.emit("answerCreated", {
                  answer,
                  mySocketId,
                });
                setIsSecondUser(true);
              } catch (error) {
                console.log("Error while generating offer :", error);
              }
            }
          }

          // }

          // let storedSDPs = {};
          // socketRef.current.on("getStoredOffers", async ({ storedOffer }) => {
          //   storedSDPs = storedOffer;

          //   if (Object.keys(storedOffer).length < 1) {
          //     try {
          //       const offer = await PeerService.getOffer();
          //       console.log("mySocketId", mySocketId);
          //       await socketRef.current.emit("offerCreated", {
          //         offer,
          //         mySocketId,
          //       });
          //       console.log("offer", offer);
          //     } catch (error) {
          //       console.error("Error:", error);
          //     }
          //   }

          //   if (Object.keys(storedOffer).length > 2) {
          //     reactNavigator("/");
          //     toast.error("Room full contact meeting Host or Interviewer");
          //   }
          //   setoffersObj(storedOffer);
          //   console.log("Offers Object", Object.keys(storedOffer).length);
          // });
          // if (!IsInitiator && Object.keys(offersObj).length < 1) {
          //   // *Some sort of logic that differentiate the 1st user and second user then only runs this part if its the second user
          //   const answer = await PeerService.setRemoteDescription(offersObj[0]);
          //   await socketRef.current.emit("answerCreated", {
          //     answer,
          //     mySocketId,
          //   });
          //   console.log("offersObj", offersObj);
          // }
        }
      );

      socketRef.current.on("getStoredOffers", async ({ storedOffer }) => {
        console.log("Both the answer and offer obtained", storedOffer);
      });

      socketRef.current.on("takeStoredAnswer", async ({ storedOffer }) => {
        const StoredAnswer = await Object.values(storedOffer)[1];
        if (!PeerService.peer.remoteDescription) {
          console.log("Answer obtained", await StoredAnswer);
        }
        IsInitiator && (await PeerService.setAnswer(StoredAnswer));
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        delete offersObj[socketId];
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };

    const userVideo = document.getElementById("userVideo");
    const peerVideo = document.getElementById("peerVideo");

    let userMediaStream;

    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;

    const stream = navigator.getUserMedia(
      {
        audio: true,
        video: true,
      },
      function (stream) {
        userMediaStream = stream;
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function (e) {
          userVideo.play();
        };
        stream.getTracks().forEach((track) => {
          PeerService.peer.addTrack(track, stream);
        });
      },
      function (err) {
        alert("Audio or Video " + err.message);
      }
    );
    init();

    function stopMediaStream() {
      if (userMediaStream && userMediaStream.getTracks) {
        const tracks = userMediaStream.getTracks();

        tracks.forEach((track) => {
          track.stop();
        });
      }
    }

    PeerService.peer.addEventListener("negotiationneeded", () => {
      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        userName: location.state?.userName, //* Adding a count variable on the server side to keep track whether its first time join event is emmited or the second time if its second time clearing the previous data stored in storedOffer object */
        //! Commented on 23 - 04 - 2024
      });
    });

    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      stopMediaStream();
    };
  }, []);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copy the Room Id");
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }
  return (
    <div className="mainWrap">
      <video
        playsInline
        src=""
        style={{
          width: "550px",
          marginLeft: "60vw",
          borderRadius: "1rem",
          // position: "absolute",
        }}
        id="userVideo"
      ></video>
      <video id="peerVideo"></video>
      <div className="aside">
        <div className="asideInner">
          <h3>Users</h3>
          <div className="clientsList">
            {clients.map((clients) => (
              <Client key={clients.socketId} userName={clients.userName} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy Room ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave
        </button>
      </div>
      <div className="editorWrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
        />
      </div>
    </div>
  );
};

export default EditorPages;
