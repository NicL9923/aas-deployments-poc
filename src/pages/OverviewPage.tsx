import {
  makeStyles,
  tokens,
  Card,
  Text,
  Title2,
  Badge,
  Button,
  Divider,
  Caption1,
  Link,
} from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';
import { webApp, allDeployments } from '../mock-data';
import { StatusBadge } from '../components/shared/StatusBadge';
import { DeploymentPhasePills } from '../components/shared/DeploymentPhasePills';
import { formatRelativeTime } from '../utils';

const latestDeployment = allDeployments[0];

const useStyles = makeStyles({
  root: {
    maxWidth: '960px',
    padding: tokens.spacingHorizontalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXL,
  },
  essentialsCard: {
    padding: tokens.spacingHorizontalL,
  },
  essentialsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    rowGap: tokens.spacingVerticalM,
    columnGap: tokens.spacingHorizontalXXL,
    marginTop: tokens.spacingVerticalM,
  },
  essentialRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  essentialLabel: {
    color: tokens.colorNeutralForeground3,
  },
  statusDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: tokens.spacingHorizontalXS,
  },
  statusRunning: {
    backgroundColor: tokens.colorPaletteGreenForeground1,
  },
  statusStopped: {
    backgroundColor: tokens.colorPaletteRedForeground1,
  },
  deploymentCard: {
    padding: tokens.spacingHorizontalL,
    borderLeft: `3px solid ${tokens.colorBrandBackground}`,
  },
  deploymentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  commitMessage: {
    marginBottom: tokens.spacingVerticalS,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
    marginBottom: tokens.spacingVerticalS,
  },
  phasesRow: {
    marginBottom: tokens.spacingVerticalM,
  },
  sectionTitle: {
    marginBottom: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground3,
  },
});

const EssentialField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  const styles = useStyles();
  return (
    <div className={styles.essentialRow}>
      <Caption1 className={styles.essentialLabel}>{label}</Caption1>
      <Text size={300}>{children}</Text>
    </div>
  );
};

export const OverviewPage = () => {
  const styles = useStyles();
  const navigate = useNavigate();

  const statusDotClass =
    webApp.status === 'Running' ? styles.statusRunning : styles.statusStopped;

  return (
    <div className={styles.root}>
      <Title2>Overview</Title2>

      {/* Essentials */}
      <Card className={styles.essentialsCard}>
        <Text size={400} weight="semibold">
          Essentials
        </Text>
        <Divider />
        <div className={styles.essentialsGrid}>
          <EssentialField label="Resource Group">
            {webApp.resourceGroup}
          </EssentialField>
          <EssentialField label="Status">
            <span className={`${styles.statusDot} ${statusDotClass}`} />
            {webApp.status}
          </EssentialField>
          <EssentialField label="Location">{webApp.location}</EssentialField>
          <EssentialField label="Subscription">
            {webApp.subscriptionName}
          </EssentialField>
          <EssentialField label="URL">
            <Link
              href={`https://${webApp.defaultHostName}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {webApp.defaultHostName}
            </Link>
          </EssentialField>
          <EssentialField label="App Service Plan">
            {webApp.appServicePlan}
          </EssentialField>
          <EssentialField label="OS / Runtime">
            {webApp.operatingSystem} &nbsp;|&nbsp; {webApp.runtimeStack}
          </EssentialField>
          <EssentialField label="Publishing Model">
            {webApp.publishingModel}
          </EssentialField>
          <EssentialField label="Health Check Path">
            {webApp.healthCheckPath}
          </EssentialField>
        </div>
      </Card>

      {/* Latest Deployment */}
      <Card className={styles.deploymentCard}>
        <Caption1 className={styles.sectionTitle}>Latest Deployment</Caption1>
        <div className={styles.deploymentHeader}>
          <StatusBadge status={latestDeployment.status} />
        </div>

        <Text size={300} className={styles.commitMessage} block>
          {latestDeployment.commitMessage && latestDeployment.commitMessage.length > 72
            ? `${latestDeployment.commitMessage.slice(0, 72)}…`
            : latestDeployment.commitMessage}
        </Text>

        <div className={styles.metaRow}>
          <Badge appearance="outline" size="small">
            {latestDeployment.commitId}
          </Badge>
          <Caption1>{latestDeployment.branch}</Caption1>
          <Caption1>·</Caption1>
          <Caption1>{latestDeployment.author}</Caption1>
          <Caption1>·</Caption1>
          <Caption1>{formatRelativeTime(latestDeployment.timestamp)}</Caption1>
        </div>

        {latestDeployment.phases && latestDeployment.phases.length > 0 && (
          <div className={styles.phasesRow}>
            <DeploymentPhasePills phases={latestDeployment.phases} />
          </div>
        )}

        <Button
          appearance="transparent"
          size="small"
          onClick={() => navigate('/deployments')}
        >
          View deployments →
        </Button>
      </Card>
    </div>
  );
};
