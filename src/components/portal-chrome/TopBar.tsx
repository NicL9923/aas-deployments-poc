import { useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Input,
  mergeClasses,
} from '@fluentui/react-components';
import {
  GridDots24Regular,
  Navigation24Regular,
  Search24Regular,
  PersonCircle24Regular,
} from '@fluentui/react-icons';
import { useVariant } from '../../context/VariantContext';
import type { VariantMode } from '../../types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    height: '40px',
    backgroundColor: '#0078d4',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    gap: tokens.spacingHorizontalS,
    flexShrink: 0,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  icon: {
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  portalTitle: {
    color: 'white',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    whiteSpace: 'nowrap',
  },
  searchSection: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '500px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  searchInput: {
    width: '100%',
    opacity: 0.9,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginLeft: 'auto',
  },
  variantSwitcher: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  variantLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'nowrap',
  },
  variantToggle: {
    display: 'flex',
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.3)',
  },
  variantButton: {
    border: 'none',
    cursor: 'pointer',
    paddingTop: '2px',
    paddingBottom: '2px',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.8)',
    transition: 'all 0.15s ease',
    lineHeight: '20px',
  },
  variantButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    color: '#0078d4',
  },
});

export const TopBar = () => {
  const styles = useStyles();
  const { variant, setVariant } = useVariant();

  const handleVariantChange = useCallback(
    (v: VariantMode) => {
      setVariant(v);
    },
    [setVariant],
  );

  return (
    <div className={styles.root}>
      <div className={styles.leftSection}>
        <span className={styles.icon}>
          <GridDots24Regular />
        </span>
        <span className={styles.icon}>
          <Navigation24Regular />
        </span>
        <Text className={styles.portalTitle}>Microsoft Azure</Text>
      </div>

      <div className={styles.searchSection}>
        <Input
          className={styles.searchInput}
          contentBefore={<Search24Regular />}
          placeholder="Search resources, services, and docs (G+/)"
          size="small"
          appearance="filled-lighter"
        />
      </div>

      <div className={styles.rightSection}>
        <div className={styles.variantSwitcher}>
          <Text className={styles.variantLabel}>Experience:</Text>
          <div className={styles.variantToggle}>
            <button
              className={mergeClasses(
                styles.variantButton,
                variant === 'bold' && styles.variantButtonActive,
              )}
              onClick={() => handleVariantChange('bold')}
            >
              Bold
            </button>
            <button
              className={mergeClasses(
                styles.variantButton,
                variant === 'safe' && styles.variantButtonActive,
              )}
              onClick={() => handleVariantChange('safe')}
            >
              Safe
            </button>
          </div>
        </div>
        <span className={styles.icon}>
          <PersonCircle24Regular />
        </span>
      </div>
    </div>
  );
};
