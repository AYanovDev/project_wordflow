import { useEffect, useRef, useState } from "react";

export function useFitText(
  value,
  { maxFontSize = 48, minFontSize = 20, step = 1 } = {},
) {
  const containerRef = useRef(null); // the fixed-size box
  const textRef = useRef(null); // the element whose font-size we set
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;

    if (!container || !text) return;

    const fitText = () => {
      let size = maxFontSize;
      text.style.fontSize = `${size}px`;

      while (
        (text.scrollWidth > container.clientWidth ||
          text.scrollHeight > container.clientHeight) &&
        size > minFontSize
      ) {
        size -= step;
        text.style.fontSize = `${size}px`;
      }

      setFontSize(size);
    };

    fitText();

    // watch the container, not the text — resizing text is our own doing
    const observer = new ResizeObserver(fitText);
    observer.observe(container);

    return () => observer.disconnect();
  }, [value, maxFontSize, minFontSize, step]);

  return { containerRef, textRef, fontSize };
}
