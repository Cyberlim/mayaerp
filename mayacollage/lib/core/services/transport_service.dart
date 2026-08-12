import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class TransportService {
  static String get _baseUrl => '${dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api')}/transport';

  static Future<List<Map<String, dynamic>>> getBuses() async {
    final response = await http.get(Uri.parse('$_baseUrl/buses'));
    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    }
    throw Exception('Failed to load fleet data');
  }

  static Future<Map<String, dynamic>> createBus(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/bus'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    }
    final error = jsonDecode(response.body);
    throw Exception(error['message'] ?? 'Failed to register bus');
  }

  static Future<Map<String, dynamic>> assignStudent(String busId, String studentId, String stopName) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/assign-student'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'busId': busId, 'studentId': studentId, 'stopName': stopName}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    final error = jsonDecode(response.body);
    throw Exception(error['message'] ?? 'Failed to assign student');
  }

  static Future<Map<String, dynamic>> unassignStudent(String busId, String studentId) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/unassign-student'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'busId': busId, 'studentId': studentId}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    final error = jsonDecode(response.body);
    throw Exception(error['message'] ?? 'Failed to remove student');
  }

  static Future<void> deleteBus(String busId) async {
    final response = await http.delete(Uri.parse('$_baseUrl/bus/$busId'));
    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to delete bus');
    }
  }
}
