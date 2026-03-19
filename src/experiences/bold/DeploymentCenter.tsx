import React, { useState } from 'react';
import type { DeploymentSourceType, DeploymentStatus } from '../../types';
import {
  deploymentSource,
  deploymentHistory,
  availableOrgs,
  availableRepos,
  availableBranches,
} from '../../mock-data';
import { StatusBadge } from '../../components/shared/StatusBadge';
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
} from '@fluentui/react-components';
import {
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

const formatRelativeTime = (timestamp: string): string => {
  const ms = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(Math.abs(ms) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
};

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

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

  // ── Build logs ──────────────────────────
  buildLogs: {
    marginTop: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackgroundInverted,
    color: tokens.colorNeutralForegroundInverted,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '300px',
    whiteSpace: 'pre',
  },

  // ── Quick actions ───────────────────────
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
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
});

// ─── Component ──────────────────────────────────────────────────────────────

export const BoldDeploymentCenter = () => {
  const styles = useStyles();

  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedSource, setSelectedSource] = useState<DeploymentSourceType | null>(null);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);

  const latestDeployment = deploymentHistory[0];
  const recentDeployments = deploymentHistory.slice(1);

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

  return (
    <div className={styles.root}>
      {/* ── Header ─────────────────────────────────────────── */}
      <Text className={styles.pageTitle} block>
        Deployment Center
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
                <span>{formatRelativeTime(latestDeployment.timestamp)}</span>
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
              </div>
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
            <pre className={styles.buildLogs}>
              {latestDeployment.buildLogs.join('\n')}
            </pre>
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
                    <span>{formatRelativeTime(entry.timestamp)}</span>
                    {entry.durationSeconds != null && (
                      <>
                        <span className={styles.dot} />
                        <span>{formatDuration(entry.durationSeconds)}</span>
                      </>
                    )}
                  </div>
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
                <pre className={styles.buildLogs}>
                  {entry.buildLogs.join('\n')}
                </pre>
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
