import sys
if sys.platform == "win32":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import os
import base64
import numpy as np
import cv2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Face Verification AI Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
YUNET_PATH = os.path.join(CURRENT_DIR, "face_detection_yunet.onnx")
SFACE_PATH = os.path.join(CURRENT_DIR, "face_recognition_sface.onnx")

detector = cv2.FaceDetectorYN.create(
    YUNET_PATH,
    "",
    (320, 320),
    score_threshold=0.6,
    nms_threshold=0.3,
    top_k=5000
)

recognizer = cv2.FaceRecognizerSF.create(
    SFACE_PATH,
    ""
)

class RegisterRequest(BaseModel):
    image_base64: str

class VerifyRequest(BaseModel):
    image_base64: str
    target_embedding: list

def decode_image(base64_str: str) -> np.ndarray:
    if "base64," in base64_str:
        base64_str = base64_str.split("base64,")[1]
    img_data = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Failed to decode image")
    return img

def get_face_feature(img: np.ndarray) -> np.ndarray:
    h, w, _ = img.shape
    detector.setInputSize((w, h))
    _, faces = detector.detect(img)
    if faces is None or len(faces) == 0:
        raise HTTPException(status_code=400, detail="No face detected in the image")
    
    # faces[0] contains the highest-confidence detected face bounding box & landmarks
    aligned_face = recognizer.alignCrop(img, faces[0])
    feature = recognizer.feature(aligned_face)
    return feature[0]

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Face Verification AI Microservice"}

@app.post("/extract-face")
async def extract_face(request: RegisterRequest):
    try:
        img = decode_image(request.image_base64)
        feature = get_face_feature(img)
        return {"embedding": feature.tolist()}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.post("/verify-face")
async def verify_face(request: VerifyRequest):
    try:
        img = decode_image(request.image_base64)
        current_feature = get_face_feature(img)
        target_feature = np.array(request.target_embedding, dtype=np.float32)

        # SFace cosine similarity matching
        cosine_sim = float(recognizer.match(current_feature.reshape(1, -1), target_feature.reshape(1, -1), cv2.FaceRecognizerSF_FR_COSINE))
        cosine_distance = 1.0 - cosine_sim

        # SFace cosine similarity threshold is 0.363 (standard benchmark for identity verification)
        is_match = bool(cosine_sim >= 0.363)

        return {
            "match": is_match,
            "distance": float(cosine_distance),
            "similarity": float(cosine_sim),
            "threshold": 0.363
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

