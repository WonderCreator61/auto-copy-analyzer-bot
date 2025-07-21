import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import QueryTargetsTable from './components/QueryTargetsTable';
import SimulationResult from './components/SimulationResult';
import { Toaster } from 'react-hot-toast';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<QueryTargetsTable />} />
            <Route path="/simulation" element={<SimulationResult />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
