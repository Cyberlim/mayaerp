import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService {
  static io.Socket? _socket;

  static void init() {
    if (_socket != null) return;

    final String serverUrl = dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api').replaceAll('/api', '');
    
    _socket = io.io(serverUrl, 
      io.OptionBuilder()
        .setTransports(['websocket'])
        .enableAutoConnect()
        .build()
    );

    _socket!.onConnect((_) => print('Connected to admin socket server'));
    _socket!.onDisconnect((_) => print('Disconnected from admin socket server'));
  }

  static void onBusUpdated(Function(dynamic) callback) {
    if (_socket == null) init();
    _socket!.on('bus_added', (data) => callback(data));
    _socket!.on('bus_updated', (data) => callback(data));
    _socket!.on('student_assigned', (data) => callback(data));
    _socket!.on('student_unassigned', (data) => callback(data));
    _socket!.on('bus_deleted', (data) => callback(data));
  }

  static void onNewFeePayment(Function(dynamic) callback) {
    if (_socket == null) init();
    _socket!.on('new_fee_payment', (data) => callback(data));
  }

  static void onStudentDocumentsUpdated(Function(dynamic) callback) {
    if (_socket == null) init();
    _socket!.on('student_documents_updated', (data) => callback(data));
  }

  static void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
