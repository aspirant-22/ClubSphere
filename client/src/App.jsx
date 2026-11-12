/**
 * @file App.jsx
 * @module root
 * @description React 19 application root composing all context providers
 *              around the protected router tree.
 * @author Garima Mittal
 */

import { BrowserRouter } from 'react-router-dom';
import { AuthenticationProvider }    from './context/AuthenticationContext.jsx';
import { SystemProcessingProvider }  from './context/SystemProcessingContext.jsx';
import { NavigationPaletteProvider } from './context/NavigationPaletteContext.jsx';
import { SocketNotificationProvider } from './context/SocketNotificationContext.jsx';
import { ProcessingOverlay }         from './components/common/ProcessingOverlay.jsx';
import AppRouter from './routes/AppRouter.jsx';

/**
 * Provider composition order:
 *   BrowserRouter (outermost — NavigationPaletteContext uses useNavigate)
 *   └── AuthenticationProvider
 *       └── SystemProcessingProvider
 *           └── SocketNotificationProvider
 *               └── NavigationPaletteProvider
 *                   ├── ProcessingOverlay
 *                   └── AppRouter
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthenticationProvider>
        <SystemProcessingProvider>
          <SocketNotificationProvider>
            <NavigationPaletteProvider>
              <ProcessingOverlay />
              <AppRouter />
            </NavigationPaletteProvider>
          </SocketNotificationProvider>
        </SystemProcessingProvider>
      </AuthenticationProvider>
    </BrowserRouter>
  );
}

