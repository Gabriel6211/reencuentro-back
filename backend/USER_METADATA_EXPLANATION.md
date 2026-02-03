# User Metadata in Supabase - Explanation

## What is User Metadata?

**User metadata** (`user_metadata`) is a JSON object in Supabase that stores additional, user-editable information about a user. It's different from `app_metadata` (which is admin-only) and is automatically included in the JWT token.

## Key Characteristics

1. **User-editable**: Users can update their own metadata (unlike `app_metadata`)
2. **Included in JWT**: Automatically available in the access token
3. **Flexible JSON**: Can store any JSON-serializable data
4. **Public**: Can be accessed by the user themselves

## Types of Metadata in Supabase

### 1. `user_metadata` (User Metadata)
- **Purpose**: User-editable custom data
- **Access**: User can read/write, backend can read/write
- **Example**: Display name, avatar URL, preferences

### 2. `app_metadata` (App Metadata)
- **Purpose**: Backend/admin-only custom data
- **Access**: Backend/admin only, user cannot read/write
- **Example**: Stripe customer ID, subscription tier, roles

### 3. `raw_user_meta_data`
- **Purpose**: Raw user metadata (before processing)
- **Access**: Same as `user_metadata` but unprocessed

## How It's Used in This Codebase

### During Registration

When a user registers, you can optionally pass metadata:

```typescript
// Request body example
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "metadata": {
    "full_name": "John Doe",
    "phone": "+1234567890",
    "preferences": {
      "notifications": true,
      "language": "en"
    }
  }
}
```

### Storage Flow

1. **Client sends metadata** → Controller receives it (line 48)
2. **Service passes to Supabase** → `signUp({ options: { data: metadata } })` (line 29)
3. **Supabase stores it** → As `user_metadata` in the user record
4. **Returned in response** → Included in `user.user_metadata` (line 77)

### Accessing Metadata

After login/registration, metadata is returned in the response:

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "metadata": {
      "full_name": "John Doe",
      "phone": "+1234567890",
      "preferences": {
        "notifications": true,
        "language": "en"
      }
    }
  },
  "access_token": "...",
  "refresh_token": "..."
}
```

## Common Use Cases for User Metadata

### 1. User Profile Information
```typescript
metadata: {
  full_name: "John Doe",
  avatar_url: "https://example.com/avatar.jpg",
  bio: "Pet lover and rescuer",
  location: "New York, NY"
}
```

### 2. Application Preferences
```typescript
metadata: {
  preferences: {
    notifications: true,
    language: "en",
    theme: "dark"
  }
}
```

### 3. Pet-Related Data (for your platform)
```typescript
metadata: {
  pet_owner: true,
  pets: ["pet-id-1", "pet-id-2"],
  phone: "+1234567890",
  address: "123 Main St"
}
```

### 4. Onboarding Status
```typescript
metadata: {
  onboarding_completed: false,
  last_onboarding_step: 2,
  account_type: "pet_owner"
}
```

## Limitations & Best Practices

### ⚠️ Limitations
- **Size limit**: Keep metadata under 32KB
- **Performance**: Large metadata slows down JWT token size
- **Type safety**: It's `any` type, so validate on frontend

### ✅ Best Practices
1. **Keep it small**: Store only frequently-needed data in metadata
2. **Use database for large/complex data**: Store detailed info in your database tables
3. **Validate input**: Always validate metadata on the backend
4. **Type safety**: Create TypeScript interfaces for expected metadata structure

## Updating Metadata

Users can update their own metadata. You could add an endpoint like:

```typescript
// Future endpoint example
PUT /api/auth/profile
{
  "metadata": {
    "full_name": "Jane Doe",
    "phone": "+0987654321"
  }
}
```

Then in the service:
```typescript
await supabase.auth.updateUser({
  data: { ...existingMetadata, ...newMetadata }
})
```

## Example: Complete Registration Flow

```bash
# Registration request
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "petowner@example.com",
    "password": "securepass123",
    "metadata": {
      "full_name": "Maria Garcia",
      "phone": "+1-555-0123",
      "account_type": "pet_owner",
      "preferences": {
        "notifications": true,
        "language": "es"
      }
    }
  }'

# Response includes the metadata
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "petowner@example.com",
    "metadata": {
      "full_name": "Maria Garcia",
      "phone": "+1-555-0123",
      "account_type": "pet_owner",
      "preferences": {
        "notifications": true,
        "language": "es"
      }
    }
  },
  "access_token": "eyJhbGc...",
  "refresh_token": "v1.Lq..."
}
```

## Summary

- **User metadata** = Custom user data that's editable and included in JWT
- **Set during registration** via the `metadata` field in the request body
- **Automatically returned** in login/register responses as `user.metadata`
- **Stored in Supabase** and accessible via `user.user_metadata`
- **Best for**: Small, frequently-accessed user preferences and profile data
