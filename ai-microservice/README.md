# Face Verification AI Microservice

This microservice uses Python, FastAPI, and DeepFace (with the Facenet512 model) to accurately extract and verify face embeddings, achieving up to 99% accuracy even in challenging conditions.

## Setup Instructions

1. **Create a virtual environment (Recommended)**
   ```bash
   python -m venv venv
   ```

2. **Activate the environment**
   - Windows: `.\venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the server**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Endpoints

- `POST /extract-face`: Accepts a base64 image and returns a 512-dimensional face embedding. Used during user registration/signup.
- `POST /verify-face`: Accepts a new base64 image and a target embedding, compares them, and returns whether they match. Used during the voting process.
