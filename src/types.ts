export type DeploymentSourceType = 'github' | 'bitbucket' | 'localGit' | 'azureRepos' | 'externalGit' | 'publishFiles' | 'none';
export type BuildProvider = 'githubActions' | 'azurePipelines' | 'kudu' | 'none';
export type DeploymentStatus = 'Success' | 'Failed' | 'InProgress' | 'Pending' | 'Canceled';
export type SlotStatus = 'Running' | 'Stopped';
export type AppStatus = 'Running' | 'Stopped';

export type DeploymentPhaseStatus = 'complete' | 'active' | 'pending' | 'failed';

export interface DeploymentPhase {
  name: string;
  status: DeploymentPhaseStatus;
  startedAt?: string;
  completedAt?: string;
}

export interface WebAppResource {
  name: string;
  resourceGroup: string;
  subscriptionName: string;
  subscriptionId: string;
  location: string;
  status: AppStatus;
  defaultHostName: string;
  appServicePlan: string;
  operatingSystem: 'Linux' | 'Windows';
  runtimeStack: string;
  publishingModel: 'Code' | 'Container';
  healthCheckPath: string;
}

export interface DeploymentSourceConfig {
  type: DeploymentSourceType;
  buildProvider: BuildProvider;
  githubAccount?: string;
  githubOrg?: string;
  githubRepo?: string;
  githubBranch?: string;
  workflowFileName?: string;
  repoUrl?: string;
  branch?: string;
}

export interface DeploymentEntry {
  id: string;
  timestamp: string;
  author: string;
  authorAvatar?: string;
  status: DeploymentStatus;
  message: string;
  commitId?: string;
  commitMessage?: string;
  branch?: string;
  targetSlot: string;
  durationSeconds?: number;
  buildLogs?: string[];
  deploymentLogs?: DeploymentLogEntry[];
  sourceType: DeploymentSourceType;
  phases?: DeploymentPhase[];
}

export interface DeploymentSlot {
  name: string;
  isProduction: boolean;
  status: SlotStatus;
  lastDeployment?: DeploymentEntry;
  trafficPercentage: number;
  url: string;
  runtimeStack: string;
  appSettings: { name: string; value: string; isSlotSetting: boolean }[];
}

export interface FtpsCredentials {
  endpoint: string;
  appScopeUsername: string;
  appScopePassword: string;
  userScopeUsername: string;
  userScopePassword: string;
  isEnabled: boolean;
}

export interface DeploymentLogEntry {
  timestamp: string;
  activity: string;
  detailLogs?: string[];
}

export type LeftNavItem = {
  key: string;
  label: string;
  icon?: string;
  section?: string;
  isActive?: boolean;
};
