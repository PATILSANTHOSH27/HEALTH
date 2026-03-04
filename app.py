from flask import Flask, request, jsonify, render_template, redirect, session
import sqlite3
import os

app = Flask(__name__)
app.secret_key = "health_secret_key"

DATABASE = "users.db"


# ---------------- DATABASE ---------------- #

def init_db():
    if not os.path.exists(DATABASE):

        conn = sqlite3.connect(DATABASE)

        conn.execute("""
        CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
        )
        """)

        conn.commit()
        conn.close()

        print("Database initialized")


def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# ---------------- SYMPTOMS ---------------- #

symptom_weights = {

    "fever": 20,
    "high fever": 25,
    "cough": 10,
    "sore throat": 10,
    "runny nose": 5,
    "headache": 5,
    "fatigue": 10,
    "body pain": 10,
    "joint pain": 10,

    "vomiting": 15,
    "nausea": 15,
    "diarrhea": 15,
    "abdominal pain": 20,

    "chest pain": 40,
    "breathing difficulty": 50,
    "heart palpitations": 35,

    "dizziness": 20,
    "blurred vision": 20,

    "loss of smell": 10,
    "loss of taste": 10,

    "ear pain": 10,
    "skin rash": 15,

    "chills": 10,
    "sweating": 10
}


# ---------------- RISK LOGIC ---------------- #

def calculate_risk(symptoms):

    score = 0
    detected = []
    unknown = []

    for symptom in symptoms:

        symptom = symptom.lower().strip()

        if symptom in symptom_weights:
            score += symptom_weights[symptom]
            detected.append(symptom)
        else:
            unknown.append(symptom)

    if score <= 25:
        risk = "Low"
        recommendation = "Rest and monitor symptoms."

    elif score <= 50:
        risk = "Moderate"
        recommendation = "Consult a doctor online."

    elif score <= 75:
        risk = "High"
        recommendation = "Visit a hospital."

    else:
        risk = "Critical"
        recommendation = "Seek emergency medical attention."

    return score, risk, recommendation, detected, unknown


# ---------------- HOME ---------------- #

@app.route("/")
def home():

    if "user" in session:
        return redirect("/index")

    return redirect("/login")


# ---------------- LOGIN ---------------- #

@app.route("/login", methods=["GET","POST"])
def login():

    if request.method == "POST":

        email = request.form.get("email")
        password = request.form.get("password")

        db = get_db()

        user = db.execute(
            "SELECT * FROM users WHERE email=? AND password=?",
            (email,password)
        ).fetchone()

        db.close()

        if user:
            session["user"] = email
            return redirect("/index")

        return "Invalid email or password"

    return render_template("login.html")


# ---------------- SIGNUP ---------------- #

@app.route("/signup", methods=["GET","POST"])
def signup():

    if request.method == "POST":

        email = request.form.get("email")
        password = request.form.get("password")

        db = get_db()

        try:

            db.execute(
                "INSERT INTO users(email,password) VALUES (?,?)",
                (email,password)
            )

            db.commit()

            session["user"] = email

            return redirect("/index")

        except sqlite3.IntegrityError:
            return "User already exists"

        finally:
            db.close()

    return render_template("signup.html")


# ---------------- LOGOUT ---------------- #

@app.route("/logout")
def logout():

    session.pop("user",None)

    return redirect("/login")


# ---------------- DASHBOARD ---------------- #

@app.route("/index")
def index():

    if "user" not in session:
        return redirect("/login")

    return render_template("index.html")


# ---------------- PREDICTION ---------------- #

@app.route("/predict", methods=["POST"])
def predict():

    if "user" not in session:
        return jsonify({"error":"Unauthorized"}),401

    data = request.get_json()

    symptoms = data.get("symptoms", [])

    score, risk, recommendation, detected, unknown = calculate_risk(symptoms)

    return jsonify({

        "risk_score": score,
        "risk_level": risk,
        "recommendation": recommendation,
        "explanation": detected,
        "unknown_symptoms": unknown

    })


# ---------------- INIT DATABASE ---------------- #

init_db()
