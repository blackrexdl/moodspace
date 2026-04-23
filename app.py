from flask import Flask, render_template, request, redirect, session, jsonify
from model.model import predict_emotion, predict_image_emotion
import json
import os
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "moodspace_secret_2024"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///moodspace.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
db = SQLAlchemy(app)

# Models
class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String(50), nullable=False)
    text = db.Column(db.String(500), nullable=False)
    emotion = db.Column(db.String(20))
    confidence = db.Column(db.Integer)
    likes = db.Column(db.Integer, default=0)
    date = db.Column(db.String(20))

class Checkin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String(50), nullable=False)
    emotion = db.Column(db.String(20))
    date = db.Column(db.DateTime, default=datetime.utcnow)

# Load demo data
def load_demo_data():
    with open("users.json") as f:
        app.users = json.load(f)
    
    with open("data/demo_posts.json") as f:
        app.demo_posts = json.load(f)

load_demo_data()

@app.route("/")
@app.route("/landing")
def landing():
    return render_template("landing.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        username = request.form["username"].strip()
        password = request.form["password"].strip()
        if username in app.users and app.users[username] == password:
            session["user"] = username
            return redirect("/dashboard")
        else:
            error = "Invalid credentials. Try: PriyaSharma/pass123"
    return render_template("login.html", error=error)

@app.route("/register", methods=["GET", "POST"])
def register():
    reg_error = None
    reg_success = None
    if request.method == "POST":
        username = request.form["username"].strip()
        email = request.form.get("email", "").strip()
        password = request.form["password"].strip()
        confirm = request.form.get("confirm_password", "").strip()
        
        if not username or not password:
            reg_error = "Username and password are required"
        elif username in app.users:
            reg_error = "Username already exists"
        elif password != confirm:
            reg_error = "Passwords do not match"
        elif len(password) < 4:
            reg_error = "Password must be at least 4 characters"
        else:
            # Add to users
            app.users[username] = password
            with open("users.json", "w") as f:
                json.dump(app.users, f, indent=2)
            reg_success = "Account created! Please sign in."
    
    return render_template("login.html", reg_error=reg_error, reg_success=reg_success)

@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect("/login")
    return render_template("dashboard.html", user=session["user"], demo_posts=app.demo_posts)

@app.route("/analyze", methods=["GET", "POST"])
def analyze():
    emotion = None
    emotion_emoji = {
        'happy': '😊',
        'sad': '😢',
        'calm': '😌',
        'anxious': '😰',
        'angry': '😠',
        'hopeful': '🌟',
        'neutral': '😐'
    }
    advice = ""
    if request.method == "POST":
        text = request.form["text"]
        emotion = predict_emotion(text)
        if emotion == 'happy':
            advice = "✨ Great mood! Share this positivity - post to journal or breathe for balance."
        elif emotion == 'calm':
            advice = "😌 Perfect state. Maintain with 4-7-8 breathing or nature walk."
        elif emotion == 'anxious':
            advice = "🌬️ Try Box Breathing now. Journal your thoughts."
        elif emotion == 'sad':
            advice = "🤗 Gentle self-care. Try camera scan or connect via feed."
        elif emotion == 'angry':
            advice = "🔥 Release with 5min journal + deep breathing."
        else:
            advice = "📊 Neutral. Check mood calendar or daily check-in."
    return render_template("analyze.html", emotion=emotion, emotion_emoji=emotion_emoji, advice=advice)

@app.route("/camera", methods=["GET", "POST"])
def camera():
    emotion = None
    if request.method == "POST":
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                filename = secure_filename(file.filename)
                path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                os.makedirs(os.path.dirname(path), exist_ok=True)
                file.save(path)
                emotion = predict_image_emotion(path)
    return render_template("camera.html", emotion=emotion)

@app.route("/journal")
def journal():
    if "user" not in session:
        return redirect("/login")
    return render_template("journal.html", user=session['user'])

@app.route("/post", methods=["POST"])
def create_post():
    if "user" not in session:
        return redirect("/login")
    user = session["user"]
    text = request.form["text"]
    emotion = predict_emotion(text)
    confidence = 85  # Mock
    
    new_post = {
        "user": user,
        "text": text,
        "emotion": emotion,
        "confidence": confidence,
        "likes": 0,
        "date": "Just now"
    }
    
    # Append to demo_posts immediately
    app.demo_posts.append(new_post)
    
    # Write to file in background (non-blocking)
    import threading
    def save_posts():
        try:
            with open("data/demo_posts.json", "w") as f:
                json.dump(app.demo_posts, f, indent=2)
        except Exception:
            pass
    threading.Thread(target=save_posts, daemon=True).start()
    
    return redirect("/dashboard")

@app.route("/breathe")
def breathe():
    return render_template("breathe.html")

@app.route("/profile")
def profile():
    if "user" not in session:
        return redirect("/login")
    return render_template("profile.html", user=session["user"])

@app.route("/admin")
def admin():
    if "user" not in session or session["user"] != "admin":
        return redirect("/login")
    
    # Get real stats
    total_users = len(app.users)
    total_posts = len(app.demo_posts)
    
    # Build users list with post counts
    users_list = []
    for username in sorted(app.users.keys()):
        user_posts = [p for p in app.demo_posts if p.get('user') == username]
        users_list.append({
            'id': hash(username) % 10000,
            'username': username,
            'posts': len(user_posts),
            'joined': '2024'
        })
    
    # Emotion distribution
    emotions = {}
    for post in app.demo_posts:
        emo = post.get('emotion', 'neutral')
        emotions[emo] = emotions.get(emo, 0) + 1
    
    # Top users by posts
    top_users = sorted(users_list, key=lambda x: x['posts'], reverse=True)[:5]
    
    return render_template("admin.html", 
                         demo_posts=app.demo_posts,
                         users=users_list,
                         total_users=total_users,
                         total_posts=total_posts,
                         emotions=emotions,
                         top_users=top_users)

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect("/")

@app.errorhandler(404)
def not_found(error):
    return render_template("landing.html"), 404

if __name__ == "__main__":
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)

