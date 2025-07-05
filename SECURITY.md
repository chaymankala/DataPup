# Security Documentation

## Secure Storage Implementation

Data-Pup implements a secure storage system for database connection credentials using multiple layers of protection:

### 1. Encryption Layer

- **Algorithm**: AES-256-CBC encryption
- **Key Generation**: Machine-specific deterministic key derived from:
  - Application user data path
  - Application name
  - Application version
- **Initialization Vector**: Random 16-byte IV for each encryption operation
- **Storage Format**: `iv:encrypted_data` (hex encoded)

### 2. Storage Location

- **Path**: `app.getPath('userData')/connections.json`
- **Permissions**: User-specific directory with appropriate file permissions
- **Platform-specific locations**:
  - macOS: `~/Library/Application Support/Data-Pup/`
  - Windows: `%APPDATA%\Data-Pup\`
  - Linux: `~/.config/Data-Pup/`

### 3. Data Structure

```typescript
interface DatabaseConnection {
  id: string                    // Unique identifier
  name: string                  // Display name
  type: string                  // Database type (postgresql, mysql, etc.)
  host: string                  // Host address
  port: number                  // Port number
  database: string              // Database name
  username: string              // Username
  password: string              // Encrypted password
  createdAt: string             // ISO timestamp
  lastUsed?: string             // Last connection timestamp
}
```

### 4. Security Features

#### Encryption
- Passwords are encrypted using AES-256-CBC
- Each encryption uses a unique IV
- Machine-specific encryption key prevents cross-machine decryption

#### Access Control
- Data stored in user-specific directories
- File permissions follow OS security standards
- No network transmission of credentials

#### Memory Management
- Passwords are decrypted only when needed
- Memory is cleared after use
- No persistent storage of decrypted passwords

### 5. Usage Flow

1. **Saving Connection**:
   - User enters connection details
   - Password is encrypted with machine-specific key
   - All data saved to local JSON file
   - Connection ID generated for future reference

2. **Loading Connection**:
   - Encrypted data loaded from file
   - Password decrypted only when connecting
   - Connection details used for database connection

3. **Deleting Connection**:
   - Connection removed from local storage
   - No traces left in memory or disk

### 6. Security Considerations

#### What's Protected
- ✅ Database passwords
- ✅ Connection credentials
- ✅ User-specific data

#### What's NOT Protected
- ❌ Host addresses (needed for connection)
- ❌ Port numbers (standard information)
- ❌ Database names (often public)
- ❌ Usernames (often public)

#### Limitations
- Encryption key is machine-specific (not portable)
- No keychain integration (future enhancement)
- No master password protection (future enhancement)

### 7. Future Enhancements

1. **System Keychain Integration**:
   - Use macOS Keychain, Windows Credential Manager, or Linux Secret Service
   - Better integration with OS security features

2. **Master Password**:
   - User-defined master password for additional protection
   - PBKDF2 key derivation for master key

3. **Portable Encryption**:
   - Export/import encrypted connections
   - Cross-machine credential sharing

4. **Audit Logging**:
   - Track connection attempts
   - Log security events

### 8. Best Practices for Users

1. **Regular Updates**: Keep Data-Pup updated for security patches
2. **Strong Passwords**: Use strong database passwords
3. **Limited Access**: Use database users with minimal required permissions
4. **Network Security**: Ensure database connections use SSL/TLS
5. **Physical Security**: Protect the device storing the credentials

### 9. Compliance

This implementation provides:
- **Local-only storage**: No cloud storage of credentials
- **Encryption at rest**: All sensitive data is encrypted
- **User control**: Users can delete saved connections
- **Transparency**: Open source code for security review

### 10. Reporting Security Issues

If you discover a security vulnerability, please:
1. **Do NOT** create a public issue
2. Email security details to: [security@datapup.dev]
3. Include detailed reproduction steps
4. Allow time for investigation and fix

---

**Note**: This security implementation is designed for local development use. For production environments, consider additional security measures such as enterprise key management systems. 