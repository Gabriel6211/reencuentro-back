# Reencuentro Backend API

Separate Node.js backend for the Reencuentro pet reunion platform.

## 🚀 Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create `.env` file:**
   ```env
   # Server
   PORT=3001
   FRONTEND_URL=http://localhost:3000

   # Cloudflare R2
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key_id
   R2_SECRET_ACCESS_KEY=your_secret_access_key
   R2_BUCKET_NAME=your_bucket_name
   R2_PUBLIC_URL=https://your-bucket.your-domain.com

   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health check

### Upload
- `POST /api/upload` - Upload a file to R2
  - Requires: `Authorization: Bearer <supabase_jwt_token>`
  - Body: `multipart/form-data` with `file` field
  - Max file size: 5MB
  - Allowed types: JPEG, PNG, WebP, GIF

## 🔐 Authentication

The backend uses Supabase JWT tokens for authentication. The frontend should send the token in the `Authorization` header:

```
Authorization: Bearer <user_jwt_token>
```

## 🔗 Connecting Frontend

Update your Next.js frontend to call the backend API:

```typescript
// In your frontend code
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()

const formData = new FormData()
formData.append('file', file)

const response = await fetch('http://localhost:3001/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: formData,
})
```
