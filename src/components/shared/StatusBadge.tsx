import { Badge, Spinner, makeStyles, tokens } from '@fluentui/react-components';
import type { DeploymentStatus } from '../../types';

const useStyles = makeStyles({
  wrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
});

interface StatusBadgeProps {
  status: DeploymentStatus;
}

const statusConfig: Record<DeploymentStatus, { color: 'success' | 'danger' | 'informative' | 'important' | 'subtle'; label: string }> = {
  Success: { color: 'success', label: 'Success' },
  Failed: { color: 'danger', label: 'Failed' },
  InProgress: { color: 'informative', label: 'In progress' },
  Pending: { color: 'subtle', label: 'Pending' },
  Canceled: { color: 'subtle', label: 'Canceled' },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const styles = useStyles();
  const config = statusConfig[status];

  return (
    <span className={styles.wrapper}>
      {status === 'InProgress' && <Spinner size="extra-tiny" />}
      <Badge color={config.color} appearance="filled">
        {config.label}
      </Badge>
    </span>
  );
};
