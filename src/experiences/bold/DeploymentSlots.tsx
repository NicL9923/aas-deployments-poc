import { useState, useMemo, useCallback, Fragment } from 'react';
import {
  makeStyles,
  tokens,
  mergeClasses,
  Card,
  Badge,
  Button,
  Text,
  Title2,
  Title3,
  Body1,
  Caption1,
  Subtitle2,
  Divider,
  ProgressBar,
  SpinButton,
} from '@fluentui/react-components';
import {
  ArrowSwap24Regular,
  Add24Regular,
  Open24Regular,
  Settings24Regular,
} from '@fluentui/react-icons';
import { deploymentSlots } from '../../mock-data';
import type { DeploymentSlot } from '../../types';
import { StatusBadge } from '../../components/shared/StatusBadge';

import { SwapDialog } from '../../components/shared/SwapDialog';

const formatRelativeTime = (timestamp: string): string => {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const seconds = Math.floor((now - then) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

const useStyles = makeStyles({
  // Layout
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXL,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },

  // Slot lanes
  slotsSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  slotCard: {
    paddingTop: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalXXL,
    paddingLeft: tokens.spacingHorizontalXXL,
    paddingRight: tokens.spacingHorizontalXXL,
    boxShadow: tokens.shadow16,
    borderRadius: tokens.borderRadiusXLarge,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  productionCard: {
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorBrandBackground,
  },
  slotCardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  slotCardTopLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  slotNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  statusDot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusCircular,
    flexShrink: 0,
  },
  statusDotRunning: {
    backgroundColor: tokens.colorPaletteGreenForeground1,
  },
  statusDotStopped: {
    backgroundColor: tokens.colorPaletteRedForeground3,
  },

  // Deployment info
  deploymentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  deploymentMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  commitChip: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground3,
    paddingLeft: tokens.spacingHorizontalSNudge,
    paddingRight: tokens.spacingHorizontalSNudge,
    paddingTop: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXXS,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground2,
  },

  // Traffic hero display
  trafficDisplay: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  trafficRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: tokens.spacingHorizontalS,
  },
  trafficNumber: {
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightBold,
    lineHeight: tokens.lineHeightHero900,
    color: tokens.colorBrandForeground1,
  },
  trafficLabel: {
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },

  // Slot footer
  slotFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground3,
  },

  // Swap connector
  swapContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalXXL,
    paddingRight: tokens.spacingHorizontalXXL,
  },
  swapLine: {
    flexGrow: 1,
    height: '2px',
    backgroundColor: tokens.colorNeutralStroke2,
    borderRadius: tokens.borderRadiusCircular,
  },

  // Traffic routing section
  trafficCard: {
    paddingTop: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalXXL,
    paddingLeft: tokens.spacingHorizontalXXL,
    paddingRight: tokens.spacingHorizontalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    boxShadow: tokens.shadow8,
    borderRadius: tokens.borderRadiusXLarge,
  },
  trafficCardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  trafficControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  trafficSlotRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
  },
  trafficSlotInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: '160px',
  },
  trafficSpinButton: {
    width: '100px',
  },
  trafficProgressBar: {
    flexGrow: 1,
    minWidth: '100px',
  },
});

export const BoldDeploymentSlots = () => {
  const styles = useStyles();
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [traffic, setTraffic] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const slot of deploymentSlots) {
      initial[slot.name] = slot.trafficPercentage;
    }
    return initial;
  });

  const slots = useMemo(
    () =>
      [...deploymentSlots].sort(
        (a, b) => (b.isProduction ? 1 : 0) - (a.isProduction ? 1 : 0),
      ),
    [],
  );

  const handleTrafficChange = useCallback(
    (slotName: string, value: number) => {
      setTraffic((prev) => {
        const clamped = Math.max(0, Math.min(100, Math.round(value)));
        const otherSlot = deploymentSlots.find((s) => s.name !== slotName);
        if (!otherSlot) return prev;
        return {
          ...prev,
          [slotName]: clamped,
          [otherSlot.name]: 100 - clamped,
        };
      });
    },
    [],
  );

  const renderSlotCard = (slot: DeploymentSlot) => (
    <Card
      className={mergeClasses(
        styles.slotCard,
        slot.isProduction && styles.productionCard,
      )}
    >
      {/* Header */}
      <div className={styles.slotCardTop}>
        <div className={styles.slotCardTopLeft}>
          <div className={styles.slotNameRow}>
            <Title3>{slot.name}</Title3>
            {slot.isProduction && (
              <Badge color="brand" appearance="filled">
                Production
              </Badge>
            )}
          </div>
          <div className={styles.statusRow}>
            <span
              className={mergeClasses(
                styles.statusDot,
                slot.status === 'Running'
                  ? styles.statusDotRunning
                  : styles.statusDotStopped,
              )}
            />
            <Caption1>{slot.status}</Caption1>
          </div>
        </div>
        <Button
          appearance="subtle"
          icon={<Open24Regular />}
          onClick={() => window.open(slot.url, '_blank', 'noopener,noreferrer')}
        >
          Browse
        </Button>
      </div>

      <Divider />

      {/* Last deployment */}
      {slot.lastDeployment && (
        <div className={styles.deploymentInfo}>
          <Body1>{slot.lastDeployment.message}</Body1>
          <div className={styles.deploymentMeta}>
            {slot.lastDeployment.commitId && (
              <Text className={styles.commitChip}>
                {slot.lastDeployment.commitId}
              </Text>
            )}
            <Caption1>
              {formatRelativeTime(slot.lastDeployment.timestamp)}
            </Caption1>
            <StatusBadge status={slot.lastDeployment.status} />
          </div>
        </div>
      )}

      {/* Traffic hero */}
      <div className={styles.trafficDisplay}>
        <div className={styles.trafficRow}>
          <Text className={styles.trafficNumber}>{traffic[slot.name]}%</Text>
          <Text className={styles.trafficLabel}>traffic</Text>
        </div>
        <ProgressBar
          value={traffic[slot.name] / 100}
          thickness="large"
          shape="rounded"
        />
      </div>

      {/* Footer */}
      <div className={styles.slotFooter}>
        <Settings24Regular aria-hidden />
        <Caption1>{slot.appSettings.length} app settings</Caption1>
      </div>
    </Card>
  );

  return (
    <div className={styles.root}>
      {/* Page header */}
      <div className={styles.header}>
        <Title2>Deployment slots</Title2>
        <Caption1 className={styles.subtitle}>
          Manage deployment slots, swap content, and route traffic between
          environments
        </Caption1>
      </div>

      {/* Slot lanes with swap connector */}
      <div className={styles.slotsSection}>
        {slots.map((slot, index) => (
          <Fragment key={slot.name}>
            {renderSlotCard(slot)}
            {index === 0 && slots.length > 1 && (
              <div className={styles.swapContainer}>
                <div className={styles.swapLine} />
                <Button
                  appearance="primary"
                  size="large"
                  icon={<ArrowSwap24Regular />}
                  onClick={() => setSwapDialogOpen(true)}
                >
                  Swap slots
                </Button>
                <div className={styles.swapLine} />
              </div>
            )}
          </Fragment>
        ))}
      </div>

      {/* Swap comparison dialog */}
      <SwapDialog
        open={swapDialogOpen}
        onOpenChange={setSwapDialogOpen}
        slots={deploymentSlots}
      />

      {/* Traffic routing */}
      <Card className={styles.trafficCard}>
        <div className={styles.trafficCardHeader}>
          <Title3>Traffic routing</Title3>
          <Caption1 className={styles.subtitle}>
            Distribute incoming traffic between deployment slots
          </Caption1>
        </div>
        <Divider />
        <div className={styles.trafficControls}>
          {slots.map((slot) => (
            <div key={slot.name} className={styles.trafficSlotRow}>
              <div className={styles.trafficSlotInfo}>
                <Subtitle2>{slot.name}</Subtitle2>
                {slot.isProduction && (
                  <Badge size="small" color="brand" appearance="tint">
                    Production
                  </Badge>
                )}
              </div>
              <SpinButton
                className={styles.trafficSpinButton}
                value={traffic[slot.name]}
                min={0}
                max={100}
                step={5}
                onChange={(_ev, data) => {
                  if (data.value != null) {
                    handleTrafficChange(slot.name, data.value);
                  }
                }}
              />
              <ProgressBar
                className={styles.trafficProgressBar}
                value={traffic[slot.name] / 100}
                thickness="large"
                shape="rounded"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Add slot */}
      <Button appearance="outline" size="large" icon={<Add24Regular />}>
        Add slot
      </Button>
    </div>
  );
};
