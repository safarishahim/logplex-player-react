import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LogplexPlayer } from '../src';

const EPISODES = [
  {
    id: 'e1',
    src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    poster: 'https://picsum.photos/seed/logplex-1/1280/720',
    title: 'عنوان فیلم',
    subtitle: 'قسمت اول',
  },
  {
    id: 'e2',
    src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    poster: 'https://picsum.photos/seed/logplex-2/1280/720',
    title: 'عنوان فیلم',
    subtitle: 'قسمت دوم',
  },
];

function App() {
  const [current, setCurrent] = useState('e1');

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ color: '#fff', font: '600 18px system-ui' }}>@logplex/player-react</h1>
      <LogplexPlayer
        episodes={EPISODES}
        currentEpisodeId={current}
        onEpisodeChanكge={setCurrent}
        locale="fa"
        dir="rtl"
        badge="ترافیک شما به صورت تمام‌بها حساب می‌شود."
        onLike={(liked) => console.log('like', liked)}
        analytics={{
          baseUrl: 'http://localhost:8080',
          apiKey: 'mk_live_demo',
          userId: 'viewer-demo',
          contentId: current,
          contentType: 'series',
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
