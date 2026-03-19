import { useCallback, useMemo, useState } from 'react';
import {
  makeStyles,
  tokens,
  mergeClasses,
  TabList,
  Tab,
  Dropdown,
  Option,
  OptionGroup,
  Combobox,
  Button,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  Tooltip,
  Divider,
  Label,
} from '@fluentui/react-components';
import {
  ArrowSyncRegular,
  DeleteRegular,
  ChevronDownRegular,
  ChevronRightRegular,
  CopyRegular,
  EyeRegular,
  EyeOffRegular,
  EditRegular,
  PlugDisconnectedRegular,
} from '@fluentui/react-icons';
import type { DeploymentSourceType, DeploymentStatus } from '../../types';
import {
  deploymentSource,
  deploymentHistory,
  availableOrgs,
  availableRepos,
  availableBranches,
} from '../../mock-data';
import { StatusBadge } from '../../components/shared/StatusBadge';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const sourceTypeLabels: Record<DeploymentSourceType, string> = {
  github: 'GitHub',
  azureRepos: 'Azure Repos',
  bitbucket: 'Bitbucket',
  localGit: 'Local Git',
  externalGit: 'External Git',
  publishFiles: 'Publish Files',
  none: 'Not configured',
};

const buildProviderLabels: Record<string, string> = {
  githubActions: 'GitHub Actions',
  azurePipelines: 'Azure Pipelines',
  kudu: 'Kudu',
  none: 'Not configured',
};

const statusFilterOptions: (DeploymentStatus | 'All')[] = [
  'All',
  'Success',
  'Failed',
  'InProgress',
  'Pending',
  'Canceled',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatRelativeTime = (timestamp: string): string => {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const formatDuration = (seconds?: number): string => {
  if (seconds == null) return '\u2014'; // em-dash
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles({
  // Layout
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    maxWidth: '960px',
  },
  tabContent: {
    paddingTop: tokens.spacingVerticalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },

  // Settings – shared form elements
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalXL}`,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  fieldLabel: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  fieldValue: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
    paddingTop: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXXS,
  },
  helperText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  buttonRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalS,
  },
  sourceDropdown: {
    minWidth: '240px',
    maxWidth: '320px',
  },
  branchField: {
    maxWidth: '320px',
  },

  // Logs – toolbar & table
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  toolbarSpacer: {
    flexGrow: 1,
  },
  filterDropdown: {
    minWidth: '160px',
  },
  table: {
    width: '100%',
  },
  colStatus: { width: '110px' },
  colAuthor: { width: '120px' },
  colTime: { width: '100px' },
  colDuration: { width: '90px' },
  colActions: { width: '56px' },
  tableRow: {
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  tableRowAlt: {
    backgroundColor: tokens.colorSubtleBackgroundHover,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  commitHash: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  expandedContent: {
    paddingLeft: tokens.spacingHorizontalXL,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
  },
  codeBlock: {
    backgroundColor: tokens.colorNeutralBackgroundInverted,
    color: tokens.colorNeutralForegroundInverted,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    overflowX: 'auto' as const,
    whiteSpace: 'pre' as const,
    marginTop: tokens.spacingVerticalXS,
  },
  emptyState: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },

  // FTPS credentials
  credentialSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  sectionHeader: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
  },
  inputWithAction: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: tokens.spacingHorizontalXS,
  },
  inputField: {
    flexGrow: 1,
  },

  // Danger-styled subtle button
  dangerButton: {
    color: tokens.colorPaletteRedForeground1,
    ':hover': {
      color: tokens.colorPaletteRedForeground2,
    },
  },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type TabValue = 'settings' | 'logs' | 'ftps';

export const SafeDeploymentCenter = () => {
  const styles = useStyles();

  // -- Tab ------------------------------------------------------------------
  const [selectedTab, setSelectedTab] = useState<TabValue>('settings');

  // -- Settings -------------------------------------------------------------
  const [isEditing, setIsEditing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [selectedSource, setSelectedSource] = useState<DeploymentSourceType>(
    deploymentSource.type,
  );
  const [selectedOrg, setSelectedOrg] = useState(deploymentSource.githubOrg ?? '');
  const [selectedRepo, setSelectedRepo] = useState(deploymentSource.githubRepo ?? '');
  const [selectedBranch, setSelectedBranch] = useState(deploymentSource.githubBranch ?? '');
  const [orgQuery, setOrgQuery] = useState(deploymentSource.githubOrg ?? '');
  const [repoQuery, setRepoQuery] = useState(deploymentSource.githubRepo ?? '');
  const [branchQuery, setBranchQuery] = useState(deploymentSource.githubBranch ?? '');

  // -- Logs -----------------------------------------------------------------
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<DeploymentStatus | 'All'>('All');

  // -- FTPS -----------------------------------------------------------------
  const [showAppPassword, setShowAppPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);

  // -- Derived values -------------------------------------------------------
  const orgRepos = useMemo(
    () => (selectedOrg ? (availableRepos[selectedOrg] ?? []) : []),
    [selectedOrg],
  );

  const filteredDeployments = useMemo(
    () =>
      statusFilter === 'All'
        ? deploymentHistory
        : deploymentHistory.filter((d) => d.status === statusFilter),
    [statusFilter],
  );

  const filteredOrgs = useMemo(
    () => availableOrgs.filter((o) => o.toLowerCase().includes(orgQuery.toLowerCase())),
    [orgQuery],
  );

  const filteredRepos = useMemo(
    () => orgRepos.filter((r) => r.toLowerCase().includes(repoQuery.toLowerCase())),
    [orgRepos, repoQuery],
  );

  const filteredBranches = useMemo(
    () => availableBranches.filter((b) => b.toLowerCase().includes(branchQuery.toLowerCase())),
    [branchQuery],
  );

  const showSetupForm = isEditing || !isConnected;

  // -- Handlers -------------------------------------------------------------
  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setSelectedSource(deploymentSource.type);
    setSelectedOrg(deploymentSource.githubOrg ?? '');
    setSelectedRepo(deploymentSource.githubRepo ?? '');
    setSelectedBranch(deploymentSource.githubBranch ?? '');
    setOrgQuery(deploymentSource.githubOrg ?? '');
    setRepoQuery(deploymentSource.githubRepo ?? '');
    setBranchQuery(deploymentSource.githubBranch ?? '');
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setIsEditing(false);
    setSelectedSource('none');
    setSelectedOrg('');
    setSelectedRepo('');
    setSelectedBranch('');
    setOrgQuery('');
    setRepoQuery('');
    setBranchQuery('');
  }, []);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    setIsConnected(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    if (!isConnected) {
      setSelectedSource(deploymentSource.type);
      setSelectedOrg(deploymentSource.githubOrg ?? '');
      setSelectedRepo(deploymentSource.githubRepo ?? '');
      setSelectedBranch(deploymentSource.githubBranch ?? '');
      setIsConnected(true);
    }
  }, [isConnected]);

  // =========================================================================
  // Settings Tab
  // =========================================================================
  const renderSettingsTab = () => (
    <div className={styles.tabContent}>
      {isConnected && !isEditing && (
        <MessageBar intent="info">
          <MessageBarBody>
            <MessageBarTitle>Continuous deployment active</MessageBarTitle>
            Continuous deployment is configured for this production slot. Pushes to
            the &lsquo;main&rsquo; branch will automatically trigger deployments.
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.formSection}>
        {/* Source selector */}
        <div className={styles.fieldGroup}>
          <Label className={styles.fieldLabel}>Source</Label>
          <Dropdown
            className={styles.sourceDropdown}
            disabled={!showSetupForm}
            selectedOptions={[selectedSource]}
            value={sourceTypeLabels[selectedSource]}
            onOptionSelect={(_, data) => {
              if (data.optionValue) {
                setSelectedSource(data.optionValue as DeploymentSourceType);
              }
            }}
          >
            <OptionGroup label="CI/CD sources">
              <Option value="github">GitHub</Option>
              <Option value="azureRepos">Azure Repos</Option>
              <Option value="bitbucket">Bitbucket</Option>
            </OptionGroup>
            <OptionGroup label="Manual methods">
              <Option value="localGit">Local Git</Option>
              <Option value="externalGit">External Git</Option>
              <Option value="publishFiles">Publish Files</Option>
            </OptionGroup>
          </Dropdown>
        </div>

        {/* ----- Connected read-only view ----- */}
        {!showSetupForm && (
          <>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <Label className={styles.fieldLabel}>Organization</Label>
                <Text className={styles.fieldValue}>{deploymentSource.githubOrg}</Text>
              </div>
              <div className={styles.fieldGroup}>
                <Label className={styles.fieldLabel}>Repository</Label>
                <Text className={styles.fieldValue}>{deploymentSource.githubRepo}</Text>
              </div>
              <div className={styles.fieldGroup}>
                <Label className={styles.fieldLabel}>Branch</Label>
                <Text className={styles.fieldValue}>{deploymentSource.githubBranch}</Text>
              </div>
              <div className={styles.fieldGroup}>
                <Label className={styles.fieldLabel}>Build provider</Label>
                <Text className={styles.fieldValue}>
                  {buildProviderLabels[deploymentSource.buildProvider]}
                </Text>
              </div>
            </div>

            <div className={styles.buttonRow}>
              <Button appearance="outline" icon={<EditRegular />} onClick={handleEdit}>
                Edit
              </Button>
              <Button
                appearance="subtle"
                icon={<PlugDisconnectedRegular />}
                className={styles.dangerButton}
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </>
        )}

        {/* ----- Setup / edit form (GitHub) ----- */}
        {showSetupForm && selectedSource === 'github' && (
          <>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <Label className={styles.fieldLabel}>Organization</Label>
                <Combobox
                  value={orgQuery}
                  selectedOptions={selectedOrg ? [selectedOrg] : []}
                  placeholder="Search organizations\u2026"
                  onOptionSelect={(_, data) => {
                    const val = data.optionValue ?? '';
                    setSelectedOrg(val);
                    setOrgQuery(data.optionText ?? val);
                    setSelectedRepo('');
                    setRepoQuery('');
                  }}
                  onChange={(e) => setOrgQuery((e.target as HTMLInputElement).value)}
                >
                  {filteredOrgs.map((org) => (
                    <Option key={org} value={org}>
                      {org}
                    </Option>
                  ))}
                </Combobox>
                <Text className={styles.helperText}>
                  The GitHub organization or user account that owns the repository
                </Text>
              </div>

              <div className={styles.fieldGroup}>
                <Label className={styles.fieldLabel}>Repository</Label>
                <Combobox
                  value={repoQuery}
                  selectedOptions={selectedRepo ? [selectedRepo] : []}
                  placeholder="Search repositories\u2026"
                  disabled={!selectedOrg}
                  onOptionSelect={(_, data) => {
                    const val = data.optionValue ?? '';
                    setSelectedRepo(val);
                    setRepoQuery(data.optionText ?? val);
                  }}
                  onChange={(e) => setRepoQuery((e.target as HTMLInputElement).value)}
                >
                  {filteredRepos.map((repo) => (
                    <Option key={repo} value={repo}>
                      {repo}
                    </Option>
                  ))}
                </Combobox>
                <Text className={styles.helperText}>
                  The repository containing the application source code
                </Text>
              </div>
            </div>

            <div className={mergeClasses(styles.fieldGroup, styles.branchField)}>
              <Label className={styles.fieldLabel}>Branch</Label>
              <Combobox
                value={branchQuery}
                selectedOptions={selectedBranch ? [selectedBranch] : []}
                placeholder="Search branches\u2026"
                disabled={!selectedRepo}
                onOptionSelect={(_, data) => {
                  const val = data.optionValue ?? '';
                  setSelectedBranch(val);
                  setBranchQuery(data.optionText ?? val);
                }}
                onChange={(e) => setBranchQuery((e.target as HTMLInputElement).value)}
              >
                {filteredBranches.map((branch) => (
                  <Option key={branch} value={branch}>
                    {branch}
                  </Option>
                ))}
              </Combobox>
              <Text className={styles.helperText}>
                Pushes to this branch will automatically trigger a deployment
              </Text>
            </div>

            <div className={styles.buttonRow}>
              <Button appearance="primary" onClick={handleSave}>
                Save
              </Button>
              <Button onClick={handleCancel}>Cancel</Button>
            </div>
          </>
        )}

        {/* Setup form for non-GitHub sources (placeholder) */}
        {showSetupForm && selectedSource !== 'github' && selectedSource !== 'none' && (
          <div className={styles.buttonRow}>
            <Button appearance="primary" onClick={handleSave}>
              Save
            </Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </div>
        )}
      </div>
    </div>
  );

  // =========================================================================
  // Logs Tab
  // =========================================================================
  const renderLogsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.toolbar}>
        <Button appearance="subtle" icon={<ArrowSyncRegular />}>
          Refresh
        </Button>
        <Button appearance="subtle" icon={<DeleteRegular />}>
          Clear
        </Button>
        <div className={styles.toolbarSpacer} />
        <Dropdown
          className={styles.filterDropdown}
          selectedOptions={[statusFilter]}
          value={statusFilter === 'All' ? 'All statuses' : statusFilter}
          onOptionSelect={(_, data) => {
            if (data.optionValue) {
              setStatusFilter(data.optionValue as DeploymentStatus | 'All');
            }
          }}
        >
          {statusFilterOptions.map((opt) => (
            <Option key={opt} value={opt}>
              {opt === 'All' ? 'All statuses' : opt}
            </Option>
          ))}
        </Dropdown>
      </div>

      {filteredDeployments.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size={300}>No deployments match the selected filter.</Text>
        </div>
      ) : (
        <Table className={styles.table} aria-label="Deployment history">
          <TableHeader>
            <TableRow>
              <TableHeaderCell className={styles.colStatus}>Status</TableHeaderCell>
              <TableHeaderCell>Deployment</TableHeaderCell>
              <TableHeaderCell className={styles.colAuthor}>Author</TableHeaderCell>
              <TableHeaderCell className={styles.colTime}>Time</TableHeaderCell>
              <TableHeaderCell className={styles.colDuration}>Duration</TableHeaderCell>
              <TableHeaderCell className={styles.colActions} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeployments.flatMap((entry, idx) => {
              const isExpanded = expandedRows.has(entry.id);
              const rowClass = idx % 2 === 1 ? styles.tableRowAlt : styles.tableRow;

              const rows = [
                <TableRow
                  key={entry.id}
                  className={rowClass}
                  onClick={() => toggleRow(entry.id)}
                >
                  <TableCell className={styles.colStatus}>
                    <StatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell>
                    <Text block>{entry.commitMessage ?? entry.message}</Text>
                    {entry.commitId && (
                      <Text block className={styles.commitHash}>
                        {entry.commitId}
                      </Text>
                    )}
                  </TableCell>
                  <TableCell className={styles.colAuthor}>{entry.author}</TableCell>
                  <TableCell className={styles.colTime}>
                    <Tooltip content={entry.timestamp} relationship="description">
                      <Text>{formatRelativeTime(entry.timestamp)}</Text>
                    </Tooltip>
                  </TableCell>
                  <TableCell className={styles.colDuration}>
                    {formatDuration(entry.durationSeconds)}
                  </TableCell>
                  <TableCell className={styles.colActions}>
                    <Button
                      appearance="subtle"
                      icon={isExpanded ? <ChevronDownRegular /> : <ChevronRightRegular />}
                      size="small"
                      aria-label={isExpanded ? 'Collapse logs' : 'Expand logs'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(entry.id);
                      }}
                    />
                  </TableCell>
                </TableRow>,
              ];

              if (isExpanded && entry.buildLogs) {
                rows.push(
                  <TableRow key={`${entry.id}-logs`}>
                    <TableCell colSpan={6}>
                      <div className={styles.expandedContent}>
                        <Text weight="semibold" size={200}>
                          Build logs
                        </Text>
                        <div className={styles.codeBlock}>{entry.buildLogs.join('\n')}</div>
                      </div>
                    </TableCell>
                  </TableRow>,
                );
              }

              return rows;
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );

  // =========================================================================
  // FTPS Credentials Tab
  // =========================================================================
  const renderFtpsTab = () => (
    <div className={styles.tabContent}>
      <MessageBar intent="warning">
        <MessageBarBody>
          <MessageBarTitle>FTP access disabled</MessageBarTitle>
          FTP access is currently disabled. Enable FTP in Configuration &rarr; General settings.
        </MessageBarBody>
      </MessageBar>

      {/* FTPS endpoint */}
      <div className={styles.credentialSection}>
        <div className={styles.fieldGroup}>
          <Label className={styles.fieldLabel}>FTPS endpoint</Label>
          <div className={styles.inputWithAction}>
            <Input
              className={styles.inputField}
              value="ftps://waws-prod-eus-001.ftp.azurewebsites.windows.net"
              readOnly
            />
            <Button
              appearance="subtle"
              icon={<CopyRegular />}
              size="small"
              aria-label="Copy FTPS endpoint"
              onClick={() =>
                copyToClipboard('ftps://waws-prod-eus-001.ftp.azurewebsites.windows.net')
              }
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* Application scope */}
      <div className={styles.credentialSection}>
        <Text className={styles.sectionHeader}>Application scope</Text>

        <div className={styles.fieldGroup}>
          <Label className={styles.fieldLabel}>Username</Label>
          <div className={styles.inputWithAction}>
            <Input
              className={styles.inputField}
              value={'my-node-app-eastus\\$my-node-app-eastus'}
              readOnly
            />
            <Button
              appearance="subtle"
              icon={<CopyRegular />}
              size="small"
              aria-label="Copy application username"
              onClick={() => copyToClipboard('my-node-app-eastus\\$my-node-app-eastus')}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <Label className={styles.fieldLabel}>Password</Label>
          <div className={styles.inputWithAction}>
            <Input
              className={styles.inputField}
              type={showAppPassword ? 'text' : 'password'}
              value="SuP3rS3cr3tP@ssw0rd!"
              readOnly
            />
            <Button
              appearance="subtle"
              icon={showAppPassword ? <EyeOffRegular /> : <EyeRegular />}
              size="small"
              aria-label={showAppPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowAppPassword((p) => !p)}
            />
            <Button
              appearance="subtle"
              icon={<CopyRegular />}
              size="small"
              aria-label="Copy application password"
              onClick={() => copyToClipboard('SuP3rS3cr3tP@ssw0rd!')}
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* User scope */}
      <div className={styles.credentialSection}>
        <Text className={styles.sectionHeader}>User scope</Text>

        <div className={styles.fieldGroup}>
          <Label className={styles.fieldLabel}>Username</Label>
          <div className={styles.inputWithAction}>
            <Input className={styles.inputField} value="NicL9923" readOnly />
            <Button
              appearance="subtle"
              icon={<CopyRegular />}
              size="small"
              aria-label="Copy user username"
              onClick={() => copyToClipboard('NicL9923')}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <Label className={styles.fieldLabel}>Password</Label>
          <div className={styles.inputWithAction}>
            <Input
              className={styles.inputField}
              type={showUserPassword ? 'text' : 'password'}
              value="Us3rP@ssw0rd123"
              readOnly
            />
            <Button
              appearance="subtle"
              icon={showUserPassword ? <EyeOffRegular /> : <EyeRegular />}
              size="small"
              aria-label={showUserPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowUserPassword((p) => !p)}
            />
            <Button
              appearance="subtle"
              icon={<CopyRegular />}
              size="small"
              aria-label="Copy user password"
              onClick={() => copyToClipboard('Us3rP@ssw0rd123')}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className={styles.root}>
      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as TabValue)}
      >
        <Tab value="settings">Settings</Tab>
        <Tab value="logs">Logs</Tab>
        <Tab value="ftps">FTPS credentials</Tab>
      </TabList>

      {selectedTab === 'settings' && renderSettingsTab()}
      {selectedTab === 'logs' && renderLogsTab()}
      {selectedTab === 'ftps' && renderFtpsTab()}
    </div>
  );
};
