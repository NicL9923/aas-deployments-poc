import { makeStyles, tokens } from '@fluentui/react-components';
import { TopBar } from './TopBar';
import { LeftNav } from './LeftNav';
import { ResourceHeader } from './ResourceHeader';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    width: '250px',
    minWidth: '250px',
    flexShrink: 0,
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
  },
});

interface PortalShellProps {
  children: React.ReactNode;
}

export const PortalShell = ({ children }: PortalShellProps) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <TopBar />
      <div className={styles.body}>
        <div className={styles.leftColumn}>
          <ResourceHeader />
          <LeftNav />
        </div>
        <div className={styles.content}>
          <div className={styles.scrollArea}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
