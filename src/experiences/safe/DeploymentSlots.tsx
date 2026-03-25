import { useCallback, useState } from 'react';
import {
  Badge,
  Button,
  makeStyles,
  mergeClasses,
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
import { SwapDialog } from '../../components/shared/SwapDialog';

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
// Main component
// ---------------------------------------------------------------------------

export const SafeDeploymentSlots = () => {
  const styles = useStyles();
  const slots = deploymentSlots;

  const [showSwapDialog, setShowSwapDialog] = useState(false);

  const openSwapDialog = useCallback(() => {
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
      <SwapDialog
        open={showSwapDialog}
        onOpenChange={setShowSwapDialog}
        slots={deploymentSlots}
      />
    </div>
  );
};
