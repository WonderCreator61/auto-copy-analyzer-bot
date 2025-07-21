import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  TableSortLabel,
  Button
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import axios from 'axios';
import ConfigModal from './ConfigModal';
import toast from 'react-hot-toast';
import { BACKEND_URL } from '../utils/helper';

const QueryTargetsTable = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('desc');
  const [headers, setHeaders] = useState([]);
  const [queryRunning, setQueryRunning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/targets`);
      const dataArray = response.data.data || [];
      setData(dataArray);
      
      // Extract headers from the first element
      if (dataArray.length > 0) {
        const firstElement = dataArray[0];
        const headerKeys = Object.keys(firstElement);
        setHeaders(headerKeys);
        // Set default sort column to the first header
        if (headerKeys.length > 0) {
          setOrderBy(headerKeys[0]);
        }
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowConfig = (row) => {
    setSelectedConfig({
      data: row,
      headers: headers
    });
    setModalOpen(true);
  };

  const handleAddConfig = (row) => {
    // Create a basic config using the row data
    const configData = {
      target_wallet: row.wallet_address || row.wallet || Object.values(row)[0] || "",
      // Add other default values as needed
      maxBuyCount: "1",
      maxBuy: "5",
      minTriggerBuy: "1",
      maxTriggerBuy: "10",
      minMCap: "10k",
      maxMCap: "90k",
      minTokenAge: "1H",
      maxTokenAge: "3D",
      buyAmount: "0.5",
      buyFee: "0.001",
      sellFee: "0.001",
      buySlippage: "50",
      sellSlippage: "50",
      buyTip: "0.05",
      sellTip: "0.01",
      isOnlyBondingCurve: true,
      limitOrders: [
        {
          sellAt: 150,
          sellAmount: 20
        },
        {
          sellAt: 300,
          sellAmount: 100
        }
      ],
      buyProtection: false,
      sellProtection: false
    };

    toast.loading('Adding config...', { duration: 2000 });

    axios.post(`/api/addConfig`, configData)
      .then(response => {
        console.log('Config added successfully:', response.data);
        toast.success('Config added successfully');
      })
      .catch(error => {
        console.error('Error adding config:', error);
        toast.error('Error adding config');
      });
  };

  const formatNumber = (num) => {
    if (typeof num === 'number') {
      return num.toFixed(2);
    }
    return num;
  };

  const formatCellValue = (value, fieldName) => {
    if (value === null || value === undefined) return '-';
    
    // Handle different data types
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    
    if (typeof value === 'string') {
      // Check if it's a percentage
      if (value.includes('%') || (value.includes('.') && parseFloat(value) <= 1)) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          return `${(num * 100).toFixed(1)}%`;
        }
      }
      return value;
    }
    
    return String(value);
  };

  const getCellColor = (value, fieldName) => {
    if (typeof value === 'number') {
      if (fieldName.toLowerCase().includes('profit') || fieldName.toLowerCase().includes('pnl')) {
        return value >= 0 ? 'success.main' : 'error.main';
      }
    }
    return 'inherit';
  };

  const formatHeaderName = (header) => {
    return header
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleRunQuery = () => {
    toast.loading('Running query...', { duration: 2000 });
    setQueryRunning(true);
    axios.post(`/api/runQuery`, {
      targets: data
    }).then(() => {
      const intervalId = setInterval(() => {
        axios.get(`/api/queryRunning`).then((res) => {
          if (res.data.data === false) {
            clearInterval(intervalId);
            toast.success('Query completed');
            setQueryRunning(false);
            fetchData();
          }
        });
      }, 10000);
    });
  };
  
  const handleSimulate = () => {
    toast.loading('Simulating...', { duration: 2000 });
    axios.post(`/api/simulate`, {
      targets: data
    })
    .then(response => {
      console.log('Simulation run successfully:', response.data);
      const intervalId = setInterval(() => {
        axios.get(`/api/simulationRunning`).then((res) => {
          if (res.data.data === false) {
            clearInterval(intervalId);
            toast.success('Simulation completed');
            fetchData();
          }
        });
      }, 10000);
    })
  };

  const sortData = (data, orderBy, order) => {
    if (!orderBy || data.length === 0) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        // String comparison
        if (order === 'desc') {
          return bValue.localeCompare(aValue);
        } else {
          return aValue.localeCompare(bValue);
        }
      } else {
        // Numeric comparison
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
        
        if (order === 'desc') {
          return bValue - aValue;
        } else {
          return aValue - bValue;
        }
      }
    });
  };

  const sortedData = sortData(data, orderBy, order);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {queryRunning && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100vw"
          height="100vh"
          zIndex={1300}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(255,255,255,0.6)"
        >
          <CircularProgress size={64} />
        </Box>
      )}
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ color: 'primary.main' }}>
          Query Targets Dashboard
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mr: 2 }}
            onClick={handleRunQuery}
          >
            Run Query
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            sx={{ mr: 2 }}
            onClick={handleSimulate}
          >
            Simulate
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<AssessmentIcon />}
            onClick={() => navigate('/simulation')}
          >
            View Simulation Results
          </Button>
        </Box>
      </Box>
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, mb: 3, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              {headers.map((header) => (
                <TableCell key={header} sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>
                  <TableSortLabel
                    active={orderBy === header}
                    direction={orderBy === header ? order : 'asc'}
                    onClick={() => handleRequestSort(header)}
                    sx={{ 
                      color: 'white', 
                      '&:hover': { color: 'white' }, 
                      '&.MuiTableSortLabel-active': { color: 'white' },
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {formatHeaderName(header)}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row, index) => (
              <TableRow 
                key={row._id || index}
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: 'grey.50' },
                  '&:hover': { backgroundColor: 'grey.100' }
                }}
              >
                {headers.map((header) => (
                  <TableCell key={header} sx={{ py: 1.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: getCellColor(row[header], header),
                        fontSize: '0.875rem',
                        fontWeight: typeof row[header] === 'number' ? 'bold' : 'normal'
                      }}
                    >
                      {formatCellValue(row[header], header)}
                    </Typography>
                  </TableCell>
                ))}
                <TableCell sx={{ py: 1.5 }}>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Show Configurations">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleShowConfig(row)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Configuration">
                      <IconButton 
                        size="small" 
                        color="secondary"
                        onClick={() => handleAddConfig(row)}
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ConfigModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        config={selectedConfig}
      />
    </Box>
  );
};

export default QueryTargetsTable; 