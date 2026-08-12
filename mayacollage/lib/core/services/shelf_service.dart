import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ShelfService {
  static String get _baseUrl => '${dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api')}/shelves';

  static Future<List<dynamic>> getAllShelves() async {
    final response = await http.get(Uri.parse(_baseUrl));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load shelves');
  }

  static Future<Map<String, dynamic>> createShelf(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse(_baseUrl),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 201) return json.decode(response.body);
    throw Exception('Failed to create shelf');
  }

  static Future<Map<String, dynamic>> updateShelf(String id, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$_baseUrl/$id'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 200) return json.decode(response.body);
    throw Exception('Failed to update shelf');
  }

  static Future<void> deleteShelf(String id) async {
    final response = await http.delete(Uri.parse('$_baseUrl/$id'));
    if (response.statusCode != 200) throw Exception('Failed to delete shelf');
  }
}
