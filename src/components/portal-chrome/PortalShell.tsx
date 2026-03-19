import { useMemo } from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import {
  Globe24Regular,
  ArrowSwap24Regular,
  ArrowCounterclockwise24Regular,
  ArrowClockwise24Regular,
} from '@fluentui/react-icons';
import { TopBar } from './TopBar';
import { LeftNav } from './LeftNav';
import { ResourceHeader } from './ResourceHeader';
import { Toolbar } from './Toolbar';

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

const defaultToolbarItems = [
  { key: 'browse', label: 'Browse', icon: <Globe24Regular /> },
  { key: 'swap', label: 'Swap', icon: <ArrowSwap24Regular /> },
  { key: 'restart', label: 'Restart', icon: <ArrowCounterclockwise24Regular /> },
  { key: 'refresh', label: 'Refresh', icon: <ArrowClockwise24Regular /> },
];

export const PortalShell = ({ children }: PortalShellProps) => {
  const styles = useStyles();

  const toolbarItems = useMemo(() => defaultToolbarItems, []);

  return (
    <div className={styles.root}>
      <TopBar />
      <div className={styles.body}>
        <LeftNav />
        <div className={styles.content}>
          <ResourceHeader />
          <Toolbar items={toolbarItems} />
          <div className={styles.scrollArea}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
