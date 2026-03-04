from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Expanded symptom risk weights
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


# Risk calculation
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

    # Risk classification
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


# Home route
@app.route("/")
def home():
    return render_template("index.html")


# Prediction route
@app.route("/predict", methods=["POST"])
def predict():

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
    app.run(debug=True , port = 5003)