import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="figma-hero" data-node-id="1:2" data-name="Первый экран">
      <h1 className="title title-main" data-node-id="1:3">Екатерина</h1>
      <div className="circle circle-left" data-node-id="3:4" />
      <div className="circle circle-center" data-node-id="3:2" />
      <div className="circle circle-top" data-node-id="3:3" />
      <p className="title title-site" data-node-id="3:5">Сайт</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
