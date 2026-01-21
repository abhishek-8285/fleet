import { useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  useTheme,
  Button,
  Stack,
  Chip,
  LinearProgress
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  LocalShipping,
  AttachMoney,
  AccessTime,
  Speed,
  Warning
} from '@mui/icons-material'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
)

export default function Analytics() {
  const theme = useTheme()
  const [timeRange, setTimeRange] = useState('7d')

  // Glass Effect Helper
  const GlassCard = ({ children, sx = {} }: any) => (
    <Card
      sx={{
        p: 3,
        height: '100%',
        bgcolor: 'glass.card',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 5,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        ...sx
      }}
    >
      {children}
    </Card>
  )

  // KPI Card Component
  const KPICard = ({ title, value, subtext, trend, icon: Icon, color }: any) => (
    <GlassCard>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon sx={{ fontSize: 28 }} />
        </Box>
        {trend && (
          <Chip
            size="small"
            icon={trend > 0 ? <TrendingUp /> : <TrendingDown />}
            label={`${Math.abs(trend)}%`}
            sx={{
              bgcolor: trend > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: trend > 0 ? '#34D399' : '#F87171',
              fontWeight: 600,
              borderRadius: 2
            }}
          />
        )}
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.02em' }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
      {subtext && (
        <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.7, mt: 1, display: 'block' }}>
          {subtext}
        </Typography>
      )}
    </GlassCard>
  )

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#F1F5F9',
        bodyColor: '#CBD5E1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: '#94A3B8'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#94A3B8'
        }
      }
    }
  }

  // Sample Data
  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue',
        data: [12500, 15000, 11000, 18000, 16500, 19500, 22000],
        borderColor: theme.palette.primary.main,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx
          const gradient = ctx.createLinearGradient(0, 0, 0, 300)
          gradient.addColorStop(0, `${theme.palette.primary.main}50`)
          gradient.addColorStop(1, `${theme.palette.primary.main}00`)
          return gradient
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }

  const efficiencyData = {
    labels: ['W1', 'W2', 'W3', 'W4'],
    datasets: [
      {
        label: 'Fuel Efficiency (km/L)',
        data: [3.8, 4.0, 4.2, 4.5],
        backgroundColor: theme.palette.secondary.main,
        borderRadius: 8,
        barThickness: 20
      }
    ]
  }

  const statusData = {
    labels: ['Active', 'Idle', 'Maintenance'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.error.main
        ],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h2" sx={{
            fontWeight: 800,
            mb: 1,
            background: theme.palette.gradients.emerald,
            backgroundClip: 'text',
            textFillColor: 'transparent'
          }}>
            Performance Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time insights into your fleet's operational efficiency
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {['24h', '7d', '30d', '90d'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setTimeRange(range)}
              sx={{
                borderRadius: 3,
                minWidth: 60,
                bgcolor: timeRange === range ? theme.palette.primary.main : 'transparent',
                borderColor: timeRange === range ? 'transparent' : 'rgba(255,255,255,0.1)',
                color: timeRange === range ? 'white' : 'text.secondary'
              }}
            >
              {range}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* KPI Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value="₹12.5L"
            subtext="Vs ₹10.2L last week"
            trend={18.2}
            icon={AttachMoney}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Vehicles"
            value="48/52"
            subtext="92% utilization rate"
            trend={5.4}
            icon={LocalShipping}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Avg Delivery Time"
            value="4.2h"
            subtext="-30min vs target"
            trend={-7.5} // Negative trend is good here conceptually, but icon logic handles up/down
            icon={AccessTime}
            color="#3B82F6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Fuel Efficiency"
            value="4.5 km/L"
            subtext="+0.3 km/L improvement"
            trend={6.8}
            icon={Speed}
            color="#8B5CF6"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} lg={8}>
          <GlassCard>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700}>Revenue Trends</Typography>
              <Button size="small" endIcon={<TrendingUp />} sx={{ color: 'success.main' }}>
                View Report
              </Button>
            </Box>
            <Box sx={{ height: 350 }}>
              <Line options={chartOptions} data={revenueData} />
            </Box>
          </GlassCard>
        </Grid>

        {/* Fleet Status & Alerts */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            {/* Status Donut */}
            <GlassCard sx={{ flex: 1, minHeight: 300 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Fleet Status</Typography>
              <Box sx={{ height: 200, position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Doughnut
                  data={statusData}
                  options={{
                    ...chartOptions,
                    cutout: '75%',
                    plugins: {
                      legend: { position: 'bottom', labels: { color: '#94A3B8', usePointStyle: true } }
                    }
                  }}
                />
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={800}>52</Typography>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                </Box>
              </Box>
            </GlassCard>

            {/* Recent Alerts */}
            <GlassCard sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Critical Alerts</Typography>
                <Chip label="3 New" size="small" color="error" sx={{ ml: 2, height: 20 }} />
              </Box>
              <Stack spacing={2}>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Warning color="error" fontSize="small" sx={{ mt: 0.3 }} />
                    <Box>
                      <Typography variant="subtitle2" color="error.light" fontWeight={600}>Fuel Theft Suspected</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Vehicle MH-12-AB-3456 • 15 mins ago</Typography>
                      <Typography variant="caption" sx={{ color: 'error.light', opacity: 0.8 }}>-15L drops in 2 mins</Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Warning color="warning" fontSize="small" sx={{ mt: 0.3 }} />
                    <Box>
                      <Typography variant="subtitle2" color="warning.light" fontWeight={600}>Maintenance Overdue</Typography>
                      <Typography variant="caption" color="text.secondary">Vehicle KA-05-XY-7890 • 2 days overdue</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </GlassCard>
          </Stack>
        </Grid>

        {/* Efficiency Bar Chart */}
        <Grid item xs={12} md={6}>
          <GlassCard>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Weekly Fuel Efficiency</Typography>
            <Box sx={{ height: 250 }}>
              <Bar options={chartOptions} data={efficiencyData} />
            </Box>
          </GlassCard>
        </Grid>

        {/* Driver Performance Leaderboard */}
        <Grid item xs={12} md={6}>
          <GlassCard>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={700}>Top Drivers</Typography>
              <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>View All</Typography>
            </Box>
            <Stack spacing={2}>
              {[
                { name: 'Rajesh Kumar', score: 98, role: 'Senior Driver' },
                { name: 'Vikram Singh', score: 95, role: 'Driver' },
                { name: 'Amit Patel', score: 92, role: 'Driver' }
              ].map((driver, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: theme.palette.primary.light
                    }}>{driver.name[0]}</Box>
                    <Box>
                      <Typography variant="subtitle2">{driver.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{driver.role}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right', minWidth: 100 }}>
                    <Typography variant="subtitle2" color="success.main">{driver.score}/100</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={driver.score}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'rgba(255,255,255,0.05)',
                        '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'success.main' }
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  )
}