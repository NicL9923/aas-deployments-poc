import React, { useMemo, useState } from 'react';
import type { DeploymentSourceType } from '../../types';
import { useSlot } from '../../context/SlotContext';
import {
  deploymentSources,
  allDeployments,
  deploymentSlots,
  availableOrgs,
  availableRepos,
  availableBranches,
  webApp,
  ftpsCredentials,
  sidecarContainersBySlot,
} from '../../mock-data';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { StreamingLogViewer } from '../../components/shared/StreamingLogViewer';
import { DeploymentLogTable } from '../../components/shared/DeploymentLogTable';
import { DeploymentPhasePills } from '../../components/shared/DeploymentPhasePills';
import { SwapDialog } from '../../components/shared/SwapDialog';
import { formatRelativeTime, formatDuration } from '../../utils';
import {
  makeStyles,
  tokens,
  mergeClasses,
  Badge,
  Button,
  Combobox,
  Dropdown,
  Link,
  Option,
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
  Subtitle2,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuButton,
} from '@fluentui/react-components';
import {
  BranchFork24Regular,
  Rocket24Regular,
  Settings24Regular,
  ChevronRight24Regular,
  ArrowUpload24Regular,
  Code24Regular,
  Globe24Regular,
  Cloud24Regular,
  Eye24Regular,
  ArrowSwap24Regular,
  LayerDiagonal24Regular,
  DocumentText24Regular,
  ArrowCounterclockwise24Regular,
  Copy24Regular,
  Box24Regular,
  Delete24Regular,
  TextDescription24Regular,
  Add24Regular,
  Info16Regular,
  ArrowDownload24Regular,
} from '@fluentui/react-icons';

// ─── Static data ────────────────────────────────────────────────────────────

const sourceOptions: {
  type: DeploymentSourceType;
  name: string;
  description: string;
  recommended?: boolean;
  manual?: boolean;
}[] = [
  { type: 'github', name: 'GitHub', description: 'Deploy using GitHub Actions workflows', recommended: true },
  { type: 'azureRepos', name: 'Azure Repos', description: 'Deploy from an Azure DevOps repository' },
  { type: 'bitbucket', name: 'Bitbucket', description: 'Deploy from Bitbucket Cloud' },
  { type: 'localGit', name: 'Local Git', description: 'Push directly from your local machine' },
  { type: 'externalGit', name: 'External Git', description: 'Any publicly accessible Git repository', manual: true },
  { type: 'publishFiles', name: 'Publish files', description: 'Upload files from your dev tools', manual: true },
];

const activityLogs = [
  { operation: 'Swap Web App Slots', status: 'Succeeded', time: '2 days ago', timestamp: 'Tue Mar 24 2026 10:32:14 GMT', initiatedBy: 'nicolaslayne@microsoft.com' },
  { operation: 'Update Web App Configuration', status: 'Succeeded', time: '3 days ago', timestamp: 'Mon Mar 23 2026 15:18:42 GMT', initiatedBy: 'nicolaslayne@microsoft.com' },
  { operation: 'Restart Web App', status: 'Succeeded', time: '5 days ago', timestamp: 'Sat Mar 21 2026 09:04:11 GMT', initiatedBy: 'nicolaslayne@microsoft.com' },
  { operation: 'Update App Service Plan', status: 'Succeeded', time: '1 week ago', timestamp: 'Wed Mar 18 2026 14:22:05 GMT', initiatedBy: 'nicolaslayne@microsoft.com' },
  { operation: 'Add Deployment Slot', status: 'Succeeded', time: '1 week ago', timestamp: 'Wed Mar 18 2026 14:10:33 GMT', initiatedBy: 'nicolaslayne@microsoft.com' },
  { operation: 'Update Web App Configuration', status: 'Failed', time: '2 weeks ago', timestamp: 'Tue Mar 11 2026 11:45:20 GMT', initiatedBy: 'admin@contoso.com' },
  { operation: 'Swap Web App Slots', status: 'Succeeded', time: '2 weeks ago', timestamp: 'Mon Mar 10 2026 08:30:55 GMT', initiatedBy: 'nicolaslayne@microsoft.com' },
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
    maxWidth: '100%',
    paddingTop: tokens.spacingVerticalXL,
    paddingBottom: tokens.spacingVerticalXXL,
  },
  // ── Top row (source + slots overview) ───
  topRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalXXL,
    alignItems: 'stretch',
  },
  // ── Source card──────────────────────────
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
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': {
      backgroundColor: tokens.colorPaletteRedForeground1,
      color: tokens.colorNeutralForegroundOnBrand,
    },
  },
  sourceActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },

  // ── Slots overview card ────────────────
  slotsOverviewCard: {
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  slotsOverviewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  slotsOverviewDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  trafficBar: {
    display: 'flex',
    height: '32px',
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    width: '100%',
  },
  trafficBarChunk: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: 'white',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    minWidth: 0,
  },
  slotListItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: tokens.fontSizeBase200,
  },
  slotsLegend: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalL,
  },
  statusDotSmall: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: tokens.borderRadiusCircular,
    flexShrink: 0,
  },
  statusDotRunning: {
    backgroundColor: tokens.colorPaletteGreenForeground1,
  },
  statusDotStopped: {
    backgroundColor: tokens.colorPaletteRedForeground3,
  },

  // ── Hero card ───────────────────────────
  heroRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalXXL,
    alignItems: 'stretch',
  },
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
  heroEmptyState: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    minHeight: '140px',
  },
  heroEmptyIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },
  heroEmptyText: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
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

  // ── Sidecar card ────────────────────────
  sidecarCard: {
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalXXL,
    paddingRight: tokens.spacingHorizontalXXL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow8,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  sidecarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidecarTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  sidecarIcon: {
    display: 'flex',
    color: tokens.colorBrandForeground1,
  },
  sidecarDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    lineHeight: tokens.lineHeightBase200,
  },
  sidecarTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  sidecarTh: {
    textAlign: 'left' as const,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  sidecarTd: {
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
    verticalAlign: 'middle' as const,
  },
  sidecarCellMono: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sidecarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
  },
  sidecarLogPre: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    overflowX: 'auto',
    maxHeight: '300px',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    lineHeight: tokens.lineHeightBase300,
  },
  sidecarEditForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },

  // ── Quick actions ───────────────────────
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  // ── Deployments table ──────────────────
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
  deploymentsTableScroll: {
    maxHeight: '600px',
    overflowY: 'auto',
  },
  deploymentsTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    position: 'sticky' as const,
    top: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    zIndex: 1,
  },
  th: {
    textAlign: 'left' as const,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  tableRow: {
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  td: {
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
    verticalAlign: 'top' as const,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
  },
  deploymentCell: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: tokens.spacingVerticalXXS,
  },
  deploymentFirstLine: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  deploymentMessage: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  deploymentAuthor: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  chevronCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground3,
  },
  timeCell: {
    whiteSpace: 'nowrap' as const,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  durationCell: {
    whiteSpace: 'nowrap' as const,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  detailDialogSurface: {
    maxWidth: '800px',
  },
  detailContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: tokens.spacingVerticalL,
  },
  detailMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap' as const,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  detailLogsScroll: {
    height: '400px',
    overflowY: 'auto' as const,
  },

  // ── Activity log dialog ────────────────
  activityDialogSurface: {
    maxWidth: '960px',
  },
  activityTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  activityTh: {
    textAlign: 'left' as const,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  activityTd: {
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
    whiteSpace: 'nowrap' as const,
  },
  activityOperationCell: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },

  // ── FTPS credentials dialog ─────────────
  ftpsDialogSurface: {
    maxWidth: '680px',
  },
  ftpsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  ftpsDescription: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  ftpsEndpointRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  ftpsSectionHeading: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
  },
  ftpsSectionDescription: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
  },
  ftpsFieldRow: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr auto',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  ftpsFieldLabel: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },
  credField: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  ftpsFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: tokens.spacingVerticalM,
  },
  ftpsActionsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },

  // ── Setup dialog────────────────────────
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
  slotSelectorBar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
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
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 1fr)',
    alignItems: 'start',
    gap: tokens.spacingHorizontalL,
  },
  manageTrafficSlotInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
  },
  manageTrafficSpinButton: {
    width: '100%',
  },
});

// ─── Component ──────────────────────────────────────────────────────────────

export const BoldDeployments = () => {
  const styles = useStyles();

  const [showSetup, setShowSetup] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [addSlotDialogOpen, setAddSlotDialogOpen] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [cloneFrom, setCloneFrom] = useState('Do not clone settings');
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [selectedSource, setSelectedSource] = useState<DeploymentSourceType | null>(null);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [ftpsDialogOpen, setFtpsDialogOpen] = useState(false);
  const [sidecarLogDialog, setSidecarLogDialog] = useState<string | null>(null);
  const [sidecarEditDialog, setSidecarEditDialog] = useState<string | null>(null);
  const [deploymentDetailId, setDeploymentDetailId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const { selectedSlot } = useSlot();
  const currentSidecars = sidecarContainersBySlot[selectedSlot] ?? [];
  const currentSource = deploymentSources[selectedSlot] ?? null;

  React.useEffect(() => {
    setIsDisconnected(!deploymentSources[selectedSlot]);
  }, [selectedSlot]);

  const [slotSwapDialogOpen, setSlotSwapDialogOpen] = useState(false);
  const [manageSlotsDialogOpen, setManageSlotsDialogOpen] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
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

  const handleDisconnect= () => {
    setDisconnectDialogOpen(true);
  };

  const confirmDisconnect = () => {
    setDisconnectDialogOpen(false);
    setIsDisconnected(true);
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
      <div className={styles.slotSelectorBar}>
        <Button
          appearance="subtle"
          icon={<ArrowSwap24Regular />}
          onClick={() => setSlotSwapDialogOpen(true)}
        >
          Swap
        </Button>

        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton appearance="subtle" icon={<LayerDiagonal24Regular />}>
              Manage slots
            </MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem
                icon={<Add24Regular />}
                onClick={() => {
                  setNewSlotName('');
                  setCloneFrom('Do not clone settings');
                  setAddSlotDialogOpen(true);
                }}
              >
                Add slot
              </MenuItem>
              <MenuItem
                icon={<ArrowSwap24Regular />}
                onClick={() => setManageSlotsDialogOpen(true)}
              >
                Adjust traffic
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        <Button
          appearance="subtle"
          icon={<DocumentText24Regular />}
          onClick={() => setActivityLogOpen(true)}
        >
          Activity log
        </Button>

        <Button
          appearance="subtle"
          icon={<Eye24Regular />}
          onClick={() => setFtpsDialogOpen(true)}
        >
          FTPS credentials
        </Button>
      </div>

      {/* ── Swap dialog ───────────────────────────────────── */}
      <SwapDialog
        open={slotSwapDialogOpen}
        onOpenChange={setSlotSwapDialogOpen}
        slots={deploymentSlots}
      />

      {/* ── Manage slots dialog ───────────────────────────── */}
      <Dialog open={manageSlotsDialogOpen} onOpenChange={(_, data) => setManageSlotsDialogOpen(data.open)}>
        <DialogSurface className={styles.manageSlotsDialogSurface}>
          <DialogBody>
            <DialogTitle>Traffic distribution</DialogTitle>
            <DialogContent className={styles.manageDialogContent}>
              {/* Live traffic bar */}
              <div className={styles.trafficBar}>
                {deploymentSlots
                  .filter(s => traffic[s.name] > 0)
                  .map((slot) => (
                  <div
                    key={slot.name}
                    className={styles.trafficBarChunk}
                    style={{
                      width: `${traffic[slot.name]}%`,
                      backgroundColor: slot.isProduction ? tokens.colorBrandBackground : tokens.colorPalettePurpleBackground2,
                    }}
                  >
                    {traffic[slot.name] >= 15 && `${slot.name} ${traffic[slot.name]}%`}
                  </div>
                ))}
              </div>

              {deploymentSlots.map((slot) => (
                <div key={slot.name} className={styles.manageTrafficRow}>
                  <div className={styles.manageTrafficSlotInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                      <Subtitle2>{slot.name}</Subtitle2>
                      {slot.isProduction && (
                        <Badge size="small" color="brand" appearance="tint">PRODUCTION</Badge>
                      )}
                    </div>
                    {slot.lastDeployment && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          {slot.lastDeployment.commitId?.slice(0, 7)}{' '}
                          {(slot.lastDeployment.commitMessage ?? slot.lastDeployment.message).length > 40
                            ? `${(slot.lastDeployment.commitMessage ?? slot.lastDeployment.message).slice(0, 40)}\u2026`
                            : (slot.lastDeployment.commitMessage ?? slot.lastDeployment.message)}
                        </Text>
                        <StatusBadge status={slot.lastDeployment.status} />
                      </div>
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
                </div>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setManageSlotsDialogOpen(false)}>Close</Button>
              <Button appearance="primary" onClick={() => setManageSlotsDialogOpen(false)}>Save</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Add slot dialog ────────────────────────────────── */}
      <Dialog open={addSlotDialogOpen} onOpenChange={(_, data) => { if (!data.open) setAddSlotDialogOpen(false); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Add slot</DialogTitle>
            <DialogContent className={styles.detailContent}>
              <div className={styles.credField}>
                <Label htmlFor="slot-name">Name</Label>
                <Input
                  id="slot-name"
                  value={newSlotName}
                  onChange={(_, data) => setNewSlotName(data.value)}
                  placeholder="Enter slot name"
                />
                {newSlotName === '' && (
                  <Text size={200} style={{ color: tokens.colorPaletteRedForeground1 }}>
                    The value must not be empty.
                  </Text>
                )}
              </div>
              <div className={styles.credField}>
                <Label>Clone settings from:</Label>
                <Dropdown
                  value={cloneFrom}
                  selectedOptions={[cloneFrom]}
                  onOptionSelect={(_, data) => { if (data.optionValue) setCloneFrom(data.optionValue); }}
                >
                  <Option value="Do not clone settings">Do not clone settings</Option>
                  <Option value={webApp.name}>{webApp.name}</Option>
                  {deploymentSlots.filter(s => !s.isProduction).map(s => (
                    <Option key={s.name} value={`${webApp.name}-${s.name}`} text={`${webApp.name}-${s.name}`}>{webApp.name}-{s.name}</Option>
                  ))}
                </Dropdown>
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                disabled={newSlotName === ''}
                onClick={() => setAddSlotDialogOpen(false)}
              >
                Add
              </Button>
              <Button onClick={() => setAddSlotDialogOpen(false)}>Close</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Activity log dialog ────────────────────────────── */}
      <Dialog open={activityLogOpen} onOpenChange={(_, data) => setActivityLogOpen(data.open)}>
        <DialogSurface className={styles.activityDialogSurface}>
          <DialogBody>
            <DialogTitle>Activity log</DialogTitle>
            <DialogContent>
              <table className={styles.activityTable}>
                <thead>
                  <tr>
                    <th className={styles.activityTh}>Operation name</th>
                    <th className={styles.activityTh}>Status</th>
                    <th className={styles.activityTh}>Time</th>
                    <th className={styles.activityTh}>Time stamp</th>
                    <th className={styles.activityTh}>Subscription</th>
                    <th className={styles.activityTh}>Event initiated by</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log, i) => (
                    <tr key={i}>
                      <td className={styles.activityTd}>
                        <div className={styles.activityOperationCell}>
                          <Info16Regular color={tokens.colorBrandForeground1} />
                          <Text size={200}>{log.operation}</Text>
                        </div>
                      </td>
                      <td className={styles.activityTd}>{log.status}</td>
                      <td className={styles.activityTd}>{log.time}</td>
                      <td className={styles.activityTd}>{log.timestamp}</td>
                      <td className={styles.activityTd}>
                        <Link href="#" onClick={(e) => e.preventDefault()}>{webApp.subscriptionName}</Link>
                      </td>
                      <td className={styles.activityTd}>{log.initiatedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={() => setActivityLogOpen(false)}>Close</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Deploy confirmation dialog ──────────────────────── */}
      <Dialog open={deployDialogOpen} onOpenChange={(_, data) => setDeployDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Start deployment?</DialogTitle>
            <DialogContent>
              <Text>This will cancel any deployment currently in progress.</Text>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeployDialogOpen(false)}>Cancel</Button>
              <Button appearance="primary" onClick={() => setDeployDialogOpen(false)}>Deploy</Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Disconnect confirmation dialog ─────────────────── */}
      <Dialog open={disconnectDialogOpen} onOpenChange={(_, data) => setDisconnectDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Disconnect deployment source?</DialogTitle>
            <DialogContent>
              <Text>
                This will disconnect <Text weight="semibold">{currentSource?.githubOrg}/{currentSource?.githubRepo}</Text> from
                this app. Existing deployments will not be affected, but new pushes will no longer trigger deployments.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDisconnectDialogOpen(false)}>Cancel</Button>
              <Button appearance="primary" className={styles.disconnectBtn} onClick={confirmDisconnect}>
                Disconnect
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Top row: Source card + Slots overview ──────────── */}
      <div className={styles.topRow}>
        {/* ── Source card / disconnected state ────────────────── */}
        {isDisconnected ? (
        <div className={styles.sourceCard}>
        <div className={styles.sourceLeft}>
          <div className={styles.sourceIcon}>
            <Settings24Regular />
          </div>
          <div className={styles.sourceDetails}>
            <Text className={styles.sourceRepo}>No deployment source</Text>
            <Text style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
              You do not currently have a deployment source configured.
            </Text>
          </div>
        </div>
        <div className={styles.sourceActions}>
          <Button
            appearance="primary"
            icon={<Settings24Regular />}
            onClick={() => {
              setShowSetup(true);
              setSelectedSource(null);
              setIsDisconnected(false);
            }}
          >
            Choose source
          </Button>
        </div>
      </div>
      ) : (
      <div className={styles.sourceCard}>
        <div className={styles.sourceLeft}>
          <div className={styles.sourceIcon}>
            <BranchFork24Regular />
          </div>
          <div className={styles.sourceDetails}>
            <Text className={styles.sourceRepo}>
              {currentSource?.githubOrg}/{currentSource?.githubRepo}
            </Text>
            <div className={styles.sourceMeta}>
              <Link href={currentSource?.repoUrl} target="_blank" appearance="subtle">
                {currentSource?.githubBranch}
              </Link>
              <span className={styles.dot} />
              <span>GitHub Actions</span>
              <span className={styles.dot} />
              <span>{webApp.runtimeStack}</span>
            </div>
            <Link href={currentSlotUrl} target="_blank" appearance="subtle" style={{ fontSize: tokens.fontSizeBase200 }}>
              {currentSlotUrl}
            </Link>
          </div>
        </div>
        <div className={styles.sourceActions}>
          <Button appearance="primary" icon={<Rocket24Regular />} onClick={() => setDeployDialogOpen(true)}>
            Deploy
          </Button>
          <Button
            appearance="primary"
            className={styles.disconnectBtn}
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </div>
      )}

        {/* ── Slots overview card ──────────────────────────────── */}
        <div className={styles.slotsOverviewCard}>
          <div className={styles.slotsOverviewHeader}>
            <LayerDiagonal24Regular />
            <Text weight="semibold" size={400}>Slots overview</Text>
          </div>

          {/* Traffic bar */}
          <div className={styles.trafficBar}>
            {deploymentSlots
              .filter(s => traffic[s.name] > 0)
              .map((slot) => (
              <div
                key={slot.name}
                className={styles.trafficBarChunk}
                style={{
                  width: `${traffic[slot.name]}%`,
                  backgroundColor: slot.isProduction ? tokens.colorBrandBackground : tokens.colorPalettePurpleBackground2,
                }}
              >
                {traffic[slot.name] >= 15 && `${slot.name} ${traffic[slot.name]}%`}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className={styles.slotsLegend}>
            {deploymentSlots.map(slot => (
              <div key={slot.name} className={styles.slotListItem}>
                <span
                  className={mergeClasses(
                    styles.statusDotSmall,
                    slot.status === 'Running' ? styles.statusDotRunning : styles.statusDotStopped,
                  )}
                />
                <Text size={200} weight="semibold">{slot.name}</Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  {traffic[slot.name]}%
                </Text>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hero row: Latest deployment + Sidecar containers ── */}
      <div className={styles.heroRow}>
        {/* ── Latest deployment hero ─────────────────────────── */}
        {latestDeployment ? (
          <div
            className={styles.heroCard}
            onClick={() => setDeploymentDetailId(latestDeployment.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') setDeploymentDetailId(latestDeployment.id);
            }}
          >
            <div className={styles.heroTop}>
              <div className={styles.heroBody}>
                <Text className={styles.heroLabel}>Latest Deployment</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                {latestDeployment.commitId && (
                  <Tooltip content={`Commit ${latestDeployment.commitId}`} relationship="description">
                    <Link
                      href={`https://github.com/${currentSource?.githubOrg}/${currentSource?.githubRepo}/commit/${latestDeployment.commitId}`}
                      target="_blank"
                      className={styles.commitHash}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {latestDeployment.commitId.slice(0, 7)}
                    </Link>
                  </Tooltip>
                )}
                <Link
                  href={latestDeployment.commitId
                    ? `https://github.com/${currentSource?.githubOrg}/${currentSource?.githubRepo}/commit/${latestDeployment.commitId}`
                    : undefined}
                  target="_blank"
                  appearance="subtle"
                  className={styles.heroMessage}
                  onClick={(e) => e.stopPropagation()}
                >
                  {latestDeployment.commitMessage ?? latestDeployment.message}
                </Link>
              </div>
              <div className={styles.heroMeta}>
                <span>{latestDeployment.author}</span>
                <span className={styles.dot} />
                <StatusBadge status={latestDeployment.status} />
                <span className={styles.dot} />
                <Tooltip content={latestDeployment.timestamp} relationship="description">
                  <span>Deployed {formatRelativeTime(latestDeployment.timestamp)}</span>
                </Tooltip>
                {latestDeployment.durationSeconds != null && (
                  <>
                    <span className={styles.dot} />
                    <span>{formatDuration(latestDeployment.durationSeconds)}</span>
                  </>
                )}
              </div>
              {latestDeployment.phases && (
                <DeploymentPhasePills phases={latestDeployment.phases} />
              )}
            </div>
            <span className={styles.chevronCell}>
              <ChevronRight24Regular />
            </span>
          </div>
          </div>
        ) : (
          <div className={styles.heroCard}>
            <div className={styles.heroEmptyState}>
              <span className={styles.heroEmptyIcon}>
                <Cloud24Regular />
              </span>
              <div className={styles.heroEmptyText}>
                <Text className={styles.heroLabel}>Latest Deployment</Text>
                <Text className={styles.heroMessage}>
                  You don&apos;t currently have any deployments on this slot.
                </Text>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                  Deploy to this slot to see the latest run details and history here.
                </Text>
              </div>
            </div>
          </div>
        )}

        {/* ── Sidecar containers card ─────────────────────────── */}
        <div className={styles.sidecarCard}>
          <div className={styles.sidecarHeader}>
            <div className={styles.sidecarTitleRow}>
              <span className={styles.sidecarIcon}><Box24Regular /></span>
              <Text weight="semibold" size={400}>Sidecar containers</Text>
              <Badge appearance="tint" color="informative" size="small">
                {currentSidecars.length}
              </Badge>
            </div>
            <Button appearance="primary" size="small" icon={<Add24Regular />}>
              Add
            </Button>
          </div>

          <Text className={styles.sidecarDescription}>
            Enhance site functionality by adding sidecar containers.{' '}
            <Link href="https://learn.microsoft.com/azure/app-service/tutorial-custom-container-sidecar" target="_blank">
              Learn more
            </Link>
          </Text>

          <Divider />

          <table className={styles.sidecarTable}>
            <thead>
              <tr>
                <th className={styles.sidecarTh}>Name</th>
                <th className={styles.sidecarTh}>Port</th>
                <th className={styles.sidecarTh}>Image</th>
                <th className={styles.sidecarTh}>Tag</th>
                <th className={styles.sidecarTh} />
              </tr>
            </thead>
            <tbody>
              {currentSidecars.map((sc) => (
                <tr key={sc.name}>
                  <td className={styles.sidecarTd}>
                    <Link
                      href="#"
                      className={styles.sidecarCellMono}
                      onClick={(e) => { e.preventDefault(); setSidecarEditDialog(sc.name); }}
                    >
                      {sc.name}
                    </Link>
                  </td>
                  <td className={styles.sidecarTd}>{sc.port}</td>
                  <td className={styles.sidecarTd}>
                    <Text className={styles.sidecarCellMono} title={sc.image}>{sc.image}</Text>
                  </td>
                  <td className={styles.sidecarTd}>
                    <Text className={styles.sidecarCellMono} title={sc.tag}>{sc.tag}</Text>
                  </td>
                  <td className={styles.sidecarTd}>
                    <div className={styles.sidecarActions}>
                      <Tooltip content="View logs" relationship="label">
                        <Button
                          appearance="subtle"
                          icon={<TextDescription24Regular />}
                          size="small"
                          onClick={() => setSidecarLogDialog(sc.name)}
                        />
                      </Tooltip>
                      <Tooltip content="Delete container" relationship="label">
                        <Button
                          appearance="subtle"
                          icon={<Delete24Regular />}
                          size="small"
                        />
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Sidecar logs dialog ──────────────────────────────── */}
        <Dialog open={sidecarLogDialog !== null} onOpenChange={(_, data) => { if (!data.open) setSidecarLogDialog(null); }}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Logs — {sidecarLogDialog}</DialogTitle>
              <DialogContent>
                <pre className={styles.sidecarLogPre}>
{`[2026-03-26T14:22:01Z] Starting container ${sidecarLogDialog ?? ''}...
[2026-03-26T14:22:02Z] Pulling image from registry...
[2026-03-26T14:22:05Z] Image pulled successfully.
[2026-03-26T14:22:06Z] Container ${sidecarLogDialog ?? ''} started on port ${currentSidecars.find(s => s.name === sidecarLogDialog)?.port ?? '?'}.
[2026-03-26T14:22:06Z] Health check passed.
[2026-03-26T14:22:10Z] Listening for incoming requests...
[2026-03-26T14:23:44Z] GET /health 200 2ms
[2026-03-26T14:25:12Z] POST /collect 200 14ms
[2026-03-26T14:27:33Z] GET /health 200 1ms`}
                </pre>
              </DialogContent>
              <DialogActions>
                <Button appearance="primary" onClick={() => setSidecarLogDialog(null)}>Close</Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        {/* ── Sidecar edit dialog ──────────────────────────────── */}
        <Dialog open={sidecarEditDialog !== null} onOpenChange={(_, data) => { if (!data.open) setSidecarEditDialog(null); }}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Edit container — {sidecarEditDialog}</DialogTitle>
              <DialogContent className={styles.sidecarEditForm}>
                {(() => {
                  const sc = currentSidecars.find(s => s.name === sidecarEditDialog);
                  if (!sc) return null;
                  return (
                    <>
                      <div className={styles.credField}>
                        <Label>Name</Label>
                        <Input defaultValue={sc.name} />
                      </div>
                      <div className={styles.credField}>
                        <Label>Image source</Label>
                        <Input defaultValue={sc.source} readOnly />
                      </div>
                      <div className={styles.credField}>
                        <Label>Image</Label>
                        <Input defaultValue={sc.image} />
                      </div>
                      <div className={styles.credField}>
                        <Label>Tag</Label>
                        <Input defaultValue={sc.tag} />
                      </div>
                      <div className={styles.credField}>
                        <Label>Port</Label>
                        <Input defaultValue={String(sc.port)} />
                      </div>
                    </>
                  );
                })()}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSidecarEditDialog(null)}>Cancel</Button>
                <Button appearance="primary" onClick={() => setSidecarEditDialog(null)}>Save</Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>

      {latestDeployment && (
        <>
          <Divider />

          {/* ── Recent deployments ─────────────────────────────── */}
          <div className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>Recent deployments</Text>
            <Badge appearance="tint" color="informative" size="small">
              {recentDeployments.length}
            </Badge>
          </div>

          <div className={styles.deploymentsTableScroll}>
            <table className={styles.deploymentsTable}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Deployment</th>
                  <th className={styles.th}>Time</th>
                  <th className={styles.th}>Duration</th>
                  <th className={styles.th} />
                </tr>
              </thead>
              <tbody>
                {recentDeployments.slice(0, visibleCount).map(entry => (
                  <tr
                    key={entry.id}
                    className={styles.tableRow}
                    onClick={() => setDeploymentDetailId(entry.id)}
                  >
                    <td className={styles.td}>
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className={styles.td}>
                      <div className={styles.deploymentCell}>
                        <div className={styles.deploymentFirstLine}>
                          {entry.commitId && (
                            <Link
                              href={`https://github.com/${currentSource?.githubOrg}/${currentSource?.githubRepo}/commit/${entry.commitId}`}
                              target="_blank"
                              className={styles.commitHash}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {entry.commitId.slice(0, 7)}
                            </Link>
                          )}
                          <Text className={styles.deploymentMessage}>
                            {(entry.commitMessage ?? entry.message).length > 72
                              ? `${(entry.commitMessage ?? entry.message).slice(0, 72)}\u2026`
                              : (entry.commitMessage ?? entry.message)}
                          </Text>
                          <Text className={styles.deploymentAuthor}>by {entry.author}</Text>
                        </div>
                        {entry.phases && (
                          <DeploymentPhasePills phases={entry.phases} />
                        )}
                      </div>
                    </td>
                    <td className={mergeClasses(styles.td, styles.timeCell)}>
                      <Tooltip content={entry.timestamp} relationship="description">
                        <span>{formatRelativeTime(entry.timestamp)}</span>
                      </Tooltip>
                    </td>
                    <td className={mergeClasses(styles.td, styles.durationCell)}>
                      {entry.durationSeconds != null
                        ? formatDuration(entry.durationSeconds)
                        : '—'}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.chevronCell}>
                        <ChevronRight24Regular />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {visibleCount < recentDeployments.length && (
            <Button
              appearance="subtle"
              onClick={() => setVisibleCount(prev => prev + 5)}
            >
              Load more ({recentDeployments.length - visibleCount} remaining)
            </Button>
          )}
        </>
      )}

      {/* ── Deployment detail dialog ───────────────────────── */}
      <Dialog
        open={deploymentDetailId !== null}
        onOpenChange={(_, data) => { if (!data.open) setDeploymentDetailId(null); }}
      >
        <DialogSurface className={styles.detailDialogSurface}>
          <DialogBody>
            {(() => {
              const detail = filteredDeployments.find(d => d.id === deploymentDetailId);
              if (!detail) return null;
              return (
                <>
                  <DialogTitle>
                    {detail.commitMessage ?? detail.message}
                  </DialogTitle>
                  <DialogContent className={styles.detailContent}>
                    <div className={styles.detailMeta}>
                      <StatusBadge status={detail.status} />
                      <span>{detail.author}</span>
                      {detail.commitId && (
                        <Link
                          href={`https://github.com/${currentSource?.githubOrg}/${currentSource?.githubRepo}/commit/${detail.commitId}`}
                          target="_blank"
                          className={styles.commitHash}
                        >
                          {detail.commitId.slice(0, 7)}
                        </Link>
                      )}
                      <Tooltip content={detail.timestamp} relationship="description">
                        <span>{formatRelativeTime(detail.timestamp)}</span>
                      </Tooltip>
                      {detail.durationSeconds != null && (
                        <span>{formatDuration(detail.durationSeconds)}</span>
                      )}
                    </div>
                    {detail.phases && (
                      <>
                        <Text weight="semibold">Steps</Text>
                        <DeploymentPhasePills phases={detail.phases} />
                      </>
                    )}
                    {detail.deploymentLogs ? (
                      <>
                        <Text weight="semibold">Log details</Text>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          Deployment ID: {detail.id}
                        </Text>
                        <DeploymentLogTable logs={detail.deploymentLogs} deploymentId={detail.id} />
                      </>
                    ) : detail.buildLogs ? (
                      <>
                        <Text weight="semibold">Logs</Text>
                        <div className={styles.detailLogsScroll}>
                          <StreamingLogViewer
                            logs={detail.buildLogs}
                            isStreaming={detail.status === 'InProgress'}
                          />
                        </div>
                      </>
                    ) : null}
                  </DialogContent>
                  <DialogActions>
                    <Button appearance="primary" onClick={() => setDeploymentDetailId(null)}>
                      Close
                    </Button>
                  </DialogActions>
                </>
              );
            })()}
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── FTPS credentials dialog────────────────────────── */}
      <Dialog open={ftpsDialogOpen} onOpenChange={(_, data) => setFtpsDialogOpen(data.open)}>
        <DialogSurface className={styles.ftpsDialogSurface}>
          <DialogBody>
            <DialogTitle>FTPS credentials</DialogTitle>
            <DialogContent className={styles.ftpsContent}>
              {/* Warning banner */}
              {!ftpsCredentials.isEnabled && (
                <MessageBar intent="warning">
                  <MessageBarBody>
                    <MessageBarTitle>FTP authentication is disabled</MessageBarTitle>
                    FTP authentication has been disabled for this web app. You will not be able to authenticate using these credentials.{' '}
                    <Link href="https://learn.microsoft.com/azure/app-service/deploy-ftp" target="_blank">Learn more</Link>
                  </MessageBarBody>
                </MessageBar>
              )}

              {/* Intro text */}
              <Text className={styles.ftpsDescription}>
                App Service supports multiple technologies to access, publish and modify the content of your app. FTPS credentials can be scoped to the application or the user.{' '}
                <Link href="https://learn.microsoft.com/azure/app-service/deploy-ftp" target="_blank">Learn more</Link>
              </Text>

              {/* FTPS endpoint */}
              <div className={styles.ftpsFieldRow}>
                <Text className={styles.ftpsFieldLabel}>FTPS endpoint</Text>
                <Input value={ftpsCredentials.endpoint} readOnly />
                <Tooltip content="Copy" relationship="label">
                  <Button
                    appearance="subtle"
                    icon={<Copy24Regular />}
                    size="small"
                    onClick={() => navigator.clipboard.writeText(ftpsCredentials.endpoint)}
                  />
                </Tooltip>
              </div>

              <Divider />

              {/* Application-scope */}
              <Text className={styles.ftpsSectionHeading}>Application-scope</Text>
              <Text className={styles.ftpsSectionDescription}>
                Application-scope credentials are auto-generated and provide access only to this specific app or deployment slot.
                These credentials can be used with FTPS, Local Git and WebDeploy. They cannot be configured manually, but can be reset anytime.
              </Text>

              <div className={styles.ftpsFieldRow}>
                <Text className={styles.ftpsFieldLabel}>FTPS username</Text>
                <Input value={ftpsCredentials.appScopeUsername} readOnly />
                <Tooltip content="Copy" relationship="label">
                  <Button
                    appearance="subtle"
                    icon={<Copy24Regular />}
                    size="small"
                    onClick={() => navigator.clipboard.writeText(ftpsCredentials.appScopeUsername)}
                  />
                </Tooltip>
              </div>
              <div className={styles.ftpsFieldRow}>
                <Text className={styles.ftpsFieldLabel}>Password</Text>
                <Input type="password" value={ftpsCredentials.appScopePassword} readOnly />
                <Tooltip content="Copy" relationship="label">
                  <Button
                    appearance="subtle"
                    icon={<Copy24Regular />}
                    size="small"
                    onClick={() => navigator.clipboard.writeText(ftpsCredentials.appScopePassword)}
                  />
                </Tooltip>
              </div>
              <Button appearance="subtle" icon={<ArrowCounterclockwise24Regular />} size="small">
                Reset
              </Button>

              <Divider />

              {/* User-scope */}
              <Text className={styles.ftpsSectionHeading}>User-scope</Text>
              <Text className={styles.ftpsSectionDescription}>
                User-scope credentials are defined by you, the user, and can be used with all the apps to which you have access.
                These credentials can be used with FTPS, Local Git and WebDeploy. Authenticating to an FTPS endpoint using user-level credentials
                requires a username in the following format: '{webApp.name}\(your username)'. Authenticating with Git requires only
                the username '(your username)' defined below.
              </Text>

              <div className={styles.ftpsFieldRow}>
                <Text className={styles.ftpsFieldLabel}>Username</Text>
                <Input value={ftpsCredentials.userScopeUsername} />
                <span />
              </div>
              <div className={styles.ftpsFieldRow}>
                <Text className={styles.ftpsFieldLabel}>Password</Text>
                <Input type="password" placeholder="Enter password" />
                <span />
              </div>
              <div className={styles.ftpsFieldRow}>
                <Text className={styles.ftpsFieldLabel}>Confirm password</Text>
                <Input type="password" placeholder="Confirm password" />
                <span />
              </div>
              <Button appearance="subtle" icon={<ArrowCounterclockwise24Regular />} size="small">
                Reset
              </Button>
              <div className={styles.ftpsFooter}>
                <Button icon={<ArrowDownload24Regular />}>
                  Download publish profile
                </Button>
                <div className={styles.ftpsActionsRight}>
                  <Button onClick={() => setFtpsDialogOpen(false)}>Discard</Button>
                  <Button appearance="primary" onClick={() => setFtpsDialogOpen(false)}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>

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
                      {opt.manual && (
                        <Badge appearance="outline" color="informative" size="small">
                          Manual
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
