import { useVariant } from '../context/VariantContext';
import { BoldDeployments } from '../experiences/bold/Deployments';
import { SafeDeployments } from '../experiences/safe/Deployments';

export const DeploymentsPage = () => {
  const { variant } = useVariant();
  return variant === 'bold' ? <BoldDeployments /> : <SafeDeployments />;
};
