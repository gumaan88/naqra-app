import React, { useEffect, useRef, useMemo } from 'react';

interface ArabicWordDisplayProps {
  word: string;
  expectedIndex: number;
}

// Unicode Arabic grapheme segmentation
export interface GraphemeSegment {
  grapheme: string;
  index: number; // character start offset in string
  length: number; // character length in code units
}

export function getArabicGraphemes(text: string): GraphemeSegment[] {
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    const segmenter = new (Intl as any).Segmenter('ar', { granularity: 'grapheme' });
    const segments = Array.from(segmenter.segment(text)) as any[];
    return segments.map(s => ({
      grapheme: s.segment,
      index: s.index,
      length: s.segment.length,
    }));
  }
  // Fallback splitting by character
  const chars = Array.from(text);
  let offset = 0;
  return chars.map(char => {
    const item = { grapheme: char, index: offset, length: char.length };
    offset += char.length;
    return item;
  });
}

export const ArabicWordDisplay: React.FC<ArabicWordDisplayProps> = ({ word, expectedIndex }) => {
  const textRef = useRef<HTMLDivElement>(null);

  const graphemes = useMemo(() => getArabicGraphemes(word), [word]);

  // CSS Custom Highlight API registration
  useEffect(() => {
    const container = textRef.current;
    if (!container) return;

    // Check if browser supports CSS Custom Highlight API
    const isHighlightSupported = typeof (window as any).CSS !== 'undefined' &&
      'highlights' in (window as any).CSS &&
      typeof (window as any).Highlight !== 'undefined';

    if (!isHighlightSupported) return;

    // Ensure we have the text node
    const textNode = container.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;

    try {
      const CSSHighlights = (window as any).CSS.highlights;

      // 1. Completed Letters Range
      if (expectedIndex > 0 && expectedIndex <= graphemes.length) {
        const lastCompleted = graphemes[expectedIndex - 1];
        const endOffset = lastCompleted.index + lastCompleted.length;
        const completedRange = new Range();
        completedRange.setStart(textNode, 0);
        completedRange.setEnd(textNode, endOffset);
        CSSHighlights.set('completed-letters', new (window as any).Highlight(completedRange));
      } else {
        CSSHighlights.delete('completed-letters');
      }

      // 2. Current Expected Letter Range
      if (expectedIndex >= 0 && expectedIndex < graphemes.length) {
        const currentSeg = graphemes[expectedIndex];
        const currentRange = new Range();
        currentRange.setStart(textNode, currentSeg.index);
        currentRange.setEnd(textNode, currentSeg.index + currentSeg.length);
        CSSHighlights.set('current-letter', new (window as any).Highlight(currentRange));
      } else {
        CSSHighlights.delete('current-letter');
      }
    } catch (err) {
      console.warn('[ArabicWordDisplay] Custom highlight registration error:', err);
    }

    return () => {
      if (typeof (window as any).CSS !== 'undefined' && 'highlights' in (window as any).CSS) {
        (window as any).CSS.highlights.delete('completed-letters');
        (window as any).CSS.highlights.delete('current-letter');
      }
    };
  }, [word, expectedIndex, graphemes]);

  return (
    <div className="relative inline-block select-none my-2">
      {/* 
        Single unbroken Text Node:
        Crucial educational rule: preserves Arabic contextual shaping completely.
        Letters connect naturally without artificial spaces or disconnected boxes.
      */}
      <div
        ref={textRef}
        dir="rtl"
        className="text-6xl sm:text-7xl md:text-8xl font-black text-brand-text tracking-normal leading-relaxed text-center"
        style={{
          fontFamily: "'Noto Sans Arabic', 'Tajawal', sans-serif",
          letterSpacing: 0,
          fontFeatureSettings: '"kern" 1, "liga" 1',
        }}
      >
        {word}
      </div>

      {/* Subtle indicator of current letter without breaking word text */}
      {expectedIndex < graphemes.length && (
        <div className="text-center text-xs font-bold text-brand-turquoise mt-1">
          الحرف المطلوب: <span className="text-base font-black px-1.5 py-0.5 rounded-lg bg-teal-50 border border-teal-200">{graphemes[expectedIndex].grapheme}</span>
        </div>
      )}
    </div>
  );
};
