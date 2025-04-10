const XPPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      videoRef.current.volume = Number(e.target.value);
      setVolume(Number(e.target.value));
    }
  };

  const updateProgress = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  return (
    <div className="xp-player">
      <div className="title-bar">WMPlayerXP</div>
      <div className="player-body">
        <video ref={videoRef} className="video-screen" src="sample.mp4" onTimeUpdate={updateProgress}></video>
        <div className="controls">
          <button onClick={togglePlay} className="xp-button">
            {isPlaying ? "Pause" : "Play"}
          </button>
          <input type="range" min="0" max="1" step="0.1" value={volume} onChange={changeVolume} />
          <progress value={progress} max="100"></progress>
        </div>
      </div>
    </div>
  );
};