import React, { useRef, useState, useEffect } from 'react';
import './Whiteboard.css';

const TOOLS = {
  PEN: 'pen',
  HIGHLIGHTER: 'highlighter',
  ERASER: 'eraser',
  TEXT: 'text',
  SHAPES: 'shapes',
  POINTER: 'pointer',
  SELECT: 'select'
};

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [selectedTool, setSelectedTool] = useState(TOOLS.PEN);
  const [previousDrawingStyle, setPreviousDrawingStyle] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setContext(ctx);
    
    drawGrid(ctx);

    const handleResize = () => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = window.innerWidth * 0.8;
      canvas.height = window.innerHeight * 0.8;
      drawGrid(ctx);
      ctx.putImageData(imageData, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const drawGrid = (ctx) => {
    const gridSize = 20;
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= canvasRef.current.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasRef.current.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvasRef.current.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasRef.current.width, y);
      ctx.stroke();
    }
  };

  const setDrawingStyle = () => {
    const currentStyle = {
      strokeStyle: context.strokeStyle,
      lineWidth: context.lineWidth,
      globalAlpha: context.globalAlpha,
      globalCompositeOperation: context.globalCompositeOperation
    };

    setPreviousDrawingStyle(currentStyle);

    switch (selectedTool) {
      case TOOLS.PEN:
        context.globalAlpha = 1;
        context.lineWidth = brushSize;
        context.strokeStyle = color;
        context.globalCompositeOperation = 'source-over';
        break;
      case TOOLS.HIGHLIGHTER:
        context.globalAlpha = 0.3;
        context.lineWidth = brushSize * 2;
        context.strokeStyle = color;
        context.globalCompositeOperation = 'multiply';
        break;
      case TOOLS.ERASER:
        context.globalAlpha = 1;
        context.lineWidth = brushSize * 2;
        context.strokeStyle = '#ffffff';
        context.globalCompositeOperation = 'destination-out';
        break;
      default:
        break;
    }
  };

  const startDrawing = (e) => {
    if (selectedTool === TOOLS.POINTER || selectedTool === TOOLS.SELECT) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDrawingStyle();
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || selectedTool === TOOLS.POINTER || selectedTool === TOOLS.SELECT) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      context.closePath();
      setIsDrawing(false);
      
      if (previousDrawingStyle) {
        Object.assign(context, previousDrawingStyle);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx);
  };

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);
  };

  return (
    <div className="whiteboard-container">
      <div className="toolbar">
        <div className="tool-group">
          <button 
            className={`tool-button ${selectedTool === TOOLS.POINTER ? 'active' : ''}`}
            onClick={() => handleToolSelect(TOOLS.POINTER)}
          >
            👆
          </button>
          <button 
            className={`tool-button ${selectedTool === TOOLS.PEN ? 'active' : ''}`}
            onClick={() => handleToolSelect(TOOLS.PEN)}
          >
            ✏️
          </button>
          <button 
            className={`tool-button ${selectedTool === TOOLS.HIGHLIGHTER ? 'active' : ''}`}
            onClick={() => handleToolSelect(TOOLS.HIGHLIGHTER)}
          >
            🖍️
          </button>
          <button 
            className={`tool-button ${selectedTool === TOOLS.ERASER ? 'active' : ''}`}
            onClick={() => handleToolSelect(TOOLS.ERASER)}
          >
            🧹
          </button>
          <button 
            className={`tool-button ${selectedTool === TOOLS.TEXT ? 'active' : ''}`}
            onClick={() => handleToolSelect(TOOLS.TEXT)}
          >
            T
          </button>
          <button 
            className={`tool-button ${selectedTool === TOOLS.SHAPES ? 'active' : ''}`}
            onClick={() => handleToolSelect(TOOLS.SHAPES)}
          >
            ⬜
          </button>
          <button 
            className={`tool-button ${selectedTool === TOOLS.SELECT ? 'active' : ''}`}
            onClick={() => handleToolSelect(TOOLS.SELECT)}
          >
            ⬜
          </button>
        </div>
        <div className="tool-group">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="color-picker"
          />
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="brush-size"
          />
        </div>
        <div className="tool-group">
          <button onClick={clearCanvas} className="clear-button">
            Clear
          </button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        className="whiteboard-canvas"
      />
    </div>
  );
};

export default Whiteboard;