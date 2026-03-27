import { useState } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  Text,
  Caption1,
  Button,
  TabList,
  Tab,
  Dropdown,
  Option,
  Link,
  mergeClasses,
} from '@fluentui/react-components';
import {
  ArrowMaximizeRegular,
  ArrowClockwiseRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { allDeployments } from '../mock-data';
import { formatRelativeTime } from '../utils';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const useStyles = makeStyles({
  root: {
    display: 'flex',
    gap: tokens.spacingHorizontalXXL,
    padding: tokens.spacingHorizontalXXL,
    alignItems: 'flex-start',
  },

  // Layout columns
  mainColumn: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  sidebar: {
    width: '320px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },

  // Metric cards row
  metricsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
  metricCard: {
    padding: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metricValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightHero700,
    fontVariantNumeric: 'tabular-nums',
  },

  // Console panel
  consoleCard: {
    padding: 0,
    overflow: 'hidden',
  },
  consoleToolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  consoleActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  instanceDropdown: {
    minWidth: '110px',
  },
  terminal: {
    backgroundColor: tokens.colorNeutralBackgroundInverted,
    color: tokens.colorNeutralForegroundInverted,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    padding: tokens.spacingHorizontalL,
    minHeight: '340px',
    overflowY: 'auto',
    whiteSpace: 'pre',
  },
  terminalGreenLine: {
    color: tokens.colorPaletteGreenForeground1,
  },
  tabPlaceholder: {
    padding: tokens.spacingHorizontalL,
    color: tokens.colorNeutralForeground3,
  },

  // Sidebar cards
  sidebarCard: {
    padding: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: tokens.fontWeightSemibold,
  },

  // Progress bars
  progressTrack: {
    height: '6px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralStroke2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorBrandBackground,
  },
  progressThin: {
    height: '4px',
  },

  // Health
  healthRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  healthDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: tokens.colorPaletteGreenForeground1,
    flexShrink: 0,
  },

  // Deploy card
  commitRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground2,
  },
  checkIcon: {
    color: tokens.colorPaletteGreenForeground1,
    flexShrink: 0,
  },
  truncatedText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },

  // Scale card
  scaleLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  scaleButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalXS,
  },
});

// ---------------------------------------------------------------------------
// MiniChart – reusable inline SVG chart
// ---------------------------------------------------------------------------

interface MiniChartProps {
  points: number[];
  color: string;
  width?: number;
  height?: number;
  labels?: string[];
}

const MiniChart = ({
  points,
  color,
  width = 240,
  height = 60,
  labels,
}: MiniChartProps) => {
  const padX = 4;
  const padTop = 4;
  const padBottom = labels ? 16 : 4;
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;
  const max = Math.max(...points, 1);

  const toX = (i: number) => padX + (i / (points.length - 1)) * chartW;
  const toY = (v: number) => padTop + chartH - (v / max) * chartH;

  const linePoints = points.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const areaPath = [
    `M ${toX(0)},${toY(points[0])}`,
    ...points.slice(1).map((v, i) => `L ${toX(i + 1)},${toY(v)}`),
    `L ${toX(points.length - 1)},${padTop + chartH}`,
    `L ${toX(0)},${padTop + chartH} Z`,
  ].join(' ');

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={areaPath} fill={color} opacity={0.15} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
      />
      {labels &&
        labels.map((label, i) => (
          <text
            key={label}
            x={padX + (i / (labels.length - 1)) * chartW}
            y={height - 2}
            fontSize={9}
            fill="currentColor"
            opacity={0.5}
            textAnchor="middle"
          >
            {label}
          </text>
        ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const latestDeployment = allDeployments[0];
const chartLabels = ['12:00', '12:20', '12:40', '1:00'];

const requestsData = [120, 210, 180, 340, 290, 410, 380, 520, 460, 390, 450, 500];
const errorsData = [2, 5, 3, 8, 4, 12, 6, 9, 3, 7, 5, 4];
const responseTimeData = [90, 110, 95, 130, 125, 160, 140, 155, 120, 135, 145, 142];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MetricCard = ({
  title,
  value,
  color,
  data,
}: {
  title: string;
  value: string;
  color: string;
  data: number[];
}) => {
  const styles = useStyles();
  return (
    <Card className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <Caption1>{title}</Caption1>
        <Text className={styles.metricValue}>{value}</Text>
      </div>
      <MiniChart points={data} color={color} labels={chartLabels} />
    </Card>
  );
};

const ConsolePanel = () => {
  const styles = useStyles();
  const [tab, setTab] = useState<string>('console');

  return (
    <Card className={styles.consoleCard}>
      <div className={styles.consoleToolbar}>
        <TabList
          size="small"
          selectedValue={tab}
          onTabSelect={(_, d) => setTab(d.value as string)}
        >
          <Tab value="console">{'>_ Console'}</Tab>
          <Tab value="logs">Log stream</Tab>
          <Tab value="processes">Processes</Tab>
        </TabList>
        <div className={styles.consoleActions}>
          <Dropdown
            className={styles.instanceDropdown}
            size="small"
            defaultSelectedOptions={['i-0a3f']}
            defaultValue="i-0a3f"
          >
            <Option value="i-0a3f">i-0a3f</Option>
            <Option value="i-7b12">i-7b12</Option>
            <Option value="i-e4c9">i-e4c9</Option>
          </Dropdown>
          <Button
            size="small"
            appearance="subtle"
            icon={<ArrowClockwiseRegular />}
            aria-label="Refresh"
          />
          <Button
            size="small"
            appearance="subtle"
            icon={<ArrowMaximizeRegular />}
            aria-label="Fullscreen"
          />
        </div>
      </div>

      {tab === 'console' && (
        <div className={styles.terminal}>
          <span className={styles.terminalGreenLine}>
            {'Connected to instance i-0a3f — eh-code-sidecar'}
          </span>
          {'\n\nroot@i-0a3f:/home/site/wwwroot$ \nroot@i-0a3f:/home/site/wwwroot$ '}
        </div>
      )}
      {tab === 'logs' && (
        <div className={styles.tabPlaceholder}>
          <Caption1>Log stream output will appear here…</Caption1>
        </div>
      )}
      {tab === 'processes' && (
        <div className={styles.tabPlaceholder}>
          <Caption1>Process list will appear here…</Caption1>
        </div>
      )}
    </Card>
  );
};

const RecommendedSetupCard = () => {
  const styles = useStyles();
  return (
    <Card className={styles.sidebarCard}>
      <div className={styles.cardRow}>
        <Text className={styles.cardTitle}>✨ Recommended setup</Text>
        <Caption1>3 of 6</Caption1>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: '50%' }} />
      </div>
      <Link>View recommendations →</Link>
    </Card>
  );
};

const HealthCheckCard = () => {
  const styles = useStyles();
  return (
    <Card className={styles.sidebarCard}>
      <div className={styles.cardRow}>
        <div className={styles.healthRow}>
          <Text className={styles.cardTitle}>❤️ Health check</Text>
          <span className={styles.healthDot} />
          <Text size={200}>Healthy</Text>
        </div>
        <Button size="small" appearance="outline">
          Configure
        </Button>
      </div>
    </Card>
  );
};

const LastDeployCard = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const commitMsg = latestDeployment.commitMessage ?? '';
  const truncated =
    commitMsg.length > 40 ? `${commitMsg.slice(0, 40)}…` : commitMsg;

  return (
    <Card className={styles.sidebarCard}>
      <div className={styles.cardRow}>
        <Text className={styles.cardTitle}>🚀 Last deploy</Text>
        <Caption1>{formatRelativeTime(latestDeployment.timestamp)}</Caption1>
      </div>
      <div className={styles.commitRow}>
        <CheckmarkCircleRegular className={styles.checkIcon} fontSize={16} />
        <Text size={200} className={styles.truncatedText}>
          {latestDeployment.branch} · {truncated}
        </Text>
      </div>
      <Link onClick={() => navigate('/deployments')}>Deploy center →</Link>
    </Card>
  );
};

const ProgressBar = ({
  pct,
  thin,
}: {
  pct: number;
  thin?: boolean;
}) => {
  const styles = useStyles();
  return (
    <div
      className={mergeClasses(
        styles.progressTrack,
        thin && styles.progressThin,
      )}
    >
      <div className={styles.progressFill} style={{ width: `${pct}%` }} />
    </div>
  );
};

const ScaleStatusCard = () => {
  const styles = useStyles();
  return (
    <Card className={styles.sidebarCard}>
      <Text className={styles.cardTitle}>Scale status</Text>

      <div>
        <div className={styles.scaleLabel}>
          <Caption1>Instances</Caption1>
          <Text size={200} weight="semibold">
            3 / 10
          </Text>
        </div>
        <ProgressBar pct={30} thin />
      </div>

      <Caption1>Mode: Auto-scale</Caption1>

      <div>
        <div className={styles.scaleLabel}>
          <Caption1>Average CPU</Caption1>
          <Text size={200} weight="semibold">
            42%
          </Text>
        </div>
        <ProgressBar pct={42} thin />
      </div>

      <div>
        <div className={styles.scaleLabel}>
          <Caption1>Average memory</Caption1>
          <Text size={200} weight="semibold">
            68%
          </Text>
        </div>
        <ProgressBar pct={68} thin />
      </div>

      <div className={styles.scaleButtons}>
        <Button size="small" appearance="primary">
          Scale up
        </Button>
        <Button size="small" appearance="outline">
          Scale out
        </Button>
      </div>

      <Link>View all instances →</Link>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const OverviewPage = () => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      {/* Left column — main content */}
      <div className={styles.mainColumn}>
        <div className={styles.metricsRow}>
          <MetricCard
            title="Requests"
            value="1,247"
            color={tokens.colorBrandBackground}
            data={requestsData}
          />
          <MetricCard
            title="HTTP errors"
            value="23"
            color={tokens.colorPaletteRedForeground1}
            data={errorsData}
          />
          <MetricCard
            title="Avg response time"
            value="142 ms"
            color={tokens.colorPalettePurpleForeground2}
            data={responseTimeData}
          />
        </div>
        <ConsolePanel />
      </div>

      {/* Right sidebar */}
      <div className={styles.sidebar}>
        <RecommendedSetupCard />
        <HealthCheckCard />
        <LastDeployCard />
        <ScaleStatusCard />
      </div>
    </div>
  );
};
