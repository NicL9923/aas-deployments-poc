import { useState } from 'react';
import { makeStyles, tokens, Link, Text } from '@fluentui/react-components';
import type { DeploymentLogEntry } from '../../types';
import { StreamingLogViewer } from './StreamingLogViewer';

interface DeploymentLogTableProps {
  logs: DeploymentLogEntry[];
  deploymentId?: string;
}

const useStyles = makeStyles({
  container: {
    maxHeight: '400px',
    overflowY: 'auto',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200,
    fontFamily: tokens.fontFamilyBase,
  },
  thead: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  th: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    textAlign: 'left',
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  td: {
    paddingTop: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    verticalAlign: 'top',
  },
  timeCell: {
    whiteSpace: 'nowrap',
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase100,
    width: '170px',
  },
  activityCell: {
    color: tokens.colorNeutralForeground1,
    wordBreak: 'break-word',
  },
  logCell: {
    width: '90px',
    textAlign: 'center' as const,
  },
  detailRow: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  detailCell: {
    paddingTop: 0,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
  },
});

export function DeploymentLogTable({ logs, deploymentId }: DeploymentLogTableProps) {
  const styles = useStyles();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={styles.th}>Time</th>
            <th className={styles.th}>Activity</th>
            <th className={styles.th}>Log</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((entry, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <tr key={`${deploymentId ?? ''}-${idx}`}>
                <td colSpan={3} style={{ padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td className={`${styles.td} ${styles.timeCell}`}>
                          <Text size={100} font="monospace">
                            {entry.timestamp}
                          </Text>
                        </td>
                        <td className={`${styles.td} ${styles.activityCell}`}>
                          <Text size={200}>{entry.activity}</Text>
                        </td>
                        <td className={`${styles.td} ${styles.logCell}`}>
                          {entry.detailLogs && (
                            <Link
                              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                            >
                              {isExpanded ? 'Hide logs' : 'Show logs'}
                            </Link>
                          )}
                        </td>
                      </tr>
                      {isExpanded && entry.detailLogs && (
                        <tr className={styles.detailRow}>
                          <td colSpan={3} className={styles.detailCell}>
                            <StreamingLogViewer
                              logs={entry.detailLogs}
                              isStreaming={false}
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
