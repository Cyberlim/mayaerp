import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class DashboardService {
  static String get _baseUrl => '${dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api')}/dashboard';

  static Future<Map<String, dynamic>> getStats() async {
    final response = await http.get(Uri.parse('$_baseUrl/stats'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load dashboard stats');
  }
}
