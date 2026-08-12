import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class InquiryService {
  static String get _baseUrl => '${dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api')}/inquiries';

  static Future<List<dynamic>> getAllInquiries() async {
    final response = await http.get(Uri.parse(_baseUrl));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load inquiries');
  }

  static Future<Map<String, dynamic>> createInquiry(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse(_baseUrl),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 201) {
      return json.decode(response.body);
    }
    throw Exception('Failed to create inquiry');
  }

  static Future<void> updateInquiryStatus(String id, String status) async {
    final response = await http.patch(
      Uri.parse('$_baseUrl/$id/status'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'status': status}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update inquiry status');
    }
  }

  static Future<void> deleteInquiry(String id) async {
    final response = await http.delete(Uri.parse('$_baseUrl/$id'));
    if (response.statusCode != 200) {
      throw Exception('Failed to delete inquiry');
    }
  }
}
