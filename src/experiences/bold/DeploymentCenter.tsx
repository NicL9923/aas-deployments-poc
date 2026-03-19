import { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Card,
  CardHeader,
  Button,
  Badge,
  Body1,
  Body2,
  Caption1,
  Subtitle1,
  Subtitle2,
  Title3,
  ProgressBar,
  Divider,
  Switch,
  Combobox,
  Option,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  mergeClasses,
} from '@fluentui/react-components';
import {
  BranchFork24Regular,
  Rocket24Regular,
  Open24Regular,
  Settings24Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
  LinkDismiss24Regular,
  Code24Regular,
  Eye20Regular,
  EyeOff20Regular,
  Copy20Regular,
  PlugConnected24Regular,
  CloudArrowUp24Regular,
  Globe24Regular,
} from '@fluentui/react-icons';
import type { DeploymentEntry, DeploymentSourceType } from '../../types';
import {
  deploymentSource,
  deploymentHistory,
  availableOrgs,
  availableRepos,
  availableBranches,
} from '../../mock-data';
import { StatusBadge } from '../../components/shared/StatusBadge';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatRelativeTime(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDuration(sec?: number): string {
  if (!sec) return '--';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const pulseKeyframes = {
  '0%': { opacity: 1 },
  '50%': { opacity: 0.4 },
  '100%': { opacity: 1 },
};

const shimmerKeyframes = {
  '0%': { transform: 'translateX(-100%)' },
  '100%': { transform: 'translateX(100%)' },
};

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXL,
    maxWidth: '960px',
  },

  /* Source card */
  sourceCard: {
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXL),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
  },
  sourceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    flexWrap: 'wrap',
  },
  sourceIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    flexShrink: 0,
  },
  sourceDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    flexGrow: 1,
    minWidth: 0,
  },
  sourceMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
    ...shorthands.padding(tokens.spacingVerticalXXS, tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase200,
    fontFamily: tokens.fontFamilyMonospace,
  },

  /* Hero deployment card */
  heroCard: {
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXL),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow8,
    borderLeft: `4px solid ${tokens.colorBrandBackground}`,
    cursor: 'pointer',
    transitionDuration: tokens.durationNormal,
    transitionProperty: 'box-shadow',
    ':hover': {
      boxShadow: tokens.shadow16,
    },
  },
  heroTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  heroInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    minWidth: 0,
    flexGrow: 1,
  },
  heroMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  progressShimmer: {
    marginTop: tokens.spacingVerticalM,
    position: 'relative',
    overflow: 'hidden',
    height: '4px',
    ...shorthands.borderRadius('2px'),
    backgroundColor: tokens.colorNeutralBackground3,
  },
  shimmerBar: {
    position: 'absolute',
    top: '0',
    left: '0',
    height: '100%',
    width: '60%',
    ...shorthands.borderRadius('2px'),
    backgroundColor: tokens.colorBrandBackground,
    animationName: shimmerKeyframes,
    animationDuration: '1.5s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },

  /* Timeline */
  timelineSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  timelineItem: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    overflow: 'hidden',
    transitionDuration: tokens.durationNormal,
    transitionProperty: 'box-shadow',
    ':hover': {
      boxShadow: tokens.shadow8,
    },
  },
  timelineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    cursor: 'pointer',
  },
  borderSuccess: { borderLeft: `3px solid ${tokens.colorPaletteGreenBorder2}` },
  borderFailed: { borderLeft: `3px solid ${tokens.colorPaletteRedBorder2}` },
  borderInProgress: { borderLeft: `3px solid ${tokens.colorBrandStroke1}` },
  borderPending: { borderLeft: `3px solid ${tokens.colorPaletteYellowBorder2}` },
  borderCanceled: { borderLeft: `3px solid ${tokens.colorNeutralStroke2}` },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    flexShrink: 0,
  },
  timelineDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    flexGrow: 1,
    minWidth: 0,
  },
  timelineMessage: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  timelineRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexShrink: 0,
  },
  pulsingDot: {
    width: '8px',
    height: '8px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: tokens.colorBrandBackground,
    animationName: pulseKeyframes,
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
  },

  /* Build logs */
  logsBlock: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    backgroundColor: tokens.colorNeutralBackground6,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    color: tokens.colorNeutralForeground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },

  /* Quick actions */
  actionsRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },

  /* Credentials */
  credentialsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  credentialField: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  credInput: {
    flexGrow: 1,
  },
  dialogSurface: {
    maxWidth: '720px',
  },
  chipIconSmall: {
    fontSize: '14px',
  },
  heroProgress: {
    marginTop: tokens.spacingVerticalM,
  },
  heroLogsInline: {
    marginTop: tokens.spacingVerticalM,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    borderTop: 'none',
  },
  credLabel: {
    minWidth: '120px',
    fontWeight: tokens.fontWeightSemibold,
  },

  /* Setup overlay */
  setupOverlay: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
  },
  sourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: tokens.spacingHorizontalL,
  },
  sourceOptionCard: {
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalS,
    textAlign: 'center',
    transitionDuration: tokens.durationNormal,
    transitionProperty: 'box-shadow, border-color',
    ...shorthands.border('2px', 'solid', tokens.colorNeutralStroke2),
    ':hover': {
      boxShadow: tokens.shadow8,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  sourceOptionSelected: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: tokens.shadow8,
  },
  sourceOptionIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    fontSize: '24px',
  },
  configForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
});

/* ------------------------------------------------------------------ */
/*  Source option definitions                                          */
/* ------------------------------------------------------------------ */

interface SourceOption {
  type: DeploymentSourceType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const sourceOptions: SourceOption[] = [
  { type: 'github', name: 'GitHub', description: 'CI/CD with GitHub Actions', icon: <BranchFork24Regular /> },
  { type: 'azureRepos', name: 'Azure Repos', description: 'Azure DevOps Pipelines', icon: <Code24Regular /> },
  { type: 'bitbucket', name: 'Bitbucket', description: 'Bitbucket Pipelines', icon: <BranchFork24Regular /> },
  { type: 'localGit', name: 'Local Git', description: 'Push from local repo', icon: <PlugConnected24Regular /> },
  { type: 'externalGit', name: 'External Git', description: 'Any Git repository', icon: <Globe24Regular /> },
  { type: 'publishFiles', name: 'Publish Files', description: 'Upload ZIP or folder', icon: <CloudArrowUp24Regular /> },
];

/* ------------------------------------------------------------------ */
/*  Status-to-border-class map                                        */
/* ------------------------------------------------------------------ */

function useBorderClass(status: string, styles: ReturnType<typeof useStyles>): string {
  switch (status) {
    case 'Success': return styles.borderSuccess;
    case 'Failed': return styles.borderFailed;
    case 'InProgress': return styles.borderInProgress;
    case 'Pending': return styles.borderPending;
    default: return styles.borderCanceled;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const BoldDeploymentCenter = () => {
  const styles = useStyles();

  // State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showSetup, setShowSetup] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Setup wizard state
  const [selectedSourceType, setSelectedSourceType] = useState<DeploymentSourceType>('github');
  const [selectedOrg, setSelectedOrg] = useState(availableOrgs[0]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const latestDeployment = deploymentHistory[0];
  const recentDeployments = deploymentHistory.slice(1);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reposForOrg = useMemo(
    () => availableRepos[selectedOrg] ?? [],
    [selectedOrg],
  );

  /* ---------------------------------------------------------------- */
  /*  Timeline item                                                    */
  /* ---------------------------------------------------------------- */

  const TimelineItem = ({ entry }: { entry: DeploymentEntry }) => {
    const expanded = expandedIds.has(entry.id);
    const borderClass = useBorderClass(entry.status, styles);

    return (
      <div className={mergeClasses(styles.timelineItem, borderClass)}>
        <div className={styles.timelineRow} onClick={() => toggleExpand(entry.id)}>
          <div className={styles.avatar}>{entry.author[0].toUpperCase()}</div>
          <div className={styles.timelineDetails}>
            <Body1 className={styles.timelineMessage}>{entry.message}</Body1>
            <Caption1>
              {entry.author} · {formatRelativeTime(entry.timestamp)}
              {entry.durationSeconds ? ` · ${formatDuration(entry.durationSeconds)}` : ''}
            </Caption1>
          </div>
          <div className={styles.timelineRight}>
            {entry.status === 'InProgress' && <div className={styles.pulsingDot} />}
            <StatusBadge status={entry.status} />
            {expanded ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
          </div>
        </div>
        {expanded && entry.buildLogs && (
          <div className={styles.logsBlock}>
            {entry.buildLogs.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Setup Dialog                                                     */
  /* ---------------------------------------------------------------- */

  const SetupDialog = () => (
    <Dialog open={showSetup} onOpenChange={(_, d) => setShowSetup(d.open)}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle>Configure Deployment Source</DialogTitle>
          <DialogContent>
            <div className={styles.setupOverlay}>
              <div className={styles.sourceGrid}>
                {sourceOptions.map((opt) => (
                  <div
                    key={opt.type}
                    className={mergeClasses(
                      styles.sourceOptionCard,
                      selectedSourceType === opt.type && styles.sourceOptionSelected,
                    )}
                    onClick={() => setSelectedSourceType(opt.type)}
                  >
                    <div className={styles.sourceOptionIcon}>{opt.icon}</div>
                    <Subtitle2>{opt.name}</Subtitle2>
                    <Caption1>{opt.description}</Caption1>
                    {opt.type === 'github' && (
                      <Badge appearance="filled" color="brand" size="small">Recommended</Badge>
                    )}
                  </div>
                ))}
              </div>

              {selectedSourceType === 'github' && (
                <>
                  <Divider />
                  <div className={styles.configForm}>
                    <div className={styles.formField}>
                      <Body2>Organization</Body2>
                      <Combobox
                        placeholder="Search organizations..."
                        value={selectedOrg}
                        onOptionSelect={(_, d) => {
                          setSelectedOrg(d.optionValue ?? '');
                          setSelectedRepo('');
                        }}
                      >
                        {availableOrgs.map((org) => (
                          <Option key={org} value={org}>{org}</Option>
                        ))}
                      </Combobox>
                    </div>
                    <div className={styles.formField}>
                      <Body2>Repository</Body2>
                      <Combobox
                        placeholder="Search repositories..."
                        value={selectedRepo}
                        onOptionSelect={(_, d) => setSelectedRepo(d.optionValue ?? '')}
                      >
                        {reposForOrg.map((repo) => (
                          <Option key={repo} value={repo}>{repo}</Option>
                        ))}
                      </Combobox>
                    </div>
                    <div className={styles.formField}>
                      <Body2>Branch</Body2>
                      <Combobox
                        placeholder="Search branches..."
                        value={selectedBranch}
                        onOptionSelect={(_, d) => setSelectedBranch(d.optionValue ?? '')}
                      >
                        {availableBranches.map((b) => (
                          <Option key={b} value={b}>{b}</Option>
                        ))}
                      </Combobox>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setShowSetup(false)}>Cancel</Button>
            <Button appearance="primary" onClick={() => setShowSetup(false)}>Connect</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className={styles.root}>
      {/* Source Card */}
      <Card className={styles.sourceCard}>
        <div className={styles.sourceRow}>
          <div className={styles.sourceIcon}>
            <BranchFork24Regular />
          </div>
          <div className={styles.sourceDetails}>
            <Subtitle1>{deploymentSource.githubOrg}/{deploymentSource.githubRepo}</Subtitle1>
            <div className={styles.sourceMeta}>
              <span className={styles.chip}>
                <BranchFork24Regular className={styles.chipIconSmall} />
                {deploymentSource.githubBranch}
              </span>
              <span className={styles.chip}>GitHub Actions</span>
            </div>
          </div>
          <Button
            appearance="subtle"
            icon={<LinkDismiss24Regular />}
            onClick={() => setShowSetup(true)}
          >
            Disconnect
          </Button>
        </div>
      </Card>

      {/* Latest Deployment Hero */}
      <div>
        <div className={styles.sectionHeader}>
          <Title3>Latest Deployment</Title3>
        </div>
        <div
          className={styles.heroCard}
          onClick={() => toggleExpand(latestDeployment.id)}
        >
          <div className={styles.heroTop}>
            <div className={styles.heroInfo}>
              <Subtitle1>{latestDeployment.message}</Subtitle1>
              <div className={styles.heroMeta}>
                <div className={styles.avatar}>
                  {latestDeployment.author[0].toUpperCase()}
                </div>
                <Body1>{latestDeployment.author}</Body1>
                <Caption1>{formatRelativeTime(latestDeployment.timestamp)}</Caption1>
                {latestDeployment.commitId && (
                  <span className={styles.chip}>{latestDeployment.commitId}</span>
                )}
                {latestDeployment.durationSeconds && (
                  <Caption1>{formatDuration(latestDeployment.durationSeconds)}</Caption1>
                )}
              </div>
            </div>
            <StatusBadge status={latestDeployment.status} />
          </div>
          {latestDeployment.status === 'InProgress' && (
            <div className={styles.progressShimmer}>
              <div className={styles.shimmerBar} />
            </div>
          )}
          {latestDeployment.status !== 'InProgress' && latestDeployment.status === 'Success' && (
            <ProgressBar value={1} thickness="large" color="success" className={styles.heroProgress} />
          )}
          {expandedIds.has(latestDeployment.id) && latestDeployment.buildLogs && (
            <div className={mergeClasses(styles.logsBlock, styles.heroLogsInline)}>
              {latestDeployment.buildLogs.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.actionsRow}>
        <Button appearance="primary" icon={<Rocket24Regular />}>
          Trigger Deploy
        </Button>
        <Button
          appearance="outline"
          icon={<Open24Regular />}
          as="a"
          href={deploymentSource.repoUrl}
          target="_blank"
        >
          View on GitHub
        </Button>
        <Button
          appearance="subtle"
          icon={<Settings24Regular />}
          onClick={() => setShowSetup(true)}
        >
          Change Source
        </Button>
      </div>

      {/* Recent Deployments Timeline */}
      <div>
        <div className={styles.sectionHeader}>
          <Title3>Recent Deployments</Title3>
        </div>
        <div className={styles.timelineSection}>
          {recentDeployments.map((entry) => (
            <TimelineItem key={entry.id} entry={entry} />
          ))}
        </div>
      </div>

      {/* Legacy Credentials */}
      <Divider />
      <div className={styles.credentialsSection}>
        <Switch
          label="Show legacy FTPS credentials"
          checked={showCredentials}
          onChange={(_, d) => setShowCredentials(d.checked)}
        />
        {showCredentials && (
          <Card className={styles.sourceCard}>
            <CardHeader header={<Subtitle2>FTPS Credentials</Subtitle2>} />
            <div className={styles.credentialsSection}>
              <div className={styles.credentialField}>
                <Body2 className={styles.credLabel}>FTPS Endpoint</Body2>
                <Input
                  readOnly
                  value="ftps://waws-prod-eus-001.ftp.azurewebsites.windows.net"
                  className={styles.credInput}
                  contentAfter={<Button appearance="transparent" icon={<Copy20Regular />} size="small" />}
                />
              </div>
              <div className={styles.credentialField}>
                <Body2 className={styles.credLabel}>Username</Body2>
                <Input
                  readOnly
                  value="my-node-app-eastus\$my-node-app-eastus"
                  className={styles.credInput}
                  contentAfter={<Button appearance="transparent" icon={<Copy20Regular />} size="small" />}
                />
              </div>
              <div className={styles.credentialField}>
                <Body2 className={styles.credLabel}>Password</Body2>
                <Input
                  readOnly
                  type={showPassword ? 'text' : 'password'}
                  value="SuP3rS3cr3tP@ssw0rd!"
                  className={styles.credInput}
                  contentAfter={
                    <Button
                      appearance="transparent"
                      icon={showPassword ? <EyeOff20Regular /> : <Eye20Regular />}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPassword(!showPassword);
                      }}
                    />
                  }
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Setup Dialog */}
      <SetupDialog />
    </div>
  );
};
