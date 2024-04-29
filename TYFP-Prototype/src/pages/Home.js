import React, { useState } from "react";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");

  const createNewRoom = (e) => {
    e.preventDefault();

    const id = uuidV4();
    setRoomId(id);
    toast.success('Created a new room');
  };

  const joinRoom = () => {
    if(!roomId || !userName) {
        toast.error('Room Id and UserName is Required');
        return;
    }

     navigate(`/editor/${roomId}`, {
        state : {
            userName,
        },
     })
  };

  const handleInputEnter = (e) => {
    // console.log('event', e.code);
    if(e.code === 'Enter') {
        joinRoom();
    }
  }
  

  return (
    <div className="homePageWrapper">
      <div className="formWrapper">
        {/* <img src="/code-sync.png" alt="code" className='homePageLogo' /> */}

        <h4 className="mainLable">Paste Invitation Room ID</h4>

        <div className="inputGroup">
          <input
            type="text"
            className="inputBox"
            placeholder="Room ID"
            onChange={(e) => setRoomId(e.target.value)}
            value={roomId}
            onKeyUp={handleInputEnter}
          />

          <input
            type="text"
            className="inputBox"
            placeholder="UserName"
            onChange={(e) => setUserName(e.target.value)}
            value={userName}
            onKeyUp={handleInputEnter}
          />

          <button className="btn joinBtn" onClick={joinRoom}>Join</button>

          <span className="createInfo">
            If you don't have an invite then create &nbsp;
            <a onClick={createNewRoom} href="" className="createNewBtn">
              new room
            </a>
          </span>
        </div>
      </div>

      <footer>
        <h4>
          Built with 💛&nbsp;by&nbsp; <a href=""></a>{" "}
        </h4>
      </footer>
    </div>
  );
};

export default Home;
