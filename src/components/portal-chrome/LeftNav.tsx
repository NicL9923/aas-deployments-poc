import { useState, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Input,
  Text,
  Badge,
  Dropdown,
  Option,
  mergeClasses,
} from '@fluentui/react-components';
import {
  Search24Regular,
  Home24Regular,
  DocumentText24Regular,
  ShieldKeyhole24Regular,
  ArrowSync24Regular,
  ChevronDown16Regular,
  ChevronRight16Regular,
} from '@fluentui/react-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSlot } from '../../context/SlotContext';
import { deploymentSlots } from '../../mock-data';

const useStyles = makeStyles({
  root: {
    width: '250px',
    minWidth: '250px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    flexShrink: 0,
  },
  slotSelector: {
    padding: tokens.spacingHorizontalS,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  slotDropdown: {
    width: '100%',
  },
  slotOptionContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  slotOptionDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: tokens.borderRadiusCircular,
    flexShrink: 0,
  },
  slotOptionDotRunning: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },
  slotOptionDotStopped: {
    backgroundColor: tokens.colorPaletteRedBackground3,
  },
  searchContainer: {
    padding: tokens.spacingHorizontalS,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    cursor: 'pointer',
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    borderLeft: '3px solid transparent',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  menuItemActive: {
    borderLeftColor: tokens.colorBrandBackground,
    backgroundColor: tokens.colorBrandBackground2,
    fontWeight: tokens.fontWeightSemibold,
  },
  menuItemDisabled: {
    color: tokens.colorNeutralForeground3,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    cursor: 'pointer',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  childItem: {
    paddingLeft: tokens.spacingHorizontalXXL,
  },
  icon: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '20px',
    color: tokens.colorNeutralForeground2,
  },
});

export const LeftNav = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedSlot, setSelectedSlot } = useSlot();

  const [deploymentExpanded, setDeploymentExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [monitoringExpanded, setMonitoringExpanded] = useState(false);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname],
  );

  return (
    <nav className={styles.root}>
      <div className={styles.slotSelector}>
        <Dropdown
          className={styles.slotDropdown}
          value={selectedSlot}
          selectedOptions={[selectedSlot]}
          size="small"
          onOptionSelect={(_, data) => {
            if (data.optionValue) setSelectedSlot(data.optionValue);
          }}
        >
          {deploymentSlots.map((slot) => (
            <Option key={slot.name} value={slot.name} text={slot.name}>
              <div className={styles.slotOptionContent}>
                <span
                  className={mergeClasses(
                    styles.slotOptionDot,
                    slot.status === 'Running' ? styles.slotOptionDotRunning : styles.slotOptionDotStopped,
                  )}
                />
                <Text size={200} weight="semibold">{slot.name}</Text>
                {slot.isProduction && (
                  <Badge size="small" color="brand" appearance="tint">prod</Badge>
                )}
              </div>
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.searchContainer}>
        <Input
          contentBefore={<Search24Regular />}
          placeholder="Search"
          size="small"
          appearance="underline"
        />
      </div>

      <div
        className={mergeClasses(
          styles.menuItem,
          isActive('/overview') && styles.menuItemActive,
        )}
        onClick={() => navigate('/overview')}
      >
        <span className={styles.icon}><Home24Regular /></span>
        <Text>Overview</Text>
      </div>

      <div
        className={mergeClasses(styles.menuItem, styles.menuItemDisabled)}
      >
        <span className={styles.icon}><DocumentText24Regular /></span>
        <Text>Activity log</Text>
      </div>

      <div
        className={mergeClasses(styles.menuItem, styles.menuItemDisabled)}
      >
        <span className={styles.icon}><ShieldKeyhole24Regular /></span>
        <Text>Access control (IAM)</Text>
      </div>

      <div
        className={styles.sectionHeader}
        onClick={() => setDeploymentExpanded(!deploymentExpanded)}
      >
        {deploymentExpanded ? <ChevronDown16Regular /> : <ChevronRight16Regular />}
        <Text size={200} weight="semibold">Deployment</Text>
      </div>

      {deploymentExpanded && (
        <div
          className={mergeClasses(
            styles.menuItem,
            styles.childItem,
            isActive('/deployments') && styles.menuItemActive,
          )}
          onClick={() => navigate('/deployments')}
        >
          <span className={styles.icon}><ArrowSync24Regular /></span>
          <Text>Deployments</Text>
        </div>
      )}

      <div
        className={styles.sectionHeader}
        onClick={() => setSettingsExpanded(!settingsExpanded)}
      >
        {settingsExpanded ? <ChevronDown16Regular /> : <ChevronRight16Regular />}
        <Text size={200} weight="semibold">Settings</Text>
      </div>

      <div
        className={styles.sectionHeader}
        onClick={() => setMonitoringExpanded(!monitoringExpanded)}
      >
        {monitoringExpanded ? <ChevronDown16Regular /> : <ChevronRight16Regular />}
        <Text size={200} weight="semibold">Monitoring</Text>
      </div>
    </nav>
  );
};
