import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Scissors, Volume2, VolumeX, RotateCcw,
  Heart, Sparkles, Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import './App.css';

const VIDEO_SOURCES = [
  '/videos/video1.mp4',
  '/videos/video2.mp4',
  '/videos/video3.mp4',
  '/videos/video4.mp4',
  '/videos/video5.mp4',
  '/videos/video6.mp4',
  '/videos/video7.mp4',
  '/videos/video8.mp4',
];

export default function App() {
  const stageRef = useRef(null);
  const ribbonRef = useRef(null);
  const scissorsRef = useRef(null);
  const videoRef = useRef(null);

  const soundPreferenceRef = useRef(false);
  const dragRef = useRef({
    active: false,
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
  });

  const [phase, setPhase] = useState('gift');
  const [scissors, setScissors] = useState({ x: 12, y: 70 });
  const [isDragging, setIsDragging] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [message, setMessage] = useState('A little something for you…');
  const [videoError, setVideoError] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const clamp = (value, min, max) =>
    Math.min(Math.max(value, min), max);

  const positionFromPointer = useCallback((clientX, clientY) => {
    const stage = stageRef.current;
    const scissorsEl = scissorsRef.current;

    if (!stage || !scissorsEl) return;

    const rect = stage.getBoundingClientRect();
    const sw = scissorsEl.offsetWidth || 94;
    const sh = scissorsEl.offsetHeight || 94;

    const x = clamp(
      clientX - rect.left - dragRef.current.offsetX,
      0,
      rect.width - sw
    );

    const y = clamp(
      clientY - rect.top - dragRef.current.offsetY,
      0,
      rect.height - sh
    );

    setScissors({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  }, []);

  const onPointerDown = (event) => {
    if (phase !== 'gift') return;

    event.preventDefault();

    const rect = scissorsRef.current.getBoundingClientRect();

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };

    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (
      !dragRef.current.active ||
      dragRef.current.pointerId !== event.pointerId
    ) return;

    positionFromPointer(event.clientX, event.clientY);
  };

  const onPointerUp = (event) => {
    if (dragRef.current.pointerId !== event.pointerId) return;

    dragRef.current.active = false;
    setIsDragging(false);
  };

  const isScissorsOnRibbon = () => {
    if (!ribbonRef.current || !scissorsRef.current) return false;

    const ribbon = ribbonRef.current.getBoundingClientRect();
    const blade = scissorsRef.current.getBoundingClientRect();

    const x = blade.left + blade.width * 0.58;
    const y = blade.top + blade.height * 0.48;

    return (
      x >= ribbon.left - 12 &&
      x <= ribbon.right + 12 &&
      y >= ribbon.top - 20 &&
      y <= ribbon.bottom + 20
    );
  };

  const burstConfetti = useCallback(() => {
    const colors = [
      '#e7c878', '#fff0c2', '#a72d43',
      '#f8d7dd', '#ffffff',
    ];

    confetti({
      particleCount: 120,
      spread: 82,
      startVelocity: 45,
      origin: { y: 0.58 },
      colors,
    });

    window.setTimeout(() => {
      confetti({
        particleCount: 75,
        spread: 115,
        startVelocity: 32,
        origin: { x: 0.12, y: 0.65 },
        colors,
      });
    }, 180);

    window.setTimeout(() => {
      confetti({
        particleCount: 75,
        spread: 115,
        startVelocity: 32,
        origin: { x: 0.88, y: 0.65 },
        colors,
      });
    }, 300);
  }, []);

  const cutRibbon = () => {
    if (phase !== 'gift') return;

    if (!isScissorsOnRibbon()) {
      setMessage('Bring the scissors to the ribbon to open your surprise.');
      return;
    }

    setPhase('reveal');
    setMessage('For someone truly special');
    burstConfetti();

    window.setTimeout(() => {
      setPhase('video');
      setMessage('A little collection of our memories');
    }, 2200);
  };

  useEffect(() => {
    if (phase === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Some browsers require the visitor to press Play.
      });
    }
  }, [phase, currentVideoIndex]);

  // Remember the sound setting when the current video ends.
  const handleVideoEnded = () => {
    if (currentVideoIndex < VIDEO_SOURCES.length - 1) {
      setCurrentVideoIndex((index) => index + 1);
      setVideoError(false);
      setMessage(
        `Playing memory ${currentVideoIndex + 2} of ${VIDEO_SOURCES.length}`
      );
    } else {
      setMessage('You’ve watched all seven memories. Happy birthday!');
    }
  };

  // Keep the preference synchronized with the player's volume control.
  const handleVolumeChange = (event) => {
    const muted = event.currentTarget.muted;

    soundPreferenceRef.current = !muted;
    setSoundOn(!muted);
  };

  const toggleSound = () => {
    const next = !soundPreferenceRef.current;

    soundPreferenceRef.current = next;
    setSoundOn(next);

    if (videoRef.current) {
      videoRef.current.muted = !next;
    }
  };

  // Navigate between videos without changing the saved sound preference.
  const changeVideo = (direction) => {
    const nextIndex = currentVideoIndex + direction;

    if (nextIndex < 0 || nextIndex >= VIDEO_SOURCES.length) return;

    if (videoRef.current) {
      videoRef.current.pause();
    }

    setVideoError(false);
    setCurrentVideoIndex(nextIndex);
    setMessage(`Playing memory ${nextIndex + 1} of ${VIDEO_SOURCES.length}`);
  };

  const restart = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    setCurrentVideoIndex(0);
    setVideoError(false);
    setPhase('gift');
    setScissors({ x: 12, y: 70 });
    setMessage('A little something for you…');
  };

  return (
    <main className="page-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <span className="topbar-note">
          <Sparkles size={14} /> A MOMENT JUST FOR YOU
        </span>
      </header>

      <section
        className={`experience ${
          phase === 'video' ? 'experience-video' : ''
        }`}
      >
        {phase !== 'video' ? (
          <>
            <div className="eyebrow">
              <span /> THE BIG REVEAL <span />
            </div>

            <h1>
              {phase === 'gift' ? (
                <>Some things are<br /><em>worth unwrapping.</em></>
              ) : (
                <>A little magic,<br /><em>just for you.</em></>
              )}
            </h1>

            <p className="subtitle">
              {phase === 'gift'
                ? 'Take a breath, make a wish, and open your surprise.'
                : 'Because you deserve to feel celebrated.'}
            </p>

            <div
              className={`gift-stage ${phase === 'reveal' ? 'is-cut' : ''}`}
              ref={stageRef}
            >
              <div className="stage-glow" />
              <div className="sparkle sparkle-a">✦</div>
              <div className="sparkle sparkle-b">✧</div>
              <div className="sparkle sparkle-c">✦</div>
              <div className="gift-shadow" />

              <div className="gift-box">
                <div className="box-lid">
                  <div className="lid-ribbon" />
                  <div className="gift-bow">
                    <span /><span /><i />
                  </div>
                </div>

                <div className="box-body">
                  <div className="box-front-ribbon" />
                  <div className="box-shine" />
                  <div className="box-seal">
                    <Heart size={20} fill="currentColor" />
                  </div>
                </div>
              </div>

              <div
                className={`ribbon-band ${
                  phase === 'reveal' ? 'ribbon-cut' : ''
                }`}
                ref={ribbonRef}
              >
                <span className="ribbon-highlight" />
                <span className="ribbon-tail ribbon-tail-left" />
                <span className="ribbon-tail ribbon-tail-right" />
              </div>

              {phase === 'gift' && (
                <button
                  type="button"
                  ref={scissorsRef}
                  className={`scissors-handle ${
                    isDragging ? 'dragging' : ''
                  }`}
                  style={{
                    left: `${scissors.x}%`,
                    top: `${scissors.y}%`,
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onClick={cutRibbon}
                  aria-label="Drag scissors to ribbon, then click to cut"
                  title="Drag me to the ribbon"
                >
                  <span className="scissors-icon">
                    <Scissors size={48} strokeWidth={1.45} />
                  </span>
                  <span className="scissors-label">DRAG ME</span>
                </button>
              )}

              {phase === 'reveal' && (
                <div className="reveal-light">
                  <Sparkles size={42} />
                </div>
              )}
            </div>

            <div className="instruction" aria-live="polite">
              {phase === 'gift' ? (
                <><span className="instruction-dot" /> {message}</>
              ) : (
                <><Sparkles size={15} /> {message}</>
              )}
            </div>

            {phase === 'gift' && (
              <div className="hint">
                <span className="hint-line" />
                DRAG THE SCISSORS ONTO THE RIBBON
                <span className="hint-line" />
              </div>
            )}

            {phase === 'reveal' && (
              <div className="loading-track"><span /></div>
            )}
          </>
        ) : (
          <div className="video-reveal">
            <h1>
              Every memory,<br /><em>a little treasure.</em>
            </h1>

            <p className="subtitle">
              A few moments that you can keep with you forever.
            </p>

            <div className="video-frame">
              {!videoError ? (
                <video
                  key={VIDEO_SOURCES[currentVideoIndex]}
                  ref={videoRef}
                  className="birthday-video"
                  src={VIDEO_SOURCES[currentVideoIndex]}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  muted={!soundOn}
                  onVolumeChange={handleVolumeChange}
                  onEnded={handleVideoEnded}
                  onError={() => setVideoError(true)}
                  onPlay={() =>
                    setMessage(
                      `Playing memory ${currentVideoIndex + 1} of ${VIDEO_SOURCES.length}`
                    )
                  }
                >
                  Sorry, your browser does not support embedded videos.
                </video>
              ) : (
                <div className="video-placeholder">
                  <div className="placeholder-play">
                    <Play size={30} fill="currentColor" />
                  </div>

                  <h2>
                    Video {currentVideoIndex + 1} could not be loaded
                  </h2>

                  <p>
                    Check that{' '}
                    <code>
                      public/videos/video{currentVideoIndex + 1}.mp4
                    </code>{' '}
                    exists and the filename matches exactly.
                  </p>

                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (currentVideoIndex < VIDEO_SOURCES.length - 1) {
                        setCurrentVideoIndex((index) => index + 1);
                        setVideoError(false);
                      }
                    }}
                  >
                    Skip to next video
                  </button>
                </div>
              )}
            </div>

            <p className="video-caption">
              <Heart size={15} fill="currentColor" />
              MANY MORE HAPPY RETURNS OF THE DAY
            </p>

            <div className="video-actions">
              <button
                className="secondary-button"
                onClick={() => changeVideo(-1)}
                disabled={currentVideoIndex === 0}
                aria-label="Play previous video"
              >
                ◀ Previous
              </button>

              <button
                className="secondary-button"
                onClick={toggleSound}
                aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
              >
                {soundOn
                  ? <Volume2 size={16} />
                  : <VolumeX size={16} />}
                {soundOn ? 'Sound on' : 'Sound off'}
              </button>

              <button
                className="secondary-button"
                onClick={() => changeVideo(1)}
                disabled={currentVideoIndex === VIDEO_SOURCES.length - 1}
                aria-label="Play next video"
              >
                Next ▶
              </button>

              <button
                className="secondary-button"
                onClick={restart}
              >
                <RotateCcw size={16} /> Relive the surprise
              </button>
            </div>
          </div>
        )}
      </section>

      <footer className="footer">
        <span>A LITTLE MOMENT TO REMEMBER</span>
      </footer>
    </main>
  );
}