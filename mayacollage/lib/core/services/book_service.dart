import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class BookService {
  static String get _baseUrl => '${dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api')}/books';

  static Future<List<dynamic>> getAllBooks() async {
    final response = await http.get(Uri.parse(_baseUrl));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load books');
  }

  static Future<List<dynamic>> getBooksByShelf(String shelfName) async {
    final response = await http.get(Uri.parse('$_baseUrl/shelf/$shelfName'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load books for shelf');
  }

  static Future<Map<String, dynamic>> createBook(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse(_baseUrl),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 201) return json.decode(response.body);
    throw Exception('Failed to add book');
  }

  static Future<Map<String, dynamic>> updateBook(String id, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$_baseUrl/$id'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 200) return json.decode(response.body);
    throw Exception('Failed to update book');
  }

  static Future<void> deleteBook(String id) async {
    final response = await http.delete(Uri.parse('$_baseUrl/$id'));
    if (response.statusCode != 200) throw Exception('Failed to delete book');
  }
}
