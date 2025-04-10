import React, { useEffect, useRef, useState } from "react";
import "./App.css";

const XPPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      const audioContext = new AudioContext();
      const analyserNode = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(videoRef.current);
      source.connect(analyserNode);
      analyserNode.connect(audioContext.destination);

      analyserNode.fftSize = 256; // Defines frequency resolution
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      setAudioCtx(audioContext);
      setAnalyser(analyserNode);
      setDataArray(dataArray);
    }
  }, []);

  useEffect(() => {
    if (analyser && dataArray && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d")!;
      const draw = () => {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / dataArray.length) * 2;
        let barHeight;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          barHeight = dataArray[i] / 2;
          ctx.fillStyle = `rgb(${barHeight + 100}, 50, 150)`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 2;
        }
      };
      draw();
    }
  }, [analyser, dataArray]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        audioCtx?.resume();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="xp-player">
      <div className="title-bar">WMPlayerXP</div>
      <div className="player-body">
        <video ref={videoRef} className="video-screen" src="sample.mp4"></video>
        <canvas ref={canvasRef} width="400" height="100" className="visualizer"></canvas>
        <div className="controls">
          <button onClick={togglePlay} className="xp-button">
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default XPPlayer;

