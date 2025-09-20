import { useEffect, useState } from 'react';
import { ComponentErrorBoundary } from '../components/ErrorBoundary';
import { 
  Box, 
  Typography, 
  Card, 
  Grid, 
  Chip, 
  Stack,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalGasStation as FuelIcon,
  DirectionsCar as VehicleIcon,
  Person as DriverIcon,
  AttachMoney as MoneyIcon,
  Schedule as TimeIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { apiGet } from '../api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  Filler,
  RadialLinearScale
);

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalFuelCost: number;
    netProfit: number;
    profitMargin: number;
    totalDistance: number;
    avgFuelEfficiency: number;
    activeVehicles: number;
    totalTrips: number;
    onTimeDelivery: number;
  };
  trends: {
    revenue: number[];
    fuelCost: number[];
    profit: number[];
    distance: number[];
    efficiency: number[];
  };
  vehiclePerformance: {
    vehicleId: string;
    licensePlate: string;
    totalDistance: number;
    fuelEfficiency: number;
    revenue: number;
    trips: number;
    maintenanceCost: number;
    profitability: number;
  }[];
  driverPerformance: {
    driverId: string;
    name: string;
    rating: number;
    totalTrips: number;
    onTimeDelivery: number;
    fuelEfficiency: number;
    safetyScore: number;
    revenue: number;
  }[];
  fuelAnalysis: {
    totalConsumption: number;
    avgPrice: number;
    theftIncidents: number;
    savings: number;
    efficiencyTrend: number[];
    costTrend: number[];
  };
  routeOptimization: {
    totalDistanceOptimized: number;
    fuelSaved: number;
    timeSaved: number; // hours
    costSavings: number;
  };
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (range: string = timeRange) => {
    try {
      setError('');
      setRefreshing(true);
      
      // In production, this would call the actual analytics API
      // const data = await apiGet<AnalyticsData>(`/analytics?range=${range}`);
      
      // For now, using mock data that reflects real fleet analytics
      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockData: AnalyticsData = {
        summary: {
          totalRevenue: 2450000, // ₹24.5 Lakh
          totalFuelCost: 1850000, // ₹18.5 Lakh  
          netProfit: 600000, // ₹6 Lakh
          profitMargin: 24.5,
          totalDistance: 45800, // km
          avgFuelEfficiency: 4.2, // km/liter
          activeVehicles: 28,
          totalTrips: 450,
          onTimeDelivery: 94.2
        },
        trends: {
          revenue: [180000, 195000, 210000, 225000, 245000, 250000, 245000], // Weekly revenue
          fuelCost: [140000, 135000, 145000, 155000, 185000, 175000, 180000],
          profit: [40000, 60000, 65000, 70000, 60000, 75000, 65000],
          distance: [6200, 6500, 6800, 7100, 7300, 6900, 6500],
          efficiency: [3.8, 4.1, 4.0, 4.2, 4.3, 4.1, 4.2]
        },
        vehiclePerformance: [
          { vehicleId: 'V001', licensePlate: 'MH-12-AB-1234', totalDistance: 2800, fuelEfficiency: 4.5, revenue: 85000, trips: 28, maintenanceCost: 12000, profitability: 15.2 },
          { vehicleId: 'V002', licensePlate: 'MH-14-CD-5678', totalDistance: 2650, fuelEfficiency: 3.9, revenue: 78000, trips: 25, maintenanceCost: 15000, profitability: 12.8 },
          { vehicleId: 'V003', licensePlate: 'GJ-01-EF-9012', totalDistance: 3100, fuelEfficiency: 4.2, revenue: 92000, trips: 32, maintenanceCost: 8000, profitability: 18.5 },
          { vehicleId: 'V004', licensePlate: 'KA-03-GH-3456', totalDistance: 1950, fuelEfficiency: 4.8, revenue: 68000, trips: 22, maintenanceCost: 5000, profitability: 22.1 }
        ],
        driverPerformance: [
          { driverId: 'D001', name: 'Rajesh Kumar', rating: 4.8, totalTrips: 45, onTimeDelivery: 98.2, fuelEfficiency: 4.5, safetyScore: 95, revenue: 125000 },
          { driverId: 'D002', name: 'Suresh Patel', rating: 4.6, totalTrips: 42, onTimeDelivery: 95.1, fuelEfficiency: 4.2, safetyScore: 92, revenue: 118000 },
          { driverId: 'D003', name: 'Mukesh Singh', rating: 4.2, totalTrips: 38, onTimeDelivery: 91.5, fuelEfficiency: 3.8, safetyScore: 88, revenue: 102000 },
          { driverId: 'D004', name: 'Ramesh Yadav', rating: 4.9, totalTrips: 48, onTimeDelivery: 99.1, fuelEfficiency: 4.7, safetyScore: 97, revenue: 135000 }
        ],
        fuelAnalysis: {
          totalConsumption: 10850, // liters
          avgPrice: 105.5, // per liter
          theftIncidents: 3,
          savings: 45000, // from optimization
          efficiencyTrend: [3.9, 4.0, 4.1, 4.0, 4.2, 4.1, 4.2],
          costTrend: [102, 104, 105, 103, 106, 105, 105.5]
        },
        routeOptimization: {
          totalDistanceOptimized: 4500, // km saved
          fuelSaved: 1080, // liters
          timeSaved: 85, // hours
          costSavings: 125000 // rupees
        }
      };

      // Validate data before setting
      if (mockData && mockData.summary && mockData.trends) {
        setAnalyticsData(mockData);
      } else {
        throw new Error('Invalid analytics data structure');
      }
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const handleRefresh = () => {
    fetchAnalytics();
  };

  const handleExportReport = () => {
    // In production, this would generate and download a PDF/Excel report
    alert('📊 Report export feature will download detailed analytics report');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading analytics...</Typography>
      </Box>
    );
  }

  if (error || !analyticsData) {
    return (
      <Alert severity="error" action={
        <Button onClick={handleRefresh}>Retry</Button>
      }>
        {error || 'Failed to load analytics data'}
      </Alert>
    );
  }

  const { summary, trends, vehiclePerformance, driverPerformance, fuelAnalysis, routeOptimization } = analyticsData;

  // Chart configurations with safety checks
  const revenueChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: trends?.revenue || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Fuel Cost (₹)',
        data: trends?.fuelCost || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#d32f2f',
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Net Profit (₹)',
        data: trends?.profit || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const fuelEfficiencyData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
    datasets: [
      {
        label: 'Fuel Efficiency (km/L)',
        data: trends?.efficiency || [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#ff9800',
        borderColor: '#f57c00',
        borderWidth: 2
      }
    ]
  };

  const vehicleStatusData = {
    labels: ['Active', 'Maintenance', 'Parked', 'Issues'],
    datasets: [
      {
        data: [24, 3, 8, 2],
        backgroundColor: ['#4caf50', '#ff9800', '#2196f3', '#f44336'],
        borderWidth: 0
      }
    ]
  };

  const driverPerformanceRadarData = {
    labels: ['On-time Delivery', 'Fuel Efficiency', 'Safety Score', 'Customer Rating', 'Trip Completion'],
    datasets: (driverPerformance || []).slice(0, 3).map((driver, index) => ({
      label: driver?.name || `Driver ${index + 1}`,
      data: [
        driver?.onTimeDelivery || 0,
        (driver?.fuelEfficiency || 0) * 20, // Scale to 100
        driver?.safetyScore || 0,
        (driver?.rating || 0) * 20, // Scale to 100
        Math.min(((driver?.totalTrips || 0) / 50) * 100, 100) // Scale to 100
      ],
      backgroundColor: [`rgba(${index * 80 + 50}, ${100 + index * 50}, ${200 - index * 30}, 0.2)`],
      borderColor: [`rgba(${index * 80 + 50}, ${100 + index * 50}, ${200 - index * 30}, 1)`],
      borderWidth: 2
    }))
  };

  return (
    <ComponentErrorBoundary 
      componentName="Analytics Dashboard"
      fallbackMessage="The analytics dashboard failed to load. Please refresh the page."
    >
      <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnalyticsIcon /> BUSINESS INTELLIGENCE & ANALYTICS
        </Typography>
        <Typography variant="body1" color="text.secondary">
            Comprehensive fleet performance insights and data-driven decisions
        </Typography>
      </Box>
        <Stack direction="row" spacing={2}>
          <ButtonGroup variant="outlined">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range as any)}
                variant={timeRange === range ? 'contained' : 'outlined'}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
            </Button>
            ))}
          </ButtonGroup>
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExportReport}>
              Export Report
            </Button>
        </Stack>
      </Stack>

      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Key Performance Indicators */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <MoneyIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>₹{(summary.totalRevenue / 100000).toFixed(1)}L</Typography>
            <Typography variant="body2">Total Revenue</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {summary.profitMargin}% profit margin
                </Typography>
            </Card>
          </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <FuelIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{summary.avgFuelEfficiency}</Typography>
            <Typography variant="body2">Avg Efficiency (km/L)</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {fuelAnalysis.totalConsumption.toLocaleString()}L consumed
              </Typography>
            </Card>
          </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <VehicleIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{summary.activeVehicles}</Typography>
            <Typography variant="body2">Active Vehicles</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {summary.totalTrips} trips completed
              </Typography>
            </Card>
          </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
            <TimeIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{summary.onTimeDelivery}%</Typography>
            <Typography variant="body2">On-time Delivery</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {(summary.totalDistance / 1000).toFixed(0)}K km covered
              </Typography>
            </Card>
          </Grid>
        </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Revenue Trends */}
        <Grid item xs={12} lg={8}>
            <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              📈 FINANCIAL PERFORMANCE TRENDS
              </Typography>
            <Box sx={{ height: 400 }}>
              <ComponentErrorBoundary componentName="Revenue Chart" fallbackMessage="Revenue chart failed to load">
                <Line 
                  data={revenueChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `₹${(value as number / 1000).toFixed(0)}K`
                        }
                      }
                    }
                  }}
                />
              </ComponentErrorBoundary>
            </Box>
            </Card>
          </Grid>

        {/* Vehicle Status Distribution */}
        <Grid item xs={12} lg={4}>
            <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              🚛 FLEET STATUS DISTRIBUTION
              </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <ComponentErrorBoundary componentName="Vehicle Status Chart" fallbackMessage="Vehicle status chart failed to load">
                <Doughnut 
                  data={vehicleStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }}
                />
              </ComponentErrorBoundary>
            </Box>
            </Card>
        </Grid>

        {/* Fuel Efficiency Trends */}
        <Grid item xs={12} lg={6}>
            <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              ⛽ FUEL EFFICIENCY ANALYSIS
              </Typography>
            <Box sx={{ height: 300 }}>
              <ComponentErrorBoundary componentName="Fuel Efficiency Chart" fallbackMessage="Fuel efficiency chart failed to load">
                <Bar 
                  data={fuelEfficiencyData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                          callback: (value) => `${value} km/L`
                        }
                      }
                    }
                  }}
                />
              </ComponentErrorBoundary>
            </Box>
            </Card>
          </Grid>

        {/* Driver Performance Radar */}
        <Grid item xs={12} lg={6}>
            <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              👨‍🚚 TOP DRIVER PERFORMANCE COMPARISON
              </Typography>
            <Box sx={{ height: 300 }}>
              <ComponentErrorBoundary componentName="Driver Performance Radar" fallbackMessage="Driver performance radar chart failed to load">
                <Radar 
                  data={driverPerformanceRadarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' }
                    },
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }}
                />
              </ComponentErrorBoundary>
            </Box>
            </Card>
          </Grid>
        </Grid>

      {/* Performance Tables */}
        <Grid container spacing={3}>
        {/* Vehicle Performance */}
        <Grid item xs={12} lg={6}>
            <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              🚛 VEHICLE PERFORMANCE ANALYSIS
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Vehicle</strong></TableCell>
                    <TableCell><strong>Distance</strong></TableCell>
                    <TableCell><strong>Efficiency</strong></TableCell>
                    <TableCell><strong>Revenue</strong></TableCell>
                    <TableCell><strong>Profitability</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehiclePerformance.map((vehicle) => (
                    <TableRow key={vehicle.vehicleId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {vehicle.licensePlate}
                        </Typography>
                      </TableCell>
                      <TableCell>{vehicle.totalDistance.toLocaleString()} km</TableCell>
                      <TableCell>
                        <Chip 
                          label={`${vehicle.fuelEfficiency} km/L`}
                          color={vehicle.fuelEfficiency > 4.2 ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>₹{(vehicle.revenue / 1000).toFixed(0)}K</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {vehicle.profitability > 15 ? 
                            <TrendingUpIcon color="success" fontSize="small" /> :
                            <TrendingDownIcon color="error" fontSize="small" />
                          }
                          <Typography 
                            variant="body2" 
                            color={vehicle.profitability > 15 ? 'success.main' : 'error.main'}
                            sx={{ fontWeight: 600 }}
                          >
                            {vehicle.profitability}%
              </Typography>
                </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </Card>
          </Grid>

        {/* Driver Performance */}
        <Grid item xs={12} lg={6}>
              <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              👨‍🚚 DRIVER PERFORMANCE RANKINGS
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Driver</strong></TableCell>
                    <TableCell><strong>Rating</strong></TableCell>
                    <TableCell><strong>Trips</strong></TableCell>
                    <TableCell><strong>On-time %</strong></TableCell>
                    <TableCell><strong>Revenue</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {driverPerformance
                    .sort((a, b) => b.rating - a.rating)
                    .map((driver, index) => (
                    <TableRow key={driver.driverId} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                            {index + 1}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {driver.name}
                </Typography>
                </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {driver.rating}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ⭐
                </Typography>
                </Stack>
                      </TableCell>
                      <TableCell>{driver.totalTrips}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${driver.onTimeDelivery}%`}
                          color={driver.onTimeDelivery > 95 ? 'success' : driver.onTimeDelivery > 90 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>₹{(driver.revenue / 1000).toFixed(0)}K</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
              </Card>
        </Grid>
      </Grid>

      {/* Route Optimization Insights */}
      <Card sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          🎯 AI-POWERED ROUTE OPTIMIZATION IMPACT
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'white' }}>
              <SpeedIcon sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{routeOptimization.totalDistanceOptimized.toLocaleString()}</Typography>
              <Typography variant="body2">KM Saved</Typography>
                </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2, color: 'white' }}>
              <FuelIcon sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{routeOptimization.fuelSaved.toLocaleString()}</Typography>
              <Typography variant="body2">Liters Saved</Typography>
                </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2, color: 'white' }}>
              <TimeIcon sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{routeOptimization.timeSaved}</Typography>
              <Typography variant="body2">Hours Saved</Typography>
                </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
              <MoneyIcon sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>₹{(routeOptimization.costSavings / 1000).toFixed(0)}K</Typography>
              <Typography variant="body2">Cost Savings</Typography>
                </Box>
          </Grid>
        </Grid>
      </Card>
      </Box>
    </ComponentErrorBoundary>
  );
}