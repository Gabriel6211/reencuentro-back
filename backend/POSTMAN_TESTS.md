# Postman test guide

Base URL: `http://localhost:3001` (or your deployed URL). All auth-required requests need the header:  
`Authorization: Bearer <access_token>`.

**Structure:** **Auth** (`/api/auth`) = login, register. **Profile** (`/api/profile`) = get/update current user profile. **Posts** (`/api/posts`) and **Upload** (`/api/upload`) as before.

**DB note:** The API expects `posts.status` to be one of: `active`, `found`, `reunited`, `adopted`. If your Supabase `post_status` enum uses different values (e.g. `found_family`, `resolved`), either change the enum to match or update the backend types.

---

## Troubleshooting: Postman crashes on sign up / login

If Postman shows **"Something went wrong"** or **crashes** when you send sign up or login, it’s often because the response contains **very long JWT strings** and Postman’s response viewer can crash on long lines.

**Workarounds:**

1. **Verify with curl** (no GUI to crash):
   ```bash
   curl -s -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"yourpassword123","metadata":{"name":"Jane"}}' \
     | jq .
   ```
   If this works, the backend is fine. Copy `access_token` from the output for later requests.

2. **Update Postman** to the latest version (crashes are often fixed in newer builds).

3. **Avoid opening the response body** right after send: in the **Tests** tab, save the token so you can use it in the next request without scrolling the response:
   ```javascript
   if (pm.response.code === 201 || pm.response.code === 200) {
     const json = pm.response.json();
     if (json.access_token) pm.environment.set("access_token", json.access_token);
   }
   ```
   Then use `{{access_token}}` in the Authorization header. You can leave the response collapsed.

4. **Use another client** (e.g. Insomnia, or VS Code REST Client) to call sign up / login if the issue persists.

---

## 1. Account creation + profile (separate models)

**POST** `/api/auth/register`

- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "test@example.com",
  "password": "yourpassword123",
  "metadata": {
    "name": "Jane Doe",
    "location": "Buenos Aires",
    "phone": "+54 11 1234-5678"
  }
}
```

- **Expected:** `201` with `user` (id, email, name, location, phone from **profiles** table), `access_token`, `refresh_token`.
- **Note:** A row is created in `profiles` with the same `id` as `auth.users`. Save `access_token` for the next requests.

---

## 2. Get profile & Update profile

**GET** `/api/profile`

- **Headers:** `Authorization: Bearer <access_token>`
- **Expected:** `200` with current user (id, email, name, avatar_url, location, phone from **profiles**).

**PATCH** `/api/profile`

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <access_token>`
- **Body (raw JSON):** at least one field:
```json
{
  "name": "Jane Updated",
  "avatar_url": "https://your-bucket.example.com/avatar.jpg",
  "location": "Córdoba",
  "phone": "+54 351 555-0000"
}
```

- **Expected:** `200` with `user` reflecting updated **profiles** row.

---

## 3. Post creation

**POST** `/api/posts` accepts **two formats**. Use multipart when creating a post with images in one request.

### Option A: Create post with images (multipart) – recommended

- **Headers:** `Authorization: Bearer <access_token>` (do **not** set `Content-Type`; Postman sets it with the boundary).
- **Body:** form-data. Add these **fields** (key = name, value = value):

| Key                 | Value (example) |
|---------------------|-----------------|
| title               | Dog found in Palermo |
| content             | Friendly medium-sized dog, brown and white. Found near Plaza Serrano. |
| location            | Palermo, CABA |
| post_type           | found |
| date_lost_or_found   | 2025-02-10T12:00:00.000Z |
| pet_breed           | Mixed |
| pet_gender           | male |
| pet_color           | brown and white |
| pet_size            | medium |

- Add **files**: key = `images`, type = File, then select one or more image files (JPG, PNG, WebP; max 10, 5MB each). They are uploaded to storage and their URLs are saved as `image_urls` on the post.
- **Expected:** `201` with created post (including `id`, `user_id`, `image_urls` with the uploaded URLs). Save `id` for later steps.

### Option B: Create post with JSON (no files or pre-uploaded URLs)

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <access_token>`
- **Body (raw JSON):**
```json
{
  "title": "Dog found in Palermo",
  "content": "Friendly medium-sized dog, brown and white. Found near Plaza Serrano.",
  "image_urls": [],
  "location": "Palermo, CABA",
  "post_type": "found",
  "date_lost_or_found": "2025-02-10T12:00:00.000Z",
  "pet_breed": "Mixed",
  "pet_gender": "male",
  "pet_color": "brown and white",
  "pet_size": "medium"
}
```

- Use `image_urls`: `[]` for no images, or an array of URLs if you already uploaded them (e.g. via `POST /api/upload`).
- For **lost:** `post_type: "lost"`, include `date_lost_or_found`, optionally `pet_name`.
- For **adoption:** `post_type: "adoption"`, `date_lost_or_found` is optional.
- **Expected:** `201` with created post (including `id`, `user_id`). Save `id` for update/status tests.

---

## 4. Update post description (and other fields)

**PATCH** `/api/posts/:id`

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <access_token>`
- **URL:** Replace `:id` with the post UUID from step 3.
- **Body (raw JSON):** one or more fields to update:
```json
{
  "content": "Updated description: the dog was reunited with the owner.",
  "title": "Dog found in Palermo - UPDATED"
}
```

- You can also update `image_urls`, `location`, `pet_name`, etc.
- **Expected:** `200` with updated post.

---

## 5. Update post status

**PATCH** `/api/posts/:id/status`

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <access_token>`
- **URL:** Replace `:id` with the post UUID.
- **Body (raw JSON):**
```json
{
  "status": "found"
}
```

- Allowed by `post_type`:
  - **lost** → `"status": "found"`
  - **found** → `"status": "reunited"`
  - **adoption** → `"status": "adopted"`
- **Expected:** `200` with post with new `status`.

---

## 6. Add more photos to an existing post

To add photos when **creating** a post, use **Option A** in section 3 (multipart with `images`).  
To add photos **after** the post exists, use the standalone upload then PATCH:

**Step A – Upload file**

**POST** `/api/upload`

- **Headers:** `Authorization: Bearer <access_token>`
- **Body:** form-data, key `file`, type File → choose an image file.

- **Expected:** `200` with `url` (and `key`, `size`, `type`). Copy `url`.

**Step B – Attach photo to post**

**PATCH** `/api/posts/:id` (same as in step 4):

- **Body:**
```json
{
  "image_urls": ["https://your-r2-bucket.example.com/uploads/..."]
}
```

- To add more photos, send the **full** array (existing URLs + new one):
```json
{
  "image_urls": ["https://existing-url.com/1.jpg", "https://new-upload-url.com/2.jpg"]
}
```

- **Expected:** `200` with post including updated `image_urls`.

---

## Suggested order in Postman

1. **Register** → save `access_token`.
2. **Update profile** → confirm profiles table is updated.
3. **Create post** (Option A multipart with images, or Option B JSON); save post `id`.
4. **Update post** (description and/or `image_urls`) if needed.
5. **Update post status** when resolved.
6. (Optional) **Upload** + **PATCH post** to add more photos to an existing post.

---

## Login (for re-testing without registering again)

**POST** `/api/auth/login`

- **Body:**
```json
{
  "email": "test@example.com",
  "password": "yourpassword123"
}
```

- **Expected:** `200` with `user` (from **profiles**), `access_token`, `refresh_token`. Use `access_token` for protected endpoints.
