import { useState, useEffect, useRef } from 'react';

const TypingText = ({ texts = [], speed = 80, deleteSpeed = 40, pauseDuration = 2000, className = '' }) => {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (texts.length === 0) return;

    const currentText = texts[textIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setDisplayText(currentText.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      } else {
        if (charIndex > 0) {
          setDisplayText(currentText.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % texts.length);
        }
      }
    }, isDeleting ? deleteSpeed : speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts, speed, deleteSpeed, pauseDuration]);

  return (
    <span className={`font-mono ${className}`}>
      {displayText}
      <span className="inline-block w-[2px] h-[1em] bg-city-neon ml-1 animate-pulse align-middle" />
    </span>
  );
};

export default TypingText;
