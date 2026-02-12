import React, { useEffect, useRef, useMemo } from 'react';
import * as Reveal from 'reveal.js';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';
import { useArtifact } from '../hooks/useArtifact';
import { usePlayback } from '../hooks/usePlayback';

interface PresentationFrameProps {
  filePath: string;
}

const parseSlides = (markdown: string): string[] => {
  // Simple parser: split by --- or ## headers
  const lines = markdown.split('\n');
  const slides: string[] = [];
  let currentSlide = '';

  for (const line of lines) {
    if (line.trim() === '---' || line.startsWith('## ')) {
      if (currentSlide.trim()) {
        slides.push(currentSlide.trim());
      }
      currentSlide = line.startsWith('## ') ? `<h2>${line.slice(3)}</h2>` : '';
    } else {
      currentSlide += line + '\n';
    }
  }

  if (currentSlide.trim()) {
    slides.push(currentSlide.trim());
  }

  return slides.length > 0 ? slides : ['<h1>No slides found</h1>'];
};

const PresentationFrame: React.FC<PresentationFrameProps> = ({ filePath }) => {
  const deckRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<Reveal.Api | null>(null);

  const { data: markdown, loading, error } = useArtifact<string>(filePath, {
    parse: content => content,
    serialize: content => content,
  });

  const slides = useMemo(() => markdown ? parseSlides(markdown) : [], [markdown]);
  const playback = usePlayback(slides.length);

  useEffect(() => {
    if (deckRef.current && !revealRef.current) {
      revealRef.current = new Reveal(deckRef.current, {
        embedded: true,
        keyboardCondition: 'focused',
      });
      revealRef.current.initialize();
    }

    return () => {
      if (revealRef.current) {
        revealRef.current.destroy();
        revealRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (revealRef.current && playback.currentSlide !== revealRef.current.getCurrentSlide().h) {
      revealRef.current.slide(playback.currentSlide);
    }
  }, [playback.currentSlide]);

  if (loading) {
    return <div>Loading presentation...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="presentation-container">
      <div className="reveal" ref={deckRef}>
        <div className="slides">
          {slides.map((slideContent, index) => (
            <section key={index} dangerouslySetInnerHTML={{ __html: slideContent }} />
          ))}
        </div>
      </div>
      <div className="controls">
        <button type="button" onClick={playback.previous}>Previous</button>
        <button type="button" onClick={playback.next}>Next</button>
        <button type="button" onClick={() => playback.startPlayback(3000)}>Start Playback</button>
        <button type="button" onClick={playback.stopPlayback}>Stop Playback</button>
      </div>
    </div>
  );
};

export default PresentationFrame;