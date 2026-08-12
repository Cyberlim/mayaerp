import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class NoticeService {
  static String get baseUrl => '${dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api')}/notices';

  static Future<Map<String, dynamic>> createNotice(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl/create'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to create notice');
    }
  }

  static Future<List<dynamic>> getAllNotices({String? targetClass, String? author}) async {
    String url = '$baseUrl/all';
    if (targetClass != null || author != null) {
      url += '?';
      if (targetClass != null) url += 'targetClass=$targetClass&';
      if (author != null) url += 'author=$author&';
    }

    final response = await http.get(Uri.parse(url));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to fetch notices');
    }
  }

  static Future<void> deleteNotice(String id) async {
    final response = await http.delete(Uri.parse('$baseUrl/delete/$id'));
    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['message'] ?? 'Failed to delete notice');
    }
  }

  static Future<void> incrementView(String id) async {
    await http.put(Uri.parse('$baseUrl/view/$id'));
  }
}
