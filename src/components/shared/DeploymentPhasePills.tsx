import { makeStyles, mergeClasses, tokens, Spinner } from '@fluentui/react-components';
import { Checkmark12Regular, Dismiss12Regular, ChevronRight12Regular } from '@fluentui/react-icons';
import type { DeploymentPhase, DeploymentPhaseStatus } from '../../types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
    paddingLeft: tokens.spacingHorizontalSNudge,
    paddingRight: tokens.spacingHorizontalSNudge,
    paddingTop: tokens.spacingVerticalXXS,
    paddingBottom: tokens.spacingVerticalXXS,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap',
  },
  complete: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1,
  },
  active: {
    backgroundColor: tokens.colorPaletteBlueBorderActive,
    color: tokens.colorNeutralForegroundOnBrand,
    animationName: {
      from: { opacity: 0.7 },
      to: { opacity: 1 },
    },
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
    animationTimingFunction: 'ease-in-out',
  },
  pending: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
  },
  failed: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
  },
  separator: {
    display: 'inline-flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground4,
    fontSize: tokens.fontSizeBase200,
  },
});

const statusStyleMap: Record<DeploymentPhaseStatus, string> = {
  complete: 'complete',
  active: 'active',
  pending: 'pending',
  failed: 'failed',
};

const StatusIcon = ({ status }: { status: DeploymentPhaseStatus }) => {
  switch (status) {
    case 'complete':
      return <Checkmark12Regular />;
    case 'active':
      return <Spinner size="extra-tiny" />;
    case 'failed':
      return <Dismiss12Regular />;
    default:
      return null;
  }
};

interface DeploymentPhasePillsProps {
  phases: DeploymentPhase[];
}

export const DeploymentPhasePills = ({ phases }: DeploymentPhasePillsProps) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      {phases.map((phase, idx) => (
        <span key={phase.name} style={{ display: 'contents' }}>
          <span
            className={mergeClasses(styles.pill, styles[statusStyleMap[phase.status] as keyof typeof styles])}
          >
            <StatusIcon status={phase.status} />
            {phase.name}
          </span>
          {idx < phases.length - 1 && (
            <span className={styles.separator}>
              <ChevronRight12Regular />
            </span>
          )}
        </span>
      ))}
    </div>
  );
};
