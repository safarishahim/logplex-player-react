import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LogplexPlayer } from '../src';

function App() {
  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ color: '#fff', font: '600 18px system-ui' }}>@logplex/player-react</h1>
      <LogplexPlayer
        src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        title="عنوان فیلم"
        episodeLabel="قسمت سوم"
        locale="fa"
        dir="rtl"
        // Point at a real ingest to see events flow; harmless if unreachable.
        analytics={{
          baseUrl: 'http://localhost:8080',
          apiKey: 'mk_live_demo',
          userId: 'viewer-demo',
          contentId: 'x36xhzz',
          contentType: 'movie',
        }}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
