import 'dart:convert';
import 'package:http/http.dart' as http;
import '../app_constants.dart';

class FeeService {
  static String get _baseUrl => '${AppConstants.apiBaseUrl}/fees';

  static Future<List<dynamic>> getAllTransactions() async {
    final response = await http.get(Uri.parse('$_baseUrl/all'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load transactions');
    }
  }

  static Future<Map<String, dynamic>> getStudentFeeStatus(String studentId) async {
    final response = await http.get(Uri.parse('$_baseUrl/student/$studentId'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load fee status');
    }
  }
}
