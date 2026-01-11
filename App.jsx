import { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { authAPI } from './src/services/api';

export default function App() {
  useEffect(() => {
    authAPI.loadToken();
  }, []);

  return <AppNavigator />;
}
