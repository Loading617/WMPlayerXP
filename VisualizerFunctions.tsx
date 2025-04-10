const drawBars = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
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

const drawWaveform = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgb(0, 255, 0)";
  ctx.beginPath();

  let sliceWidth = canvas.width / dataArray.length;
  let x = 0;

  for (let i = 0; i < dataArray.length; i++) {
    let v = dataArray[i] / 255;
    let y = v * canvas.height;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
};

const drawCircle = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, canvas: HTMLCanvasElement) => {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let radius = Math.min(canvas.width, canvas.height) / 3;
  let centerX = canvas.width / 2;
  let centerY = canvas.height / 2;

  for (let i = 0; i < dataArray.length; i += 5) {
    let value = dataArray[i] / 255;
    let angle = (i / dataArray.length) * 2 * Math.PI;
    let x = centerX + Math.cos(angle) * radius * (1 + value);
    let y = centerY + Math.sin(angle) * radius * (1 + value);

    ctx.fillStyle = `rgb(${value * 255}, 100, 255)`;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  }
};