import {
  makeStyles,
  tokens,
  Button,
  Divider,
  type Slot,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
  },
  itemWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  divider: {
    height: '20px',
  },
});

interface ToolbarItem {
  key: string;
  label: string;
  icon: NonNullable<Slot<'span'>>;
  onClick?: () => void;
  disabled?: boolean;
}

interface ToolbarProps {
  items: ToolbarItem[];
}

export const Toolbar = ({ items }: ToolbarProps) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      {items.map((item, index) => (
        <span key={item.key} className={styles.itemWrapper}>
          <Button
            appearance="subtle"
            size="small"
            icon={item.icon}
            onClick={item.onClick}
            disabled={item.disabled}
          >
            {item.label}
          </Button>
          {index < items.length - 1 && (
            <Divider vertical className={styles.divider} />
          )}
        </span>
      ))}
    </div>
  );
};
