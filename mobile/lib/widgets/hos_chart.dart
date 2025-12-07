import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';

class HosChart extends StatelessWidget {
  const HosChart({super.key});

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1.70,
      child: Padding(
        padding: const EdgeInsets.only(
          right: 18,
          left: 12,
          top: 24,
          bottom: 12,
        ),
        child: LineChart(
          mainData(),
        ),
      ),
    );
  }

  LineChartData mainData() {
    return LineChartData(
      gridData: FlGridData(
        show: true,
        drawVerticalLine: true,
        horizontalInterval: 1,
        verticalInterval: 4,
        getDrawingHorizontalLine: (value) {
          return FlLine(
            color: Colors.white.withValues(alpha: 0.1),
            strokeWidth: 1,
          );
        },
        getDrawingVerticalLine: (value) {
          return FlLine(
            color: Colors.white.withValues(alpha: 0.1),
            strokeWidth: 1,
          );
        },
      ),
      titlesData: FlTitlesData(
        show: true,
        rightTitles: const AxisTitles(
          sideTitles: SideTitles(showTitles: false),
        ),
        topTitles: const AxisTitles(
          sideTitles: SideTitles(showTitles: false),
        ),
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 30,
            interval: 4,
            getTitlesWidget: bottomTitleWidgets,
          ),
        ),
        leftTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            interval: 1,
            getTitlesWidget: leftTitleWidgets,
            reservedSize: 42,
          ),
        ),
      ),
      borderData: FlBorderData(
        show: true,
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      minX: 0,
      maxX: 24,
      minY: 0,
      maxY: 3,
      lineBarsData: [
        LineChartBarData(
          spots: const [
            FlSpot(0, 3), // OFF
            FlSpot(6, 3),
            FlSpot(6, 2), // SB
            FlSpot(7, 2),
            FlSpot(7, 0), // D
            FlSpot(11, 0),
            FlSpot(11, 3), // OFF
            FlSpot(12, 3),
            FlSpot(12, 0), // D
            FlSpot(16, 0),
            FlSpot(16, 1), // ON
            FlSpot(17, 1),
            FlSpot(17, 3), // OFF
            FlSpot(24, 3),
          ],
          isCurved: false,
          color: AppTheme.accent,
          barWidth: 3,
          isStrokeCapRound: true,
          dotData: const FlDotData(
            show: false,
          ),
          belowBarData: BarAreaData(
            show: true,
            gradient: LinearGradient(
              colors: [
                AppTheme.accent.withValues(alpha: 0.3),
                AppTheme.accent.withValues(alpha: 0.0),
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        ),
      ],
    );
  }

  Widget bottomTitleWidgets(double value, TitleMeta meta) {
    final style = AppTextStyles.label.copyWith(
      fontWeight: FontWeight.bold,
      color: Colors.white.withValues(alpha: 0.5),
    );
    Widget text;
    switch (value.toInt()) {
      case 0:
        text = Text('M', style: style);
        break;
      case 4:
        text = Text('4', style: style);
        break;
      case 8:
        text = Text('8', style: style);
        break;
      case 12:
        text = Text('N', style: style);
        break;
      case 16:
        text = Text('16', style: style);
        break;
      case 20:
        text = Text('20', style: style);
        break;
      case 24:
        text = Text('M', style: style);
        break;
      default:
        text = Text('', style: style);
        break;
    }

    return SideTitleWidget(
      meta: meta,
      child: text,
    );
  }

  Widget leftTitleWidgets(double value, TitleMeta meta) {
    final style = AppTextStyles.label.copyWith(
      fontWeight: FontWeight.bold,
      fontSize: 10,
      color: Colors.white.withValues(alpha: 0.5),
    );
    String text;
    switch (value.toInt()) {
      case 0:
        text = 'D';
        break;
      case 1:
        text = 'ON';
        break;
      case 2:
        text = 'SB';
        break;
      case 3:
        text = 'OFF';
        break;
      default:
        return Container();
    }

    return Text(text, style: style, textAlign: TextAlign.left);
  }
}

