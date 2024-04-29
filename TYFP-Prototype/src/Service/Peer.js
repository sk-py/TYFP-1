class PeerService {
  constructor() {
    if (!this.peer) {
      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:global.stun.twilio.com:3478",
            ],
          },
        ],
      });
    }
  }
  async getOffer() {
    if (this.peer) {
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(new RTCSessionDescription(offer));
      return offer;
    }
  }

  // async getAnswer(offer) {
  //   if (this.peer) {
  //     const answer = await this.peer.createAnswer();
  //     await this.peer.setLocalDescription(new RTCSessionDescription(answer));
  //     console.log("offer from answer method", offer);
  //     return answer;
  //   }
  // }

  async setAnswer(answer) {
    if (this.peer) {
      await this.peer.setRemoteDescription(answer);
      console.log("Remote description Set of first user");
    }
  }

  async setRemoteDescription(offer) {
    if (this.peer) {
      await this.peer.setRemoteDescription(offer);
      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(new RTCSessionDescription(answer));
      return answer;
    }
  }
}

export default new PeerService();
