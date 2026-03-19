import { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Dropdown,
  Label,
  makeStyles,
  mergeClasses,
  MessageBar,
  MessageBarBody,
  Option,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  tokens,
  Toolbar,
  ToolbarButton,
  Tooltip,
} from '@fluentui/react-components';
import {
  AddCircleRegular,
  ArrowSwapRegular,
  ArrowSyncRegular,
  DeleteRegular,
  GlobeRegular,
} from '@fluentui/react-icons';
import { deploymentSlots } from '../../mock-data';
import { StatusBadge } from '../../components/shared/StatusBadge';
import type { DeploymentSlot } from '../../types';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  toolbar: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
    paddingBottom: tokens.spacingVerticalS,
  },
  table: {
    width: '100%',
  },
  row: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  productionRow: {
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorBrandBackground,
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusDotRunning: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },
  statusDotStopped: {
    backgroundColor: tokens.colorPaletteRedBackground3,
  },
  trafficContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  trafficBarOuter: {
    width: '60px',
    height: '6px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground5,
    overflow: 'hidden',
  },
  trafficBarInner: {
    height: '100%',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorBrandBackground,
    transitionProperty: 'width',
    transitionDuration: tokens.durationNormal,
  },
  commitHash: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  deploymentCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  actionsCell: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  // Swap dialog
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  dropdownRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  dropdownField: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    flex: 1,
  },
  swapIconCenter: {
    marginTop: tokens.spacingVerticalL,
  },
  comparisonSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  comparisonTable: {
    width: '100%',
  },
  diffRow: {
    backgroundColor: tokens.colorPaletteYellowBackground1,
  },
  slotSettingIcon: {
    marginLeft: tokens.spacingHorizontalXXS,
    fontSize: tokens.fontSizeBase200,
  },
  settingValue: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
  },
  muted: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatRelativeTime = (timestamp: string): string => {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return 'just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'traffic', label: 'Traffic %' },
  { key: 'lastDeployment', label: 'Last deployment' },
  { key: 'runtime', label: 'Runtime' },
  { key: 'actions', label: 'Actions' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SettingsComparisonProps {
  source: DeploymentSlot;
  target: DeploymentSlot;
}

const SettingsComparison = ({ source, target }: SettingsComparisonProps) => {
  const styles = useStyles();

  const allSettingNames = useMemo(() => {
    const names = new Set<string>();
    source.appSettings.forEach((s) => names.add(s.name));
    target.appSettings.forEach((s) => names.add(s.name));
    return Array.from(names);
  }, [source, target]);

  const getSettingValue = (slot: DeploymentSlot, name: string) =>
    slot.appSettings.find((s) => s.name === name)?.value ?? '—';

  const isSlotSetting = (name: string) =>
    source.appSettings.find((s) => s.name === name)?.isSlotSetting ||
    target.appSettings.find((s) => s.name === name)?.isSlotSetting;

  return (
    <div className={styles.comparisonSection}>
      <Text weight="semibold" size={300}>
        Configuration comparison
      </Text>
      <Table className={styles.comparisonTable} size="extra-small">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Setting</TableHeaderCell>
            <TableHeaderCell>Source ({source.name})</TableHeaderCell>
            <TableHeaderCell>Target ({target.name})</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allSettingNames.map((name) => {
            const srcVal = getSettingValue(source, name);
            const tgtVal = getSettingValue(target, name);
            const isDiff = srcVal !== tgtVal;
            const sticky = isSlotSetting(name);

            return (
              <TableRow key={name} className={isDiff ? styles.diffRow : undefined}>
                <TableCell>
                  <Text size={200}>
                    {name}
                    {sticky && (
                      <Tooltip content="Slot setting — will NOT be swapped" relationship="description">
                        <span className={styles.slotSettingIcon}>🔒</span>
                      </Tooltip>
                    )}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text className={styles.settingValue}>{srcVal}</Text>
                </TableCell>
                <TableCell>
                  <Text className={styles.settingValue}>{tgtVal}</Text>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const SafeDeploymentSlots = () => {
  const styles = useStyles();
  const slots = deploymentSlots;

  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [selectedSourceSlot, setSelectedSourceSlot] = useState('staging');
  const [selectedTargetSlot, setSelectedTargetSlot] = useState('production');

  const sourceSlot = useMemo(
    () => slots.find((s) => s.name === selectedSourceSlot),
    [slots, selectedSourceSlot],
  );
  const targetSlot = useMemo(
    () => slots.find((s) => s.name === selectedTargetSlot),
    [slots, selectedTargetSlot],
  );

  const openSwapDialog = useCallback(() => {
    setSelectedSourceSlot('staging');
    setSelectedTargetSlot('production');
    setShowSwapDialog(true);
  }, []);

  return (
    <div className={styles.root}>
      {/* ---- Toolbar ---- */}
      <Toolbar className={styles.toolbar}>
        <ToolbarButton appearance="primary" icon={<AddCircleRegular />}>
          Add slot
        </ToolbarButton>
        <ToolbarButton appearance="subtle" icon={<ArrowSwapRegular />} onClick={openSwapDialog}>
          Swap
        </ToolbarButton>
        <ToolbarButton appearance="subtle" icon={<ArrowSyncRegular />}>
          Refresh
        </ToolbarButton>
      </Toolbar>

      {/* ---- Slots table ---- */}
      <Table className={styles.table} aria-label="Deployment slots">
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHeaderCell key={col.key}>{col.label}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {slots.map((slot) => (
            <TableRow
              key={slot.name}
              className={mergeClasses(styles.row, slot.isProduction && styles.productionRow)}
            >
              {/* Name */}
              <TableCell>
                <TableCellLayout>
                  <div className={styles.nameCell}>
                    <Text weight="semibold">{slot.name}</Text>
                    {slot.isProduction && (
                      <Badge appearance="tint" color="brand" size="small">
                        production
                      </Badge>
                    )}
                  </div>
                </TableCellLayout>
              </TableCell>

              {/* Status */}
              <TableCell>
                <div className={styles.statusCell}>
                  <span
                    className={mergeClasses(
                      styles.statusDot,
                      slot.status === 'Running' ? styles.statusDotRunning : styles.statusDotStopped,
                    )}
                  />
                  <Text size={300}>{slot.status}</Text>
                </div>
              </TableCell>

              {/* Traffic % */}
              <TableCell>
                <div className={styles.trafficContainer}>
                  <div className={styles.trafficBarOuter}>
                    <div
                      className={styles.trafficBarInner}
                      style={{ width: `${slot.trafficPercentage}%` }}
                    />
                  </div>
                  <Text size={200}>{slot.trafficPercentage}%</Text>
                </div>
              </TableCell>

              {/* Last deployment */}
              <TableCell>
                {slot.lastDeployment ? (
                  <div className={styles.deploymentCell}>
                    <StatusBadge status={slot.lastDeployment.status} />
                    <Text className={styles.muted}>
                      {formatRelativeTime(slot.lastDeployment.timestamp)}
                      {slot.lastDeployment.commitId && (
                        <>
                          {' · '}
                          <span className={styles.commitHash}>
                            {slot.lastDeployment.commitId.slice(0, 7)}
                          </span>
                        </>
                      )}
                    </Text>
                  </div>
                ) : (
                  <Text className={styles.muted}>—</Text>
                )}
              </TableCell>

              {/* Runtime */}
              <TableCell>
                <Text size={300}>{slot.runtimeStack}</Text>
              </TableCell>

              {/* Actions */}
              <TableCell>
                <div className={styles.actionsCell}>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ArrowSwapRegular />}
                    onClick={openSwapDialog}
                  >
                    Swap
                  </Button>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<GlobeRegular />}
                    as="a"
                    href={slot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Browse
                  </Button>
                  <Tooltip
                    content="Cannot delete the production slot"
                    relationship="description"
                    visible={slot.isProduction ? undefined : false}
                  >
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<DeleteRegular />}
                      disabled={slot.isProduction}
                    >
                      Delete
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ---- Swap dialog ---- */}
      <Dialog open={showSwapDialog} onOpenChange={(_, data) => setShowSwapDialog(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Swap deployment slots</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              <Text>
                Swapping will exchange the content and configurations between the source and target
                slots.
              </Text>

              {/* Source / Target dropdowns */}
              <div className={styles.dropdownRow}>
                <div className={styles.dropdownField}>
                  <Label htmlFor="swap-source">Source</Label>
                  <Dropdown
                    id="swap-source"
                    value={selectedSourceSlot}
                    selectedOptions={[selectedSourceSlot]}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) setSelectedSourceSlot(data.optionValue);
                    }}
                  >
                    {slots.map((s) => (
                      <Option key={s.name} value={s.name}>
                        {s.name}
                      </Option>
                    ))}
                  </Dropdown>
                </div>

                <ArrowSwapRegular className={styles.swapIconCenter} />

                <div className={styles.dropdownField}>
                  <Label htmlFor="swap-target">Target</Label>
                  <Dropdown
                    id="swap-target"
                    value={selectedTargetSlot}
                    selectedOptions={[selectedTargetSlot]}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) setSelectedTargetSlot(data.optionValue);
                    }}
                  >
                    {slots.map((s) => (
                      <Option key={s.name} value={s.name}>
                        {s.name}
                      </Option>
                    ))}
                  </Dropdown>
                </div>
              </div>

              {/* Settings comparison */}
              {sourceSlot && targetSlot && (
                <SettingsComparison source={sourceSlot} target={targetSlot} />
              )}

              <MessageBar intent="warning">
                <MessageBarBody>
                  Slot settings (marked with 🔒) will NOT be swapped.
                </MessageBarBody>
              </MessageBar>
            </DialogContent>

            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button>Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" icon={<ArrowSwapRegular />}>
                Swap
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
