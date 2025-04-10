import React, { useEffect, useRef, useState } from "react";
import jsmediatags from "jsmediatags";
import "./App.css";

interface PlaylistItem {
  name: string;
  url: string;
  album?: string;
  artist?: string;
  albumArt?: string;
}

const XPPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [visualizerMode, setVisualizerMode] = useState<"bars" | "waveform" | "circles">("bars");
  const [equalizer, setEqualizer] = useState<number[]>([0, 0, 0, 0, 0]);
  const [effects, setEffects] = useState({ bassBoost: 0, reverb: 0, echo: 0 });

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  useEffect(() => {
    if (videoRef.current && canvasRef.current) {
      setupAudioVisualizer();
    }
  }, [videoRef.current]);

  const setupAudioVisualizer = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    const source = audioCtx.createMediaElementSource(videoRef.current);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    // Setup gain node for equalizer adjustments
    gainNodeRef.current = audioCtx.createGain();
    source.connect(gainNodeRef.current);
    gainNodeRef.current.connect(analyser);

    drawVisualizer();
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx) return;
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (visualizerMode === "bars") {
        drawBars(ctx, dataArray, canvas);
      } else if (visualizerMode === "waveform") {
        drawWaveform(ctx, dataArray, canvas);
      } else if (visualizerMode === "circles") {
        drawCircles(ctx, dataArray, canvas);
      }

      requestAnimationFrame(draw);
    };

    draw();
  };

  const drawBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = dataArray[i] / 2;
      ctx.fillStyle = `rgb(${barHeight + 100}, 50, 200)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  };

  const drawWaveform = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "cyan";
    ctx.moveTo(0, canvas.height / 2);
    for (let i = 0; i < dataArray.length; i++) {
      const y = (dataArray[i] / 255) * canvas.height;
      ctx.lineTo((i / dataArray.length) * canvas.width, y);
    }
    ctx.stroke();
  };

  const drawCircles = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
    for (let i = 0; i < dataArray.length; i += 10) {
      const radius = dataArray[i] / 5;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${radius * 10}, 100, 255)`;
      ctx.fill();
    }
  };

  const handleEqualizerChange = (index: number, value: number) => {
    const newEqualizer = [...equalizer];
    newEqualizer[index] = value;
    setEqualizer(newEqualizer);
    adjustEqualizer(newEqualizer);
  };

  const adjustEqualizer = (newEqualizer: number[]) => {
    if (gainNodeRef.current) {
      // Simple equalizer with frequency bands
      gainNodeRef.current.gain.value = newEqualizer[0]; // Low frequencies
    }
  };

  const handlePresetEqualizer = (preset: string) => {
    let presetValues: number[] = [];
    switch (preset) {
      case "rock":
        presetValues = [1.2, 0.8, 1.0, 1.1, 0.9];
        break;
      case "jazz":
        presetValues = [0.9, 1.0, 1.1, 1.0, 0.8];
        break;
      case "pop":
        presetValues = [1.1, 0.9, 1.0, 1.0, 1.2];
        break;
      default:
        presetValues = [0, 0, 0, 0, 0];
    }
    setEqualizer(presetValues);
    adjustEqualizer(presetValues);
  };

  // Playlist Reordering using Drag and Drop
  const handleDragStart = (index: number) => {
    setCurrentTrackIndex(index);
  };

  const handleDrop = (index: number) => {
    const newPlaylist = [...playlist];
    const [removed] = newPlaylist.splice(currentTrackIndex, 1);
    newPlaylist.splice(index, 0, removed);
    setPlaylist(newPlaylist);
  };

  return (
    <div className="xp-player">
      <div className="title-bar">Windows Media Player</div>
      <div className="player-body">
        <canvas ref={canvasRef} className="visualizer"></canvas>
        <video ref={videoRef} className="video-screen" controls></video>
        <div className="controls">
          <label>Visualizer Mode:</label>
          <select value={visualizerMode} onChange={(e) => setVisualizerMode(e.target.value as any)}>
            <option value="bars">Bars</option>
            <option value="waveform">Waveform</option>
            <option value="circles">Circles</option>
          </select>

          <label>Volume: 
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} />
          </label>

          <label>Speed: 
            <input type="range" min="0.5" max="2" step="0.1" value={playbackRate} onChange={(e) => setPlaybackRate(parseFloat(e.target.value))} />
          </label>

          <label>Equalizer Preset:</label>
          <select onChange={(e) => handlePresetEqualizer(e.target.value)}>
            <option value="flat">Flat</option>
            <option value="rock">Rock</option>
            <option value="jazz">Jazz</option>
            <option value="pop">Pop</option>
          </select>

          {equalizer.map((value, index) => (
            <div key={index}>
              <label>Band {index + 1}:</label>
              <input type="range" min="-1" max="1" step="0.05" value={value} onChange={(e) => handleEqualizerChange(index, parseFloat(e.target.value))} />
            </div>
          ))}
        </div>

        <div className="playlist">
          {playlist.map((track, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDrop={() => handleDrop(index)}
              onDragOver={(e) => e.preventDefault()}
              className="playlist-item"
            >
              {track.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default XPPlayer;
  useEffect(() => {
    const savedPlaylist = localStorage.getItem("xpPlaylist");
    const savedShuffle = localStorage.getItem("xpShuffle");
    const savedRepeat = localStorage.getItem("xpRepeat");

    if (savedPlaylist) setPlaylist(JSON.parse(savedPlaylist));
    if (savedShuffle) setShuffle(JSON.parse(savedShuffle));
    if (savedRepeat) setRepeat(JSON.parse(savedRepeat));
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  useEffect(() => {
    if (videoRef.current && playlist.length > 0) {
      videoRef.current.src = playlist[currentTrackIndex]?.url;
      if (isPlaying) videoRef.current.play();
    }
  }, [currentTrackIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current) {
        setProgress(videoRef.current.currentTime);
        setDuration(videoRef.current.duration);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const updatePlaylist = (newPlaylist: PlaylistItem[]) => {
    setPlaylist(newPlaylist);
    localStorage.setItem("xpPlaylist", JSON.stringify(newPlaylist));
  };

  const extractMetadata = (file: File, url: string) => {
    return new Promise<PlaylistItem>((resolve) => {
      jsmediatags.read(file, {
        onSuccess: (tag) => {
          const albumArtData = tag.tags.picture;
          let albumArt = "";
          if (albumArtData) {
            const base64String = btoa(String.fromCharCode(...new Uint8Array(albumArtData.data)));
            albumArt = `data:${albumArtData.format};base64,${base64String}`;
          }
          resolve({
            name: file.name,
            url,
            album: tag.tags.album || "Unknown Album",
            artist: tag.tags.artist || "Unknown Artist",
            albumArt,
          });
        },
        onError: () => resolve({ name: file.name, url }),
      });
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newTracks = await Promise.all(files.map((file) => extractMetadata(file, URL.createObjectURL(file))));

      setPlaylist((prev) => {
        const updatedPlaylist = [...prev, ...newTracks];
        localStorage.setItem("xpPlaylist", JSON.stringify(updatedPlaylist));
        return updatedPlaylist;
      });

      if (playlist.length === 0) setCurrentTrackIndex(0);
    }
  };

  const playNext = () => {
    if (shuffle) {
      setCurrentTrackIndex(Math.floor(Math.random() * playlist.length));
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  const playPrevious = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const toggleShuffle = () => setShuffle((prev) => !prev);
  const toggleRepeat = () => setRepeat((prev) => !prev);
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleRightClick = (event: React.MouseEvent, index: number) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, index });
  };

  const removeTrack = (index: number) => {
    const updatedPlaylist = playlist.filter((_, i) => i !== index);
    updatePlaylist(updatedPlaylist);
    if (currentTrackIndex >= updatedPlaylist.length) setCurrentTrackIndex(0);
    setContextMenu(null);
  };

  return (
    <div className="xp-player" onClick={() => setContextMenu(null)}>
      <div className="title-bar">Windows Media Player</div>
      <div className="player-body">
        <div className="album-art">
          {playlist[currentTrackIndex]?.albumArt ? (
            <img src={playlist[currentTrackIndex].albumArt} alt="Album Art" />
          ) : (
            <div className="no-art">No Album Art</div>
          )}
        </div>
        <div className="metadata">
          <strong>{playlist[currentTrackIndex]?.name}</strong>
          <p>{playlist[currentTrackIndex]?.artist} - {playlist[currentTrackIndex]?.album}</p>
        </div>
        <video ref={videoRef} className="video-screen" controls onEnded={repeat ? () => videoRef.current?.play() : playNext}></video>
        <div className="progress-bar">
          <input type="range" min="0" max={duration || 1} value={progress} onChange={(e) => (videoRef.current!.currentTime = Number(e.target.value))} />
          <div className="time-info">{new Date(progress * 1000).toISOString().substring(14, 19)} / {new Date(duration * 1000).toISOString().substring(14, 19)}</div>
        </div>
        <div className="controls">
          <button onClick={togglePlay} className="xp-button">{isPlaying ? "Pause" : "Play"}</button>
          <button onClick={playPrevious} className="xp-button">⏮ Prev</button>
          <button onClick={playNext} className="xp-button">⏭ Next</button>
          <button onClick={toggleShuffle} className={`xp-button ${shuffle ? "active" : ""}`}>🔀 Shuffle</button>
          <button onClick={toggleRepeat} className={`xp-button ${repeat ? "active" : ""}`}>🔁 Repeat</button>
          <label>Volume: <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} /></label>
          <label>Speed: <input type="range" min="0.5" max="2" step="0.1" value={playbackRate} onChange={(e) => setPlaybackRate(parseFloat(e.target.value))} /></label>
          <input type="file" multiple accept="video/*,audio/*" onChange={handleFileSelect} className="xp-button" />
        </div>
      </div>
    </div>
  );
};

export default XPPlayer;