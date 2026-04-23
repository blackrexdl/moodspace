import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import cv2
import numpy as np

# Load dataset for text model (robust)
try:
    data = pd.read_csv("data/dataset.csv")
    X = data["text"]
    y = data["emotion"]
except Exception as e:
    print(f"Dataset load failed ({e}), using dummy model")
    X = ["happy", "sad", "neutral"]
    y = ["happy", "sad", "neutral"]
    data = pd.DataFrame({"text": X, "emotion": y})

# Features & Labels

# Convert text → numbers
vectorizer = TfidfVectorizer()
X_vec = vectorizer.fit_transform(X)

# Train model
model = MultinomialNB()
model.fit(X_vec, y)

# Prediction function for text
def predict_emotion(text):
    text_vec = vectorizer.transform([text])
    prediction = model.predict(text_vec)
    return prediction[0]

# Stub for image emotion (basic grayscale avg brightness -> simple map; replace with deepface if installed)
def predict_image_emotion(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return 'neutral'
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brightness = np.mean(gray)
    if brightness > 150:
        return 'happy'
    elif brightness < 100:
        return 'sad'
    else:
        return 'neutral'

