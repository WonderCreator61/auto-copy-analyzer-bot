import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const ConfigModal = ({ open, onClose, config }) => {
  if (!config) return null;

  const renderData = () => {
    const data = config.data;
    const headers = config.headers;
    
    if (!data || !headers || headers.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      );
    }

    return (
      <List dense>
        {headers.map((header) => {
          const value = data[header];
          const formattedValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '-');
          
          return (
            <ListItem key={header} sx={{ px: 0 }}>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {formattedValue}
                  </Typography>
                }
              />
            </ListItem>
          );
        })}
      </List>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: 'primary.main', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">Data Details</Typography>
        <Button
          onClick={onClose}
          sx={{ color: 'white', minWidth: 'auto' }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Box>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              Data Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {renderData()}
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={onClose} 
          variant="contained"
          sx={{ borderRadius: 2 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigModal; 