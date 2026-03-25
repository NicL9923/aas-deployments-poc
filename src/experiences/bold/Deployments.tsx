import React, { useMemo, useState } from 'react';
import type { DeploymentSourceType, DeploymentStatus } from '../../types';
import {
  deploymentSource,
  allDeployments,
  deploymentSlots,
  availableOrgs,
  availableRepos,
  availableBranches,
} from '../../mock-data';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { StreamingLogViewer } from '../../components/shared/StreamingLogViewer';
import { DeploymentPhasePills } from '../../components/shared/DeploymentPhasePills';
import { formatRelativeTime, formatDuration } from '../../utils';
import {
  makeStyles,
  tokens,
  mergeClasses,
  Badge,
  Button,
  Combobox,
  Option,
  ProgressBar,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Text,
  Divider,
  Input,
  Label,
  Tooltip,
  SpinButton,
  Caption1,
  Subtitle2,
  MessageBar,
  MessageBarBody,
  Checkbox,
} from '@fluentui/react-components';
import {
  Info16Regular,
  BranchFork24Regular,
  Rocket24Regular,
  Open24Regular,
  Settings24Regular,
  ChevronRight24Regular,
  ArrowUpload24Regular,
  Code24Regular,
  Globe24Regular,
  Cloud24Regular,
  Eye24Regular,
  EyeOff24Regular,
  ArrowSwap24Regular,
  LayerDiagonal24Regular,
} from '@fluentui/react-icons';

// ─── Static data ────────────────────────────────────────────────────────────

const sourceOptions: {
  type: DeploymentSourceType;
  name: string;
  description: string;
  recommended?: boolean;
}[] = [
  { type: 'github', name: 'GitHub', description: 'Deploy using GitHub Actions workflows', recommended: true },
  { type: 'azureRepos', name: 'Azure Repos', description: 'Deploy from an Azure DevOps repository' },
  { type: 'bitbucket', name: 'Bitbucket', description: 'Deploy from Bitbucket Cloud' },
  { type: 'localGit', name: 'Local Git', description: 'Push directly from your local machine' },
  { type: 'externalGit', name: 'External Git', description: 'Any publicly accessible Git repository' },
  { type: 'publishFiles', name: 'Publish Files', description: 'Upload files from your dev tools' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const getSourceIcon = (type: DeploymentSourceType): React.ReactNode => {
  const map: Record<DeploymentSourceType, React.ReactNode> = {
    github: <BranchFork24Regular />,
    azureRepos: <Cloud24Regular />,
    bitbucket: <Code24Regular />,
    localGit: <Code24Regular />,
    externalGit: <Globe24Regular />,
    publishFiles: <ArrowUpload24Regular />,
    none: <Code24Regular />,
  };
  return map[type];
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  // Layout
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXL,
    maxWidth: '960px',
    paddingTop: tokens.spacingVerticalXL,
    paddingBottom: tokens.spacingVerticalXXL,
  },
  pageTitle: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightHero800,
  },

  // ── Source card ──────────────────────────
  sourceCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
  },
  sourceLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  sourceIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  sourceDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  sourceRepo: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
  },
  sourceMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  dot: {
    width: '3px',
    height: '3px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  disconnectBtn: {
    color: tokens.colorPaletteRedForeground1,
  },

  // ── Hero card ───────────────────────────
  heroCard: {
    paddingTop: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalXXL,
    paddingLeft: tokens.spacingHorizontalXXL,
    paddingRight: tokens.spacingHorizontalXXL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow8,
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorBrandStroke1,
    cursor: 'pointer',
    transitionProperty: 'box-shadow',
    transitionDuration: tokens.durationNormal,
    ':hover': {
      boxShadow: tokens.shadow16,
    },
  },
  heroTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalL,
  },
  heroBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    flex: 1,
    minWidth: 0,
  },
  heroLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  heroMessage: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: tokens.lineHeightBase500,
  },
  heroMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  commitHash: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground3,
    paddingTop: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground2,
  },
  branchChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground3,
    paddingTop: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorNeutralForeground2,
  },
  branchIcon: {
    fontSize: '12px',
    display: 'flex',
  },
  heroProgress: {
    marginTop: tokens.spacingVerticalM,
  },
  progressPulse: {
    animationName: {
      from: { opacity: 0.6 },
      to: { opacity: 1 },
    },
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
  },
  expandHint: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },

  // ── Quick actions ───────────────────────
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  previewPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow4,
    overflow: 'hidden',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
  },
  previewIframe: {
    width: '100%',
    height: '400px',
    border: 'none',
  },
  previewCaption: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalL}`,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },

  // ── Timeline ────────────────────────────
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  entry: {
    display: 'flex',
    flexDirection: 'column',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorNeutralStroke1,
    cursor: 'pointer',
    transitionProperty: 'box-shadow',
    transitionDuration: tokens.durationNormal,
    boxShadow: tokens.shadow2,
    ':hover': {
      boxShadow: tokens.shadow4,
    },
  },
  borderSuccess: { borderLeftColor: tokens.colorPaletteGreenBorder2 },
  borderFailed: { borderLeftColor: tokens.colorPaletteRedBorder2 },
  borderInProgress: { borderLeftColor: tokens.colorPaletteBlueBorderActive },
  borderPending: { borderLeftColor: tokens.colorPaletteYellowBorder2 },
  borderCanceled: { borderLeftColor: tokens.colorNeutralStroke1 },

  entryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: tokens.borderRadiusCircular,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForegroundOnBrand,
    flexShrink: 0,
  },
  avatarBerry: { backgroundColor: tokens.colorPaletteBerryBackground2 },
  avatarLavender: { backgroundColor: tokens.colorPaletteLavenderBackground2 },
  avatarMarigold: { backgroundColor: tokens.colorPaletteMarigoldBackground2 },
  avatarTeal: { backgroundColor: tokens.colorPaletteTealBackground2 },
  avatarPurple: { backgroundColor: tokens.colorPalettePurpleBackground2 },

  entryBody: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  entryMessage: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  entryMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  entryRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
  },
  expandIcon: {
    display: 'flex',
    color: tokens.colorNeutralForeground3,
    transitionProperty: 'transform',
    transitionDuration: tokens.durationNormal,
  },
  expandIconOpen: {
    transform: 'rotate(90deg)',
  },

  // ── Credentials ─────────────────────────
  credSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  credContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow2,
  },
  credField: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },

  // ── Setup dialog ────────────────────────
  dialogSurface: {
    maxWidth: '680px',
  },
  sourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalM,
  },
  sourceOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: 'pointer',
    textAlign: 'center',
    transitionProperty: 'border-color, box-shadow, background-color',
    transitionDuration: tokens.durationNormal,
    backgroundColor: tokens.colorNeutralBackground1,
    ':hover': {
      border: `1px solid ${tokens.colorBrandStroke1}`,
      boxShadow: tokens.shadow4,
    },
  },
  sourceOptionSelected: {
    border: `1px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: tokens.shadow4,
  },
  sourceOptionIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorBrandForeground1,
  },
  sourceOptionName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  sourceOptionDesc: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    lineHeight: tokens.lineHeightBase200,
  },
  configForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalM,
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  backLink: {
    alignSelf: 'flex-start',
  },

  // ── Slot selector ──────────────────────
  slotSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  slotPill: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXXS,
    minWidth: '140px',
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
  },
  slotPillLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  slotStatusDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: tokens.borderRadiusCircular,
    flexShrink: 0,
  },
  slotStatusRunning: {
    backgroundColor: tokens.colorPaletteGreenForeground1,
  },
  slotStatusStopped: {
    backgroundColor: tokens.colorPaletteRedForeground3,
  },
  slotTrafficLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  manageSlotsLink: {
    marginLeft: 'auto',
  },

  // ── Manage slots dialog ────────────────
  manageSlotsDialogSurface: {
    maxWidth: '600px',
  },
  manageDialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  manageTrafficRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
  },
  manageTrafficSlotInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    minWidth: '160px',
  },
  manageTrafficSpinButton: {
    width: '100px',
  },
  manageTrafficProgressBar: {
    flexGrow: 1,
    minWidth: '100px',
  },

  // ── Swap dialog ────────────────────────
  slotSwapDialogSurface: {
    maxWidth: '500px',
  },
  swapDialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  swapSlotRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalL,
  },
  swapSlotName: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalXXS,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    minWidth: '120px',
  },
  swapPreviewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
});

// ─── Component ──────────────────────────────────────────────────────────────

export const BoldDeployments = () => {
  const styles = useStyles();

  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedSource, setSelectedSource] = useState<DeploymentSourceType | null>(null);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('production');
  const [slotSwapDialogOpen, setSlotSwapDialogOpen] = useState(false);
  const [swapWithPreview, setSwapWithPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [manageSlotsDialogOpen, setManageSlotsDialogOpen] = useState(false);
  const currentSlotUrl = deploymentSlots.find(s => s.name === selectedSlot)?.url ?? '';
  const [traffic, setTraffic] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const slot of deploymentSlots) {
      initial[slot.name] = slot.trafficPercentage;
    }
    return initial;
  });

  const filteredDeployments = useMemo(
    () => allDeployments.filter(d => d.targetSlot === selectedSlot),
    [selectedSlot],
  );
  const latestDeployment = filteredDeployments[0];
  const recentDeployments = filteredDeployments.slice(1);

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const statusBorderMap: Record<DeploymentStatus, string> = {
    Success: styles.borderSuccess,
    Failed: styles.borderFailed,
    InProgress: styles.borderInProgress,
    Pending: styles.borderPending,
    Canceled: styles.borderCanceled,
  };

  const avatarClasses = [
    styles.avatarBerry,
    styles.avatarLavender,
    styles.avatarMarigold,
    styles.avatarTeal,
    styles.avatarPurple,
  ];

  const getAvatarColor = (name: string) =>
    avatarClasses[name.charCodeAt(0) % avatarClasses.length];

  const handleDisconnect = () => {
    setShowSetup(true);
    setSelectedSource(null);
  };

  const handleSourceSelect = (type: DeploymentSourceType) => {
    setSelectedSource(type);
    setSelectedOrg('');
    setSelectedRepo('');
    setSelectedBranch('');
  };

  const handleConnect = () => {
    setShowSetup(false);
    setSelectedSource(null);
  };

  const handleCancel = () => {
    setShowSetup(false);
    setSelectedSource(null);
  };

  const handleTrafficChange = (slotName: string, value: number) => {
    setTraffic((prev) => {
      const clamped = Math.max(0, Math.min(100, Math.round(value)));
      const otherSlot = deploymentSlots.find((s) => s.name !== slotName);
      if (!otherSlot) return prev;
      return { ...prev, [slotName]: clamped, [otherSlot.name]: 100 - clamped };
    });
  };

  return (
    <div className={styles.root}>
      {/* ── Slot selector ──────────────────────────────────── */}
      <div className={styles.slotSelector}>
        {deploymentSlots.map((slot) => (
          <Button
            key={slot.name}
            appearance={selectedSlot === slot.name ? 'primary' : 'outline'}
            shape="circular"
            className={styles.slotPill}
            onClick={() => setSelectedSlot(slot.name)}
          >
            <div className={styles.slotPillLabel}>
              <span
                className={mergeClasses(
                  styles.slotStatusDot,
                  slot.status === 'Running' ? styles.slotStatusRunning : styles.slotStatusStopped,
                )}
              />
              <Text weight="semibold">{slot.name}</Text>
              {slot.isProduction && (
                <Badge size="small" color="brand" appearance="tint">prod</Badge>
              )}
            </div>
            <Text className={styles.slotTrafficLabel}>{traffic[slot.name]}% traffic</Text>
          </Button>
        ))}

        <Button
          appearance="subtle"
          icon={<ArrowSwap24Regular />}
          onClick={() => setSlotSwapDialogOpen(true)}
        >
          Swap
        </Button>

        <Button
          appearance="subtle"
          icon={<LayerDiagonal24Regular />}
          className={styles.manageSlotsLink}
          onClick={() => setManageSlotsDialogOpen(true)}
        >
          Manage slots
        </Button>
      </div>

      {/* ── Swap dialog ───────────────────────────────────── */}
      <Dialog open={slotSwapDialogOpen} onOpenChange={(_, data) => setSlotSwapDialogOpen(data.open)}>
        <DialogSurface className={styles.slotSwapDialogSurface}>
          <DialogBody>
            <DialogTitle>Swap deployment slots</DialogTitle>
            <DialogContent className={styles.swapDialogContent}>
              <MessageBar intent="info">
                <MessageBarBody>
                  Swapping exchanges both slots simultaneously — staging content moves to production, and production content moves to staging. This preserves your previous production deployment for instant rollback.
                </MessageBarBody>
              </MessageBar>
              <div className={styles.swapSlotRow}>
                <div className={styles.swapSlotName}>
                  <Subtitle2>production</Subtitle2>
                  <Caption1>{traffic['production']}% traffic</Caption1>
                </div>
                <ArrowSwap24Regular />
                <div className={styles.swapSlotName}>
                  <Subtitle2>staging</Subtitle2>
                  <Caption1>{traffic['staging']}% traffic</Caption1>
                </div>
              </div>
              <div className={styles.swapPreviewRow}>
                <Checkbox
                  checked={swapWithPreview}
                  onChange={(_, data) => setSwapWithPreview(!!data.checked)}
                  label="Swap with preview"
                />
                <Tooltip
                  content="First applies the target slot's settings to the source so you can verify the app works with production configuration, then completes the swap after your approval."
                  relationship="description"
                >
                  <Info16Regular />
                </Tooltip>
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSlotSwapDialogOpen(false)}>Cancel</Button>
              <Button appearance="primary" onClick={() => setSlotSwapDialogOpen(false)}>
                {swapWithPreview ? 'Start preview' : 'Confirm swap'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Manage slots dialog ───────────────────────────── */}
      <Dialog open={manageSlotsDialogOpen} onOpenChange={(_, data) => setManageSlotsDialogOpen(data.open)}>
        <DialogSurface className={styles.manageSlotsDialogSurface}>
          <DialogBody>
            <DialogTitle>Manage deployment slots</DialogTitle>
            <DialogContent className={styles.manageDialogContent}>
              <Text weight="semibold">Traffic routing</Text>
              <Divider />
              {deploymentSlots.map((slot) => (
                <div key={slot.name} className={styles.manageTrafficRow}>
                  <div className={styles.manageTrafficSlotInfo}>
                    <Subtitle2>{slot.name}</Subtitle2>
                    {slot.isProduction && (
                      <Badge size="small" color="brand" appearance="tint">prod</Badge>
                    )}
                  </div>
                  <SpinButton
                    className={styles.manageTrafficSpinButton}
                    value={traffic[slot.name]}
                    min={0}
                    max={100}
                    step={5}
                    onChange={(_ev, data) => {
                      if (data.value != null) handleTrafficChange(slot.name, data.value);
                    }}
                  />
                  <ProgressBar
                    className={styles.manageTrafficProgressBar}
                    value={traffic[slot.name] / 100}
                    thickness="large"
                    shape="rounded"
                  />
                </div>
              ))}
              <Divider />
              <Button appearance="outline" icon={<LayerDiagonal24Regular />}>Add slot</Button>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setManageSlotsDialogOpen(false)}>Close</Button>
              <Button appearance="primary" onClick={() => setManageSlotsDialogOpen(false)}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Header ─────────────────────────────────────────── */}
      <Text className={styles.pageTitle} block>
        Deployments
      </Text>

      {/* ── Source card ─────────────────────────────────────── */}
      <div className={styles.sourceCard}>
        <div className={styles.sourceLeft}>
          <div className={styles.sourceIcon}>
            <BranchFork24Regular />
          </div>
          <div className={styles.sourceDetails}>
            <Text className={styles.sourceRepo}>
              {deploymentSource.githubOrg}/{deploymentSource.githubRepo}
            </Text>
            <div className={styles.sourceMeta}>
              <span>{deploymentSource.githubBranch}</span>
              <span className={styles.dot} />
              <span>GitHub Actions</span>
            </div>
          </div>
        </div>
        <Tooltip content="Disconnect deployment source" relationship="description">
          <Button
            appearance="subtle"
            className={styles.disconnectBtn}
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </Tooltip>
      </div>

      {/* ── Latest deployment hero ─────────────────────────── */}
      {latestDeployment && (
        <div
          className={styles.heroCard}
          onClick={() => toggleExpanded(latestDeployment.id)}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') toggleExpanded(latestDeployment.id);
          }}
        >
          <div className={styles.heroTop}>
            <div className={styles.heroBody}>
              <Text className={styles.heroLabel}>Latest Deployment</Text>
              <Text className={styles.heroMessage}>
                {latestDeployment.commitMessage ?? latestDeployment.message}
              </Text>
              <div className={styles.heroMeta}>
                <span>{latestDeployment.author}</span>
                <span className={styles.dot} />
                <StatusBadge status={latestDeployment.status} />
                <span className={styles.dot} />
                <Tooltip content={latestDeployment.timestamp} relationship="description">
                  <span>{formatRelativeTime(latestDeployment.timestamp)}</span>
                </Tooltip>
                {latestDeployment.durationSeconds != null && (
                  <>
                    <span className={styles.dot} />
                    <span>{formatDuration(latestDeployment.durationSeconds)}</span>
                  </>
                )}
                {latestDeployment.commitId && (
                  <Tooltip
                    content={`Commit ${latestDeployment.commitId}`}
                    relationship="description"
                  >
                    <span className={styles.commitHash}>
                      {latestDeployment.commitId.slice(0, 7)}
                    </span>
                  </Tooltip>
                )}
                {latestDeployment.branch && (
                  <span className={styles.branchChip}>
                    <span className={styles.branchIcon}><BranchFork24Regular /></span>
                    {latestDeployment.branch}
                  </span>
                )}
              </div>
              {latestDeployment.phases && (
                <DeploymentPhasePills phases={latestDeployment.phases} />
              )}
            </div>
            <span
              className={mergeClasses(
                styles.expandIcon,
                expandedIds.includes(latestDeployment.id) && styles.expandIconOpen,
              )}
            >
              <ChevronRight24Regular />
            </span>
          </div>

          {latestDeployment.status === 'InProgress' && (
            <div className={mergeClasses(styles.heroProgress, styles.progressPulse)}>
              <ProgressBar />
            </div>
          )}

          {!expandedIds.includes(latestDeployment.id) && (
            <div className={styles.expandHint}>
              <ChevronRight24Regular fontSize={12} />
              <span>Click to view build logs</span>
            </div>
          )}

          {expandedIds.includes(latestDeployment.id) && latestDeployment.buildLogs && (
            <StreamingLogViewer
              logs={latestDeployment.buildLogs}
              isStreaming={latestDeployment.status === 'InProgress'}
            />
          )}
        </div>
      )}

      {/* ── Quick actions ──────────────────────────────────── */}
      <div className={styles.actionsRow}>
        <Button appearance="primary" icon={<Rocket24Regular />}>
          Trigger deploy
        </Button>
        <Button appearance="outline" icon={<Open24Regular />}>
          View on GitHub
        </Button>
        <Button
          appearance="outline"
          icon={<Open24Regular />}
          onClick={() => window.open(currentSlotUrl, '_blank', 'noopener,noreferrer')}
        >
          View site
        </Button>
        <Button
          appearance="subtle"
          icon={<Settings24Regular />}
          onClick={() => {
            setShowSetup(true);
            setSelectedSource(null);
          }}
        >
          Change source
        </Button>
      </div>

      {/* ── Site preview ───────────────────────────────────── */}
      <div className={styles.previewPanel}>
        <div className={styles.previewHeader}>
          <Button
            appearance="subtle"
            icon={showPreview ? <EyeOff24Regular /> : <Eye24Regular />}
            onClick={() => setShowPreview(prev => !prev)}
          >
            {showPreview ? 'Hide preview' : 'Preview site'}
          </Button>
        </div>
        {showPreview && (
          <>
            <iframe
              src={currentSlotUrl}
              sandbox="allow-scripts allow-same-origin"
              className={styles.previewIframe}
              style={{ borderRadius: tokens.borderRadiusLarge }}
              title="Site preview"
            />
            <Caption1 className={styles.previewCaption}>
              Preview may not work for API-only applications or sites with X-Frame-Options restrictions.
            </Caption1>
          </>
        )}
      </div>

      <Divider />

      {/* ── Recent deployments ─────────────────────────────── */}
      <div className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>Recent Deployments</Text>
        <Badge appearance="tint" color="informative" size="small">
          {recentDeployments.length}
        </Badge>
      </div>

      <div className={styles.timeline}>
        {recentDeployments.map(entry => {
          const isExpanded = expandedIds.includes(entry.id);
          const displayMsg = entry.commitMessage ?? entry.message;
          const truncatedMsg =
            displayMsg.length > 60 ? `${displayMsg.slice(0, 60)}\u2026` : displayMsg;

          return (
            <div
              key={entry.id}
              className={mergeClasses(styles.entry, statusBorderMap[entry.status])}
              onClick={() => toggleExpanded(entry.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') toggleExpanded(entry.id);
              }}
            >
              <div className={styles.entryRow}>
                <div className={mergeClasses(styles.avatar, getAvatarColor(entry.author))}>
                  {entry.author.charAt(0).toUpperCase()}
                </div>

                <div className={styles.entryBody}>
                  <Text className={styles.entryMessage} title={displayMsg}>
                    {truncatedMsg}
                  </Text>
                  <div className={styles.entryMeta}>
                    <span>{entry.author}</span>
                    <span className={styles.dot} />
                    <Tooltip content={entry.timestamp} relationship="description">
                      <span>{formatRelativeTime(entry.timestamp)}</span>
                    </Tooltip>
                    {entry.durationSeconds != null && (
                      <>
                        <span className={styles.dot} />
                        <span>{formatDuration(entry.durationSeconds)}</span>
                      </>
                    )}
                    {entry.commitId && (
                      <Tooltip content={`Commit ${entry.commitId}`} relationship="description">
                        <span className={styles.commitHash}>
                          {entry.commitId.slice(0, 7)}
                        </span>
                      </Tooltip>
                    )}
                    {entry.branch && (
                      <span className={styles.branchChip}>
                        <span className={styles.branchIcon}><BranchFork24Regular /></span>
                        {entry.branch}
                      </span>
                    )}
                  </div>
                  {entry.phases && (
                    <DeploymentPhasePills phases={entry.phases} />
                  )}
                </div>

                <div className={styles.entryRight}>
                  <StatusBadge status={entry.status} />
                  <span
                    className={mergeClasses(
                      styles.expandIcon,
                      isExpanded && styles.expandIconOpen,
                    )}
                  >
                    <ChevronRight24Regular />
                  </span>
                </div>
              </div>

              {isExpanded && entry.buildLogs && (
                <StreamingLogViewer
                  logs={entry.buildLogs}
                  isStreaming={entry.status === 'InProgress'}
                />
              )}
            </div>
          );
        })}
      </div>

      <Divider />

      {/* ── Legacy credentials ─────────────────────────────── */}
      <div className={styles.credSection}>
        <Button
          appearance="subtle"
          icon={showCredentials ? <EyeOff24Regular /> : <Eye24Regular />}
          onClick={() => setShowCredentials(prev => !prev)}
        >
          {showCredentials ? 'Hide' : 'Show'} legacy credentials
        </Button>

        {showCredentials && (
          <div className={styles.credContent}>
            <div className={styles.credField}>
              <Label htmlFor="ftps-endpoint">FTPS Endpoint</Label>
              <Input
                id="ftps-endpoint"
                value="ftps://waws-prod-bay-001.ftp.azurewebsites.windows.net"
                readOnly
              />
            </div>
            <div className={styles.credField}>
              <Label htmlFor="ftps-user">Username</Label>
              <Input id="ftps-user" value="my-node-app\$my-node-app" readOnly />
            </div>
            <div className={styles.credField}>
              <Label htmlFor="ftps-pass">Password</Label>
              <Input id="ftps-pass" type="password" value="a1b2c3d4e5f6g7h8i9j0" readOnly />
            </div>
          </div>
        )}
      </div>

      {/* ── Setup dialog ───────────────────────────────────── */}
      <Dialog
        open={showSetup}
        onOpenChange={(_, data) => {
          if (!data.open) handleCancel();
        }}
      >
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>Configure Deployment Source</DialogTitle>
            <DialogContent>
              {!selectedSource ? (
                <div className={styles.sourceGrid}>
                  {sourceOptions.map(opt => (
                    <div
                      key={opt.type}
                      className={mergeClasses(
                        styles.sourceOption,
                        selectedSource === opt.type && styles.sourceOptionSelected,
                      )}
                      onClick={() => handleSourceSelect(opt.type)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') handleSourceSelect(opt.type);
                      }}
                    >
                      <div className={styles.sourceOptionIcon}>
                        {getSourceIcon(opt.type)}
                      </div>
                      <Text className={styles.sourceOptionName}>{opt.name}</Text>
                      {opt.recommended && (
                        <Badge appearance="filled" color="brand" size="small">
                          Recommended
                        </Badge>
                      )}
                      <Text className={styles.sourceOptionDesc}>{opt.description}</Text>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.configForm}>
                  <Button
                    appearance="subtle"
                    size="small"
                    className={styles.backLink}
                    onClick={() => setSelectedSource(null)}
                  >
                    ← Back to sources
                  </Button>

                  {selectedSource === 'github' && (
                    <>
                      <div className={styles.formField}>
                        <Label htmlFor="org-select">Organization</Label>
                        <Combobox
                          id="org-select"
                          placeholder="Select organization"
                          value={selectedOrg}
                          onOptionSelect={(_, data) => {
                            setSelectedOrg(data.optionText ?? '');
                            setSelectedRepo('');
                            setSelectedBranch('');
                          }}
                        >
                          {availableOrgs.map(org => (
                            <Option key={org} value={org}>
                              {org}
                            </Option>
                          ))}
                        </Combobox>
                      </div>

                      {selectedOrg && availableRepos[selectedOrg] && (
                        <div className={styles.formField}>
                          <Label htmlFor="repo-select">Repository</Label>
                          <Combobox
                            id="repo-select"
                            placeholder="Select repository"
                            value={selectedRepo}
                            onOptionSelect={(_, data) => {
                              setSelectedRepo(data.optionText ?? '');
                              setSelectedBranch('');
                            }}
                          >
                            {availableRepos[selectedOrg].map(repo => (
                              <Option key={repo} value={repo}>
                                {repo}
                              </Option>
                            ))}
                          </Combobox>
                        </div>
                      )}

                      {selectedRepo && (
                        <div className={styles.formField}>
                          <Label htmlFor="branch-select">Branch</Label>
                          <Combobox
                            id="branch-select"
                            placeholder="Select branch"
                            value={selectedBranch}
                            onOptionSelect={(_, data) => {
                              setSelectedBranch(data.optionText ?? '');
                            }}
                          >
                            {availableBranches.map(branch => (
                              <Option key={branch} value={branch}>
                                {branch}
                              </Option>
                            ))}
                          </Combobox>
                        </div>
                      )}
                    </>
                  )}

                  {selectedSource !== 'github' && (
                    <Text>
                      Configuration for{' '}
                      {sourceOptions.find(o => o.type === selectedSource)?.name ?? selectedSource}{' '}
                      is not yet available in this preview.
                    </Text>
                  )}
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              {selectedSource === 'github' && selectedOrg && selectedRepo && selectedBranch && (
                <Button appearance="primary" onClick={handleConnect}>
                  Connect
                </Button>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
