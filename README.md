# Modular Biometric Authentication System

A plug-and-play biometric authentication system that uses a mobile phone's fingerprint sensor to approve sensitive actions from web applications.

## Overview

This system provides a secure, modular way to add biometric authentication to any web application. It consists of three main components:

1. **Backend Authentication Server**: A Python FastAPI server that handles authentication requests and verification
2. **Mobile Client App**: An Android app that uses the device's fingerprint sensor for biometric authentication
3. **Web Client SDK**: A JavaScript/TypeScript library for web applications to integrate with the system

## System Architecture

The system uses a challenge-response mechanism secured by asymmetric cryptography:

1. Web app requests authentication for a user
2. Backend generates a unique challenge (nonce)
3. Mobile app receives the challenge and prompts for fingerprint
4. When verified, the mobile app signs the challenge with a private key
5. Backend verifies the signature using the registered public key
6. If valid, backend issues a JWT token to the web app

See the [architecture diagram](docs/architecture.md) for a visual representation.

## Getting Started

### Prerequisites

- Node.js 14+ or Python 3.8+ for the backend server
- Android Studio for mobile app development
- Docker and Docker Compose (optional, for containerized deployment)

### Backend Server Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/bioauth-system.git
   cd bioauth-system/backend
   ```

2. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

3. Generate self-signed TLS certificates (for development)
   ```bash
   mkdir certs
   openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes
   ```

4. Run the server
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000 --ssl-keyfile certs/key.pem --ssl-certfile certs/cert.pem
   ```

### Mobile App Setup

1. Open the mobile app project in Android Studio
   ```bash
   cd bioauth-system/mobile
   ```

2. Update the server URL in `MainActivity.kt` to point to your backend server
   ```kotlin
   private val SERVER_URL = "wss://your-server-url.com/ws/device/"
   ```

3. Build and install the app on your Android device

### Web SDK Integration

1. Install the SDK in your web project
   ```bash
   npm install bioauth-sdk
   # or
   yarn add bioauth-sdk
   ```

2. Import and use the SDK
   ```javascript
   import { BioAuthClient } from 'bioauth-sdk';

   const bioAuth = new BioAuthClient({
     serverUrl: 'https://your-auth-server.com',
   });

   // Request authentication
   const result = await bioAuth.requestAuth({
     userId: 'user123',
     action: 'login',
   });

   // If approved, use the JWT token
   if (result.status === 'approved') {
     const token = result.token;
     // Use token for authenticated API requests
   }
   ```

### Docker Deployment

For easy deployment, use Docker Compose:

```bash
# Start the services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Security Considerations

- **TLS**: Always use HTTPS/WSS in production environments
- **JWT Secret**: Change the default JWT secret in production
- **Public Key Infrastructure**: In a production environment, consider using a proper PKI for key management
- **Token Validation**: Always validate JWTs on the server side
- **Device Registration**: Implement a secure device registration process

## Customization

### Backend

- Database Integration: Replace in-memory storage with a database like PostgreSQL
- Redis: For production, enable the Redis service for distributed request storage
- User Management: Integrate with your existing user management system

### Mobile App

- UI Customization: Modify the app's UI to match your brand
- Push Notifications: Add push notification support for better user experience
- Multiple Devices: Implement support for multiple devices per user

### Web SDK

- Custom UI: Create a custom UI for the authentication flow
- Timeouts: Adjust timeouts based on your security requirements
- Automatic Retries: Implement automatic retry logic for failed requests

## API Documentation

The backend server exposes the following endpoints:

- `POST /register-device`: Register a new mobile device
- `POST /request-auth`: Request biometric authentication
- `GET /auth-status/{request_id}`: Check authentication status
- `WebSocket /ws/device/{device_id}`: WebSocket connection for mobile devices
- `WebSocket /ws/client/{request_id}`: WebSocket connection for web clients

For detailed API documentation, see the [API docs](docs/api.md) or visit the Swagger UI at `https://your-server-url/docs`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.