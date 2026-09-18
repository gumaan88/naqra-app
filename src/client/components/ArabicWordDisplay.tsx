import React, { useEffect, useRef, useMemo } from 'react';

interface ArabicWordDisplayProps {
  word: string;
  expectedIndex: number;
  sizeVariant?: 'preview' | 'challenge';
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

export const ArabicWordDisplay: React.FC<ArabicWordDisplayProps> = ({
  word,
  expectedIndex,
  sizeVariant = 'challenge'
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const graphemes = useMemo(() => getArabicGraphemes(word), [word]);

  // Dynamic font sizing based on word length to strictly prevent wrapping or horizontal scroll
  const dynamicFontSize = useMemo(() => {
    const len = graphemes.length;
    const isPreview = sizeVariant === 'preview';

    if (len <= 3) {
      return isPreview ? 'clamp(3.4rem, 13vw, 6.2rem)' : 'clamp(2.5rem, 10vw, 4.8rem)';
    } else if (len <= 5) {
      return isPreview ? 'clamp(2.7rem, 10vw, 5rem)' : 'clamp(2.1rem, 8vw, 3.8rem)';
    } else {
      return isPreview ? 'clamp(2.1rem, 7.5vw, 4rem)' : 'clamp(1.7rem, 6.2vw, 3rem)';
    }
  }, [graphemes.length, sizeVariant]);

  // CSS Custom Highlight API registration
  useEffect(() => {
    const container = textRef.current;
    if (!container) return;

    // In preview mode, do not highlight single letters
    if (sizeVariant === 'preview') {
      if (typeof (window as any).CSS !== 'undefined' && 'highlights' in (window as any).CSS) {
        (window as any).CSS.highlights.delete('completed-letters');
        (window as any).CSS.highlights.delete('current-letter');
      }
      return;
    }

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
  }, [word, expectedIndex, graphemes, sizeVariant]);

  return (
    <div className="relative select-none flex items-center justify-center max-w-full">
      {/* 
        Single unbroken Text Node:
        Crucial educational rule: preserves Arabic contextual shaping completely.
        Letters connect naturally without artificial spaces or disconnected boxes.
      */}
      <div
        ref={textRef}
        dir="rtl"
        className="font-black text-brand-text tracking-normal text-center whitespace-nowrap"
        style={{
          fontSize: dynamicFontSize,
          fontFamily: "'Noto Sans Arabic', 'Tajawal', sans-serif",
          letterSpacing: 0,
          lineHeight: 1.25,
          fontFeatureSettings: '"kern" 1, "liga" 1',
        }}
      >
        {word}
      </div>
    </div>
  );
};
