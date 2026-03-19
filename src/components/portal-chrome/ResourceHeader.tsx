import {
  makeStyles,
  tokens,
  Text,
} from '@fluentui/react-components';
import {
  Globe24Regular,
  Pin24Regular,
  Star24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { webApp } from '../../mock-data';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  icon: {
    color: tokens.colorBrandForeground1,
    fontSize: '24px',
    display: 'flex',
  },
  nameBlock: {
    display: 'flex',
    flexDirection: 'column',
  },
  name: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
  },
  actionIcon: {
    display: 'flex',
    alignItems: 'center',
    ':hover': {
      color: tokens.colorNeutralForeground1,
    },
  },
});

export const ResourceHeader = () => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <span className={styles.icon}>
          <Globe24Regular />
        </span>
        <div className={styles.nameBlock}>
          <Text className={styles.name}>{webApp.name}</Text>
          <Text className={styles.subtitle}>Web App</Text>
        </div>
      </div>
      <div className={styles.right}>
        <span className={styles.actionIcon}><Pin24Regular /></span>
        <span className={styles.actionIcon}><Star24Regular /></span>
        <span className={styles.actionIcon}><Dismiss24Regular /></span>
      </div>
    </div>
  );
};
