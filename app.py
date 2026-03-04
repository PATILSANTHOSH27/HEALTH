from flask import Flask, request, jsonify, render_template, redirect, session
import sqlite3

app = Flask(__name__)
app.secret_key = "health_secret_key"


# ---------------- DATABASE ---------------- #

def get_db():
    conn = sqlite3.connect("users.db")
    conn.row_factory = sqlite3.Row
    return conn


# ---------------- SYMPTOM DATA ---------------- #

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


# ---------------- RISK CALCULATION ---------------- #

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
        recommendation = "Rest and monitor symptoms at home."

    elif score <= 50:
        risk = "Moderate"
        recommendation = "Consider consulting a doctor online."

    elif score <= 75:
        risk = "High"
        recommendation = "Visit a nearby hospital or clinic."

    else:
        risk = "Critical"
        recommendation = "Seek emergency medical attention immediately."

    return score, risk, recommendation, detected, unknown


# ---------------- AUTH ROUTES ---------------- #

@app.route("/")
def home():

    if "user" in session:
        return redirect("/dashboard")

    return redirect("/login")


@app.route("/login", methods=["GET","POST"])
def login():

    if request.method == "POST":

        email = request.form["email"]
        password = request.form["password"]

        db = get_db()

        user = db.execute(
            "SELECT * FROM users WHERE email=? AND password=?",
            (email,password)
        ).fetchone()

        if user:
            session["user"] = email
            return redirect("/dashboard")

    return render_template("login.html")


@app.route("/signup", methods=["GET","POST"])
def signup():

    if request.method == "POST":

        email = request.form["email"]
        password = request.form["password"]

        db = get_db()

        db.execute(
            "INSERT INTO users(email,password) VALUES (?,?)",
            (email,password)
        )

        db.commit()

        return redirect("/login")

    return render_template("signup.html")


@app.route("/logout")
def logout():

    session.pop("user",None)

    return redirect("/login")


# ---------------- DASHBOARD ---------------- #

@app.route("/dashboard")
def dashboard():

    if "user" not in session:
        return redirect("/login")

    return render_template("dashboard.html")


# ---------------- PREDICTION API ---------------- #

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


if __name__ == "__main__":
    app.run(debug=True , port=5003)
