import 'dart:ui' as ui;
import 'package:flutter/material.dart';

class PremiumStatsCard extends StatefulWidget {
  final String title;
  final String value;
  final String subValue;
  final String percentage;
  final IconData icon;
  final List<Color> gradientColors;
  final List<Offset> chartPoints;
  final Color chartColor;
  final String selectedTimeline;
  final ValueChanged<String> onTimelineChanged;
  
  final String bottomLabel1;
  final String bottomValue1;
  final String bottomLabel2;
  final String bottomValue2;
  final String bottomLabel3;
  final String bottomValue3;

  const PremiumStatsCard({
    super.key,
    required this.title,
    required this.value,
    required this.subValue,
    required this.percentage,
    required this.icon,
    required this.gradientColors,
    required this.chartPoints,
    required this.chartColor,
    required this.selectedTimeline,
    required this.onTimelineChanged,
    this.bottomLabel1 = "Today's Target",
    this.bottomValue1 = "85%",
    this.bottomLabel2 = "Active Now",
    this.bottomValue2 = "248",
    this.bottomLabel3 = "Weekly Avg",
    this.bottomValue3 = "92%",
  });

  @override
  State<PremiumStatsCard> createState() => _PremiumStatsCardState();
}

class _PremiumStatsCardState extends State<PremiumStatsCard> with SingleTickerProviderStateMixin {
  late AnimationController _dotController;

  @override
  void initState() {
    super.initState();
    _dotController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
  }

  @override
  void dispose() {
    _dotController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: widget.gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: widget.gradientColors.last.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header Row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.15),
                        ),
                        child: Icon(widget.icon, color: Colors.white, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Flexible(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              widget.subValue,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Colors.white.withValues(alpha: 0.6),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      widget.percentage,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      widget.value,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Graph Section
          const SizedBox(height: 4),
          SizedBox(
            height: 85, // More Compact Height
            width: double.infinity,
            child: Stack(
              children: [
                // The Path
                CustomPaint(
                  size: const Size(double.infinity, 100),
                  painter: LineGraphPainter(
                    points: widget.chartPoints,
                    color: Colors.white, // White line for contrast on gradients
                    isBackground: true,
                  ),
                ),
                // The Animated Dot
                AnimatedBuilder(
                  animation: _dotController,
                  builder: (context, child) {
                    return CustomPaint(
                      size: const Size(double.infinity, 90),
                      painter: LineGraphPainter(
                        points: widget.chartPoints,
                        color: Colors.white, // White dot for contrast
                        dotProgress: _dotController.value,
                        isBackground: false,
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          
          // Footer / Tabs
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _timeTab("1H"),
                  _timeTab("1W"),
                  _timeTab("1M"),
                  _timeTab("1Y"),
                  _timeTab("All"),
                ],
              ),
            ),
          ),
          
          // Secondary Stats
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: _miniStat(widget.bottomLabel1, widget.bottomValue1)),
                Expanded(child: Center(child: _miniStat(widget.bottomLabel2, widget.bottomValue2, isGreen: true))),
                Expanded(child: Align(alignment: Alignment.centerRight, child: _miniStat(widget.bottomLabel3, widget.bottomValue3))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _timeTab(String label) {
    bool isSelected = widget.selectedTimeline == label;
    return Expanded(
      child: InkWell(
        onTap: () => widget.onTimelineChanged(label),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white.withValues(alpha: 0.2) : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w900,
              color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.8),
            ),
          ),
        ),
      ),
    );
  }

  Widget _miniStat(String label, String value, {bool isGreen = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.bold,
            color: Colors.white.withValues(alpha: 0.5),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            color: isGreen ? Colors.white : Colors.white.withValues(alpha: 0.9),
          ),
        ),
      ],
    );
  }
}

class LineGraphPainter extends CustomPainter {
  final List<Offset> points;
  final Color color;
  final double? dotProgress;
  final bool isBackground;

  LineGraphPainter({
    required this.points,
    required this.color,
    this.dotProgress,
    required this.isBackground,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;

    final path = Path();
    final gradientPath = Path();

    double xStep = size.width / (points.length - 1);
    
    // Normalize and scale points
    List<Offset> scaledPoints = [];
    for (int i = 0; i < points.length; i++) {
        scaledPoints.add(Offset(i * xStep, size.height - (points[i].dy * size.height)));
    }

    path.moveTo(scaledPoints[0].dx, scaledPoints[0].dy);
    gradientPath.moveTo(scaledPoints[0].dx, scaledPoints[0].dy);

    for (int i = 1; i < scaledPoints.length; i++) {
      // Cubic bezier approach for smooth lines
      final prev = scaledPoints[i - 1];
      final current = scaledPoints[i];
      final cp1 = Offset(prev.dx + (current.dx - prev.dx) / 2, prev.dy);
      final cp2 = Offset(prev.dx + (current.dx - prev.dx) / 2, current.dy);
      path.cubicTo(cp1.dx, cp1.dy, cp2.dx, cp2.dy, current.dx, current.dy);
      gradientPath.cubicTo(cp1.dx, cp1.dy, cp2.dx, cp2.dy, current.dx, current.dy);
    }

    if (isBackground) {
      // Draw Area Gradient
      gradientPath.lineTo(size.width, size.height);
      gradientPath.lineTo(0, size.height);
      gradientPath.close();

      final paintGradient = Paint()
        ..shader = ui.Gradient.linear(
          const Offset(0, 0),
          Offset(0, size.height),
          [color.withValues(alpha: 0.3), color.withValues(alpha: 0.0)],
        )
        ..style = PaintingStyle.fill;
      canvas.drawPath(gradientPath, paintGradient);

      // Draw Main Line
      final paintLine = Paint()
        ..color = color.withValues(alpha: 0.7)
        ..strokeWidth = 2.5
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round;
      canvas.drawPath(path, paintLine);
    }

    // Draw Traveling Dot
    if (dotProgress != null) {
      final metrics = path.computeMetrics().first;
      final tangent = metrics.getTangentForOffset(metrics.length * dotProgress!);
      
      if (tangent != null) {
        // Outer Glow
        final paintGlow = Paint()
          ..color = color.withValues(alpha: 0.3)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);
        canvas.drawCircle(tangent.position, 10, paintGlow);

        // Dot Shadow (Drawn as a circle with an offset position)
        final paintDotShadow = Paint()
          ..color = Colors.black.withValues(alpha: 0.1)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
        canvas.drawCircle(tangent.position.translate(0, 4), 6, paintDotShadow);

        // Dot Border
        final paintDotBorder = Paint()
          ..color = Colors.white
          ..style = PaintingStyle.fill;
        canvas.drawCircle(tangent.position, 7, paintDotBorder);

        // Inner Dot
        final paintDot = Paint()
          ..color = Colors.white
          ..style = PaintingStyle.fill;
        canvas.drawCircle(tangent.position, 4, paintDot);
      }
    }
  }

  @override
  bool shouldRepaint(covariant LineGraphPainter oldDelegate) => true;
}
