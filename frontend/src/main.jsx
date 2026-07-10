import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import theme from './theme';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <CurrencyProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </CurrencyProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
