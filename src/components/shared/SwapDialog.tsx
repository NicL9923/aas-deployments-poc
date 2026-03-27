import { useMemo, useState } from 'react';
import { StatusBadge } from './StatusBadge';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  mergeClasses,
  MessageBar,
  MessageBarBody,
  Option,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Caption1,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import type { DeploymentSlot } from '../../types';

interface SwapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slots: DeploymentSlot[];
}

const useStyles = makeStyles({
  surface: {
    maxWidth: '700px',
  },
  dotGreen: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorPaletteGreenForeground1,
  },
  dotPink: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorPaletteCranberryForeground2,
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  section: {
    marginBottom: tokens.spacingVerticalM,
  },
  swapPreviewSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: tokens.spacingVerticalXS,
  },
  swapPreviewCaption: {
    paddingLeft: '28px',
    color: tokens.colorNeutralForeground3,
    display: 'block',
    maxWidth: '100%',
  },
  configHeading: {
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXS,
  },
  configDescription: {
    marginBottom: tokens.spacingVerticalM,
  },
  tabContent: {
    marginTop: tokens.spacingVerticalM,
  },
  noChanges: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
  },
  tabIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  tabDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: tokens.borderRadiusCircular,
  },
  tabDotGreen: {
    backgroundColor: tokens.colorPaletteGreenForeground1,
  },
  tabDotPink: {
    backgroundColor: tokens.colorPaletteCranberryForeground2,
  },
  dropdown: {
    minWidth: '200px',
  },
  messageBar: {
    marginBottom: tokens.spacingVerticalS,
  },
  configTable: {
    tableLayout: 'fixed' as const,
    width: '100%',
  },
  ellipsisCell: {
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 0,
  },
  slotDeployInfo: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

interface SettingDiff {
  setting: string;
  type: string;
  oldValue: string;
  newValue: string;
}

const computeDiffs = (
  currentSlot: DeploymentSlot | undefined,
  otherSlot: DeploymentSlot | undefined,
): SettingDiff[] => {
  if (!currentSlot || !otherSlot) return [];

  const currentMap = new Map(
    currentSlot.appSettings.map((s) => [s.name, s]),
  );
  const otherMap = new Map(
    otherSlot.appSettings.map((s) => [s.name, s]),
  );

  const allKeys = new Set([...currentMap.keys(), ...otherMap.keys()]);
  const diffs: SettingDiff[] = [];

  for (const key of allKeys) {
    const current = currentMap.get(key);
    const other = otherMap.get(key);
    const oldValue = current?.value ?? '';
    const newValue = other?.value ?? '';

    if (oldValue !== newValue) {
      const isSlotSetting = current?.isSlotSetting ?? other?.isSlotSetting ?? false;
      diffs.push({
        setting: key,
        type: isSlotSetting ? 'Slot Setting' : 'App Setting',
        oldValue,
        newValue,
      });
    }
  }

  return diffs;
};

const columns = [
  { key: 'setting', label: 'Setting' },
  { key: 'type', label: 'Type' },
  { key: 'oldValue', label: 'Old Value' },
  { key: 'newValue', label: 'New Value' },
];

export const SwapDialog = ({ open, onOpenChange, slots }: SwapDialogProps) => {
  const defaultSource = useMemo(() => {
    const nonProd = slots.find((s) => !s.isProduction);
    return nonProd?.name ?? slots[0]?.name ?? '';
  }, [slots]);

  const defaultTarget = useMemo(() => {
    const prod = slots.find((s) => s.isProduction);
    return prod?.name ?? slots[0]?.name ?? '';
  }, [slots]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <SwapDialogContent
        key={`${open ? 'open' : 'closed'}-${defaultSource}-${defaultTarget}`}
        defaultSource={defaultSource}
        defaultTarget={defaultTarget}
        onOpenChange={onOpenChange}
        slots={slots}
      />
    </Dialog>
  );
};

interface SwapDialogContentProps {
  defaultSource: string;
  defaultTarget: string;
  onOpenChange: (open: boolean) => void;
  slots: DeploymentSlot[];
}

const SwapDialogContent = ({
  defaultSource,
  defaultTarget,
  onOpenChange,
  slots,
}: SwapDialogContentProps) => {
  const styles = useStyles();

  const [selectedSource, setSelectedSource] = useState(defaultSource);
  const [selectedTarget, setSelectedTarget] = useState(defaultTarget);
  const [swapWithPreview, setSwapWithPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('source');

  const sourceSlot = slots.find((s) => s.name === selectedSource);
  const targetSlot = slots.find((s) => s.name === selectedTarget);
  const targetIsProduction = targetSlot?.isProduction ?? false;

  const sourceDiffs = useMemo(
    () => computeDiffs(sourceSlot, targetSlot),
    [sourceSlot, targetSlot],
  );
  const targetDiffs = useMemo(
    () => computeDiffs(targetSlot, sourceSlot),
    [targetSlot, sourceSlot],
  );

  const activeDiffs = activeTab === 'source' ? sourceDiffs : targetDiffs;

  const handleSourceChange = (_: unknown, data: { optionValue?: string }) => {
    const value = data.optionValue ?? '';
    setSelectedSource(value);
    if (value === selectedTarget) {
      const other = slots.find((s) => s.name !== value);
      if (other) setSelectedTarget(other.name);
    }
  };

  const handleTargetChange = (_: unknown, data: { optionValue?: string }) => {
    const value = data.optionValue ?? '';
    setSelectedTarget(value);
    if (value === selectedSource) {
      const other = slots.find((s) => s.name !== value);
      if (other) setSelectedSource(other.name);
    }
  };

  const handleConfirm = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <DialogSurface className={styles.surface}>
      <DialogBody>
        <DialogTitle>Swap</DialogTitle>
        <DialogContent>
            {/* Source section */}
            <div className={styles.section}>
              <div className={styles.labelRow}>
                <span className={styles.dotGreen} />
                <Text weight="semibold">Source</Text>
              </div>
              <Dropdown
                className={styles.dropdown}
                value={selectedSource}
                selectedOptions={[selectedSource]}
                onOptionSelect={handleSourceChange}
              >
                {slots.map((slot) => (
                  <Option key={slot.name} value={slot.name}>
                    {slot.name}
                  </Option>
                ))}
              </Dropdown>
              {sourceSlot?.lastDeployment && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <Text className={styles.slotDeployInfo}>
                    {sourceSlot.lastDeployment.commitId?.slice(0, 7)}{' '}
                    {(sourceSlot.lastDeployment.commitMessage ?? sourceSlot.lastDeployment.message).length > 50
                      ? `${(sourceSlot.lastDeployment.commitMessage ?? sourceSlot.lastDeployment.message).slice(0, 50)}\u2026`
                      : (sourceSlot.lastDeployment.commitMessage ?? sourceSlot.lastDeployment.message)}
                  </Text>
                  <StatusBadge status={sourceSlot.lastDeployment.status} />
                </div>
              )}
            </div>

            {/* Target section */}
            <div className={styles.section}>
              <div className={styles.labelRow}>
                <span className={styles.dotPink} />
                <Text weight="semibold">Target</Text>
                {targetIsProduction && (
                  <Badge color="success" appearance="filled" size="small">
                    PRODUCTION
                  </Badge>
                )}
              </div>
              <Dropdown
                className={styles.dropdown}
                value={selectedTarget}
                selectedOptions={[selectedTarget]}
                onOptionSelect={handleTargetChange}
              >
                {slots.map((slot) => (
                  <Option key={slot.name} value={slot.name}>
                    {slot.name}
                  </Option>
                ))}
              </Dropdown>
              {targetSlot?.lastDeployment && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <Text className={styles.slotDeployInfo}>
                    {targetSlot.lastDeployment.commitId?.slice(0, 7)}{' '}
                    {(targetSlot.lastDeployment.commitMessage ?? targetSlot.lastDeployment.message).length > 50
                      ? `${(targetSlot.lastDeployment.commitMessage ?? targetSlot.lastDeployment.message).slice(0, 50)}\u2026`
                      : (targetSlot.lastDeployment.commitMessage ?? targetSlot.lastDeployment.message)}
                  </Text>
                  <StatusBadge status={targetSlot.lastDeployment.status} />
                </div>
              )}
            </div>

            {/* Info bar */}
            <div className={styles.messageBar}>
              <MessageBar intent="info">
                <MessageBarBody>
                  Swap with preview can only be used with sites that have deployment slot settings enabled.
                </MessageBarBody>
              </MessageBar>
            </div>

            {/* Swap with preview checkbox */}
            <div className={mergeClasses(styles.section, styles.swapPreviewSection)}>
              <Checkbox
                label="Perform swap with preview"
                checked={swapWithPreview}
                onChange={(_, data) => setSwapWithPreview(!!data.checked)}
                disabled
              />
              <Caption1 className={styles.swapPreviewCaption}>
                Applies target slot settings to source first, letting you validate under production config before completing the swap.
              </Caption1>
            </div>

            {/* Config changes section */}
            <div className={styles.section}>
              <Text className={styles.configHeading} block>
                Config changes
              </Text>
              <Text className={styles.configDescription} block size={200}>
                This is a summary of the final set of configuration changes on the source and target
                deployment slots after the swap has completed.
              </Text>

              <TabList
                selectedValue={activeTab}
                onTabSelect={(_, data) => setActiveTab(data.value as string)}
              >
                <Tab value="source">
                  <span className={styles.tabIndicator}>
                    <span className={mergeClasses(styles.tabDot, styles.tabDotGreen)} />
                    Source slot changes
                  </span>
                </Tab>
                <Tab value="target">
                  <span className={styles.tabIndicator}>
                    <span className={mergeClasses(styles.tabDot, styles.tabDotPink)} />
                    Target slot changes
                  </span>
                </Tab>
              </TabList>

              <div className={styles.tabContent}>
                {activeDiffs.length === 0 ? (
                  <div className={styles.noChanges}>
                    <Text>No changes</Text>
                  </div>
                ) : (
                  <Table className={styles.configTable}>
                    <TableHeader>
                      <TableRow>
                        {columns.map((col) => (
                          <TableHeaderCell key={col.key}>{col.label}</TableHeaderCell>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeDiffs.map((diff) => (
                        <TableRow key={diff.setting}>
                          <TableCell className={styles.ellipsisCell} title={diff.setting}>{diff.setting}</TableCell>
                          <TableCell>{diff.type}</TableCell>
                          <TableCell className={styles.ellipsisCell} title={diff.oldValue}>{diff.oldValue}</TableCell>
                          <TableCell className={styles.ellipsisCell} title={diff.newValue}>{diff.newValue}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
        </DialogContent>
        <DialogActions>
          <Button appearance="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button appearance="primary" onClick={handleConfirm}>
            {swapWithPreview ? 'Start preview' : 'Swap'}
          </Button>
        </DialogActions>
      </DialogBody>
    </DialogSurface>
  );
};
