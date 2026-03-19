import { FluentProvider } from '@fluentui/react-components';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { portalTheme } from './theme/portalTheme';
import { VariantProvider } from './context/VariantContext';
import { PortalShell } from './components/portal-chrome/PortalShell';
import { DeploymentCenterPage } from './pages/DeploymentCenterPage';
import { DeploymentSlotsPage } from './pages/DeploymentSlotsPage';

const App = () => (
  <FluentProvider theme={portalTheme}>
    <VariantProvider>
      <BrowserRouter>
        <PortalShell>
          <Routes>
            <Route path="/" element={<Navigate to="/deployment-center" replace />} />
            <Route path="/deployment-center" element={<DeploymentCenterPage />} />
            <Route path="/deployment-slots" element={<DeploymentSlotsPage />} />
          </Routes>
        </PortalShell>
      </BrowserRouter>
    </VariantProvider>
  </FluentProvider>
);

export default App;
