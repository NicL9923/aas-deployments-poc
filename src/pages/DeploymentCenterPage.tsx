import { useVariant } from '../context/VariantContext';
import { BoldDeploymentCenter } from '../experiences/bold/DeploymentCenter';
import { SafeDeploymentCenter } from '../experiences/safe/DeploymentCenter';

export const DeploymentCenterPage = () => {
  const { variant } = useVariant();
  return variant === 'bold' ? <BoldDeploymentCenter /> : <SafeDeploymentCenter />;
};
