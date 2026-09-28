import { useEffect, useRef, useState } from "react";

interface FitTextOptions { maxFontSize?: number; minFontSize?: number; step?: number; }

export function useFitText(value: string, { maxFontSize = 48, minFontSize = 20, step = 1 }: FitTextOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);
  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;
    const fitText = () => {
      let size = maxFontSize;
      text.style.fontSize = `${size}px`;
      while ((text.scrollWidth > container.clientWidth || text.scrollHeight > container.clientHeight) && size > minFontSize) { size -= step; text.style.fontSize = `${size}px`; }
      setFontSize(size);
    };
    fitText();
    const observer = new ResizeObserver(fitText);
    observer.observe(container);
    return () => observer.disconnect();
  }, [value, maxFontSize, minFontSize, step]);
  return { containerRef, textRef, fontSize };
}
