import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class LibraryService {
  static String get _baseUrl => '${dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api')}/library';

  static Future<List<dynamic>> getCirculation() async {
    final response = await http.get(Uri.parse('$_baseUrl/circulation'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load circulation records');
  }

  static Future<Map<String, dynamic>> getLibraryStats() async {
    final response = await http.get(Uri.parse('$_baseUrl/stats'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load library stats');
  }

  static Future<Map<String, dynamic>> issueBook({
    required String studentId,
    required String bookId,
    required String dueDate,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/issue'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'student': studentId,
        'book': bookId,
        'dueDate': dueDate,
      }),
    );
    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Failed to request issue');
    }
  }

  static Future<void> verifyIssue(String issueId, String otp) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/verify'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'issueId': issueId, 'otp': otp}),
    );
    if (response.statusCode != 200) {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Failed to verify OTP');
    }
  }

  static Future<void> returnBook(String issueId) async {
    final response = await http.put(Uri.parse('$_baseUrl/return/$issueId'));
    if (response.statusCode != 200) {
      throw Exception('Failed to return book');
    }
  }

  static Future<void> payFine(String issueId) async {
    final response = await http.put(Uri.parse('$_baseUrl/pay-fine/$issueId'));
    if (response.statusCode != 200) {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Failed to process payment');
    }
  }
}
