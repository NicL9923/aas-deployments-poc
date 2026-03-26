import {
  makeStyles,
  tokens,
  Text,
  Input,
} from '@fluentui/react-components';
import {
  GridDots24Regular,
  Navigation24Regular,
  Search24Regular,
  PersonCircle24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    height: '40px',
    backgroundColor: '#0078d4',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  icon: {
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  portalTitle: {
    color: 'white',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    whiteSpace: 'nowrap',
  },
  searchSection: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  searchInput: {
    width: '100%',
    opacity: 0.9,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginLeft: 'auto',
  },
});

export const TopBar = () => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.leftSection}>
        <span className={styles.icon}>
          <GridDots24Regular />
        </span>
        <span className={styles.icon}>
          <Navigation24Regular />
        </span>
        <Text className={styles.portalTitle}>Microsoft Azure</Text>
      </div>

      <div className={styles.searchSection}>
        <Input
          className={styles.searchInput}
          contentBefore={<Search24Regular />}
          placeholder="Search resources, services, and docs (G+/)"
          size="small"
          appearance="filled-lighter"
        />
      </div>

      <div className={styles.rightSection}>
        <span className={styles.icon}>
          <PersonCircle24Regular />
        </span>
      </div>
    </div>
  );
};
