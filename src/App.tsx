import { FluentProvider } from '@fluentui/react-components';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { portalTheme } from './theme/portalTheme';
import { SlotProvider } from './context/SlotProvider';
import { PortalShell } from './components/portal-chrome/PortalShell';
import { DeploymentsPage } from './pages/DeploymentsPage';
import { OverviewPage } from './pages/OverviewPage';
const App = () => (
  <FluentProvider theme={portalTheme}>
    <SlotProvider>
      <BrowserRouter>
        <PortalShell>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/deployments" element={<DeploymentsPage />} />
            {/* Redirect old route */}
            <Route path="/deployment-center" element={<Navigate to="/deployments" replace />} />
          </Routes>
        </PortalShell>
      </BrowserRouter>
    </SlotProvider>
  </FluentProvider>
);

export default App;
