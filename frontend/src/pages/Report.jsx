import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Paper, Grid, Button } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import scanService from '../services/scanService';
import reportService from '../services/reportService';

import { useTranslation } from 'react-i18next';

const Report = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await scanService.getScanReport(id);
        setReport(response.data);
      } catch (error) {
        console.error('Failed to fetch report', error);
      }
    };
    fetchReport();
  }, [id]);

  if (!report) {
    return <Typography>Loading...</Typography>;
  }

  const { findings } = report;

  const severityData = findings.reduce((acc, finding) => {
    const { severity } = finding;
    const existing = acc.find((item) => item.name === severity);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: severity, value: 1 });
    }
    return acc;
  }, []);

  const categoryData = findings.reduce((acc, finding) => {
    const { category } = finding;
    const existing = acc.find((item) => item.name === category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: category, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const handleExport = async (format) => {
    try {
      await reportService.exportReport(id, format);
    } catch (error) {
      console.error(`Failed to export ${format} report`, error);
    }
  };

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('scanReportFor')} {report.target}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          {t('scannedOn')} {new Date(report.createdAt).toLocaleString()}
        </Typography>

        <Box sx={{ my: 4 }}>
            <Button variant="contained" onClick={() => handleExport('pdf')} sx={{ mr: 2 }}>{t('exportAsPDF')}</Button>
            <Button variant="contained" onClick={() => handleExport('csv')}>{t('exportAsCSV')}</Button>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{t('findingsBySeverity')}</Typography>
              <PieChart width={400} height={400}>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{t('findingsByCategory')}</Typography>
              <BarChart
                width={500}
                height={300}
                data={categoryData}
                margin={{
                  top: 5, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>{t('allFindings')}</Typography>
          {report.type === 'NETWORK' ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Protocol</TableCell>
                    <TableCell>Port</TableCell>
                    <TableCell>Host</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Recommendation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {findings.map((finding) => (
                    <TableRow key={finding.id}>
                      <TableCell>{finding.protocol}</TableCell>
                      <TableCell>{finding.port}</TableCell>
                      <TableCell>{finding.host}</TableCell>
                      <TableCell><span style={{ color: COLORS[severityData.findIndex(s => s.name === finding.severity) % COLORS.length] }}>{finding.severity}</span></TableCell>
                      <TableCell>{finding.description}</TableCell>
                      <TableCell>{finding.recommendation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            findings.map((finding) => (
              <Paper key={finding.id} sx={{ p: 2, my: 2 }}>
                <Typography variant="h6">{finding.category} - <span style={{ color: COLORS[severityData.findIndex(s => s.name === finding.severity) % COLORS.length] }}>{finding.severity}</span></Typography>
                <Typography><strong>{t('description')}:</strong> {finding.description}</Typography>
                <Typography><strong>{t('recommendation')}:</strong> {finding.recommendation}</Typography>
              </Paper>
            ))
          )}
        </Box>

        {report.type === 'NETWORK' && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>Device Information</Typography>
            {findings.filter(f => f.category === 'Device Information').map(finding => (
              <Paper key={finding.id} sx={{ p: 2, my: 2 }}>
                <Typography><strong>{finding.description.split(':')[0]}:</strong> {finding.description.split(':')[1]}</Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Report;
