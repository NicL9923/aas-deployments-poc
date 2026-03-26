import { useEffect, useRef, useState } from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';

export interface StreamingLogViewerProps {
  logs: string[];
  isStreaming: boolean;
}

const useStyles = makeStyles({
  root: {
    position: 'relative',
    marginTop: tokens.spacingVerticalM,
  },
  container: {
    backgroundColor: tokens.colorNeutralBackgroundInverted,
    color: tokens.colorNeutralForegroundInverted,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    borderRadius: tokens.borderRadiusMedium,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    height: '300px',
    overflowY: 'auto',
    overflowX: 'auto',
    whiteSpace: 'pre',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalXS,
  },
  lineCount: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  cursor: {
    display: 'inline-block',
    width: '8px',
    height: '14px',
    backgroundColor: tokens.colorNeutralForegroundInverted,
    marginLeft: '2px',
    verticalAlign: 'text-bottom',
    animationName: {
      '0%, 49%': { opacity: 1 },
      '50%, 100%': { opacity: 0 },
    },
    animationDuration: '1s',
    animationIterationCount: 'infinite',
  },
});

export function StreamingLogViewer({ logs, isStreaming }: StreamingLogViewerProps) {
  const styles = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(() => (isStreaming ? 0 : logs.length));

  useEffect(() => {
    if (!isStreaming) {
      setVisibleCount(logs.length);
    } else {
      setVisibleCount(0);
    }
  }, [isStreaming, logs]);

  useEffect(() => {
    if (!isStreaming) return;

    const id = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= logs.length) {
          clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(id);
  }, [isStreaming, logs]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleCount]);

  const displayedLines = isStreaming ? logs.slice(0, visibleCount) : logs;
  const totalLines = displayedLines.length;

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <span className={styles.lineCount}>{totalLines} lines</span>
      </div>
      <div ref={containerRef} className={styles.container}>
        {displayedLines.join('\n')}
        {isStreaming && visibleCount < logs.length && <span className={styles.cursor} />}
      </div>
    </div>
  );
}
