import { useVariant } from '../context/VariantContext';
import { BoldDeploymentSlots } from '../experiences/bold/DeploymentSlots';
import { SafeDeploymentSlots } from '../experiences/safe/DeploymentSlots';

export const DeploymentSlotsPage = () => {
  const { variant } = useVariant();
  return variant === 'bold' ? <BoldDeploymentSlots /> : <SafeDeploymentSlots />;
};
