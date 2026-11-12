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
import AppRouter from './routes/AppRouter.jsx';

/**
 * Provider composition order matters:
 *   BrowserRouter (outermost — NavigationPaletteContext uses useNavigate)
 *   └── AuthenticationProvider
 *       └── SystemProcessingProvider
 *           └── NavigationPaletteProvider
 *               └── AppRouter
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthenticationProvider>
        <SystemProcessingProvider>
          <NavigationPaletteProvider>
            <AppRouter />
          </NavigationPaletteProvider>
        </SystemProcessingProvider>
      </AuthenticationProvider>
    </BrowserRouter>
  );
}

