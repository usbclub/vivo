const fs = require("fs");
const path = require("path");

class Player {
  constructor(redisClient) {
    this.redis = redisClient;
    this.currentTrackKey = "currentTrack";
  }

  async initialize() {
    // const trackData = await this.redis.get(this.currentTrackKey);
    // if (trackData) {
    //   this.currentTrack = JSON.parse(trackData);
    // } else {
      const initialTrack = "nova-dreams";
      this.currentTrack = {
        fileUrl: initialTrack,
        trackStartTime: Date.now(),
        duration: await this.getTrackDuration(initialTrack),
      };
      await this.saveCurrentTrack();
    // }
  }

  async saveCurrentTrack() {
    await this.redis.set(this.currentTrackKey, JSON.stringify(this.currentTrack));
  }

  async getCurrentTrack() {
    return this.currentTrack;
  }

  async getTrackDuration(trackName) {
    const filePath = path.join(__dirname, "public", "audio", trackName, "output.m3u8");
    try {
      const data = fs.readFileSync(filePath, "utf8");
      const regex = /#EXTINF:([\d.]+),/g;
      let totalDuration = 0;
      let match;

      while ((match = regex.exec(data)) !== null) {
        totalDuration += parseFloat(match[1]);
      }
      console.log('totalDuration', totalDuration)

      return totalDuration;
    } catch (err) {
      console.error(`[Error] Could not read HLS playlist for ${trackName}:`, err);
      return 180; // Fallback to 3 minutes if the file is missing
    }
  }

  async switchToNextTrack() {
    const trackList = ["nova-dreams", "nova-del-nuevo-dia", "morning", "nova-lofi", "paris", "background"];
    const currentIndex = trackList.indexOf(this.currentTrack.fileUrl);
    const nextTrack = trackList[(currentIndex + 1) % trackList.length];

    this.currentTrack = {
      fileUrl: nextTrack,
      trackStartTime: Date.now(),
      duration: await this.getTrackDuration(nextTrack),
    };

    await this.saveCurrentTrack();
    return this.currentTrack;
  }
}

module.exports = Player;
