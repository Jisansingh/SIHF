from flask import Flask, render_template, jsonify
import pandas as pd
import joblib
from datetime import datetime

app = Flask(__name__)

def load_and_process_data():
    """Load product data and enrich it with compliance-related features."""
    print("Reading product data...")
    df = pd.read_csv("results.csv")
    
    print("Loading compliance model...")
    model = joblib.load("compliance_model.pkl")

    # Check if a product has expired
    def check_expiry(row):
        if pd.isna(row['expiry']) or not isinstance(row['expiry'], str):
            return False
        try:
            expiry_date = datetime.strptime(row['expiry'], "%m/%Y")
            return expiry_date > datetime.now()
        except:
            return False

    print("Adding basic compliance indicators...")
    df["mrp_present"] = df["mrp"].notnull().astype(int)
    df["expiry_present"] = df["expiry"].notnull().astype(int)
    df["weight_present"] = df["weight"].notnull().astype(int)
    df["is_expired"] = df.apply(check_expiry, axis=1)

    print("Creating price groups...")
    df["price_range"] = pd.qcut(df["mrp"].fillna(0), q=5, labels=[0, 1, 2, 3, 4])

    # Standardize weight units to grams/ml
    def standardize_weight(weight):
        if pd.isna(weight):
            return 0
        weight_str = str(weight).lower().strip()
        try:
            import re
            match = re.match(r'^([\d.,]+)\s*([a-zA-Z]+)$', weight_str)
            if match:
                value = float(match.group(1).replace(',', ''))
                unit = match.group(2).lower()
                if unit in ['kg', 'kgs']:
                    return value * 1000
                elif unit in ['g', 'gm', 'gms', 'gram', 'grams']:
                    return value
                elif unit == 'l':
                    return value * 1000
                elif unit in ['ml', 'milliliter', 'millilitre']:
                    return value
                else:
                    return 0
            num_match = re.search(r'([\d.,]+)', weight_str)
            if num_match:
                return float(num_match.group(1).replace(',', ''))
            return 0
        except:
            return 0

    print("Standardizing weights...")
    df["weight_std"] = df["weight"].apply(standardize_weight)
    df["weight_range"] = pd.qcut(df["weight_std"].fillna(0), q=5, labels=[0, 1, 2, 3, 4])

    # Calculate how many months until expiry
    def get_expiry_months(expiry):
        if pd.isna(expiry):
            return -1
        try:
            expiry_date = datetime.strptime(expiry, "%m/%Y")
            today = datetime.now()
            return (expiry_date.year - today.year) * 12 + (expiry_date.month - today.month)
        except:
            return -1

    print("Adding expiry info...")
    df["months_to_expiry"] = df["expiry"].apply(get_expiry_months)
    df["expiry_range"] = pd.cut(df["months_to_expiry"], 
                                bins=[-float('inf'), -1, 0, 3, 6, 12, float('inf')],
                                labels=[0, 1, 2, 3, 4, 5])

    print("Encoding categories...")
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    df["category_encoded"] = le.fit_transform(df["category"].fillna("Unknown"))

    print("Running compliance predictions...")
    features = df[["mrp_present", "expiry_present", "weight_present", 
                  "price_range", "weight_range", "expiry_range", 
                  "category_encoded"]]
    probs = model.predict_proba(features)[:, 1]
    df["accuracy"] = (probs * 100).round(1).astype(str) + "%"

    print("Formatting prices...")
    df["formatted_mrp"] = df["mrp"].apply(lambda x: f"₹{float(x):,.2f}" if pd.notnull(x) else "Missing")

    print("Assigning compliance status...")
    df["compliance_status"] = df.apply(lambda row: 
        "Compliant" if row["issues"] == "OK" else
        "Non-Compliant" if float(row["accuracy"].strip("%")) < 50 else
        "Partial-Compliant", axis=1
    )

    print("Data preparation done!")
    return df

print("Starting application...")
df = load_and_process_data()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/products")
def get_products():
    products = df.to_dict(orient="records")
    cleaned = []
    for p in products:
        cleaned.append({
            "title": str(p["title"]) if pd.notnull(p["title"]) else "Unnamed Product",
            "price": str(p["formatted_mrp"]),
            "expiry": str(p["expiry"]) if pd.notnull(p["expiry"]) else None,
            "weight": str(p["weight"]) if pd.notnull(p["weight"]) else None,
            "expiry_status": "Valid" if p["is_expired"] else "Expired/Missing",
            "compliance_class": p["compliance_status"].lower(),
            "compliance_status": str(p["compliance_status"]),
            "issues": str(p["issues"]),
            "category": str(p["category"]) if pd.notnull(p["category"]) else "Other",
            "accuracy": str(p["accuracy"])
        })
    return jsonify(cleaned)

@app.route("/api/compliance-summary")
def get_compliance_summary():
    summary = {
        "total_products": len(df),
        "compliant": len(df[df["compliance_status"] == "Compliant"]),
        "partial_compliant": len(df[df["compliance_status"] == "Partial-Compliant"]),
        "non_compliant": len(df[df["compliance_status"] == "Non-Compliant"]),
        "expired_products": len(df[~df["is_expired"]]),
        "missing_mrp": len(df[df["mrp_present"] == 0]),
        "missing_weight": len(df[df["weight_present"] == 0]),
        "total_value": f"₹{df['mrp'].sum():,.2f}",
        "average_compliance": f"{df['accuracy'].str.rstrip('%').astype(float).mean():.1f}%"
    }
    return jsonify(summary)

@app.route("/api/stats")
def get_stats():
    stats = {
        "compliance_distribution": {
            "Compliant": len(df[df["compliance_status"] == "Compliant"]),
            "Partial": len(df[df["compliance_status"] == "Partial-Compliant"]),
            "Non-Compliant": len(df[df["compliance_status"] == "Non-Compliant"])
        },
        "category_distribution": df["category"].value_counts().to_dict() if "category" in df.columns else {},
        "top_issues": df["issues"].value_counts().head(5).to_dict(),
        "price_ranges": {
            "0-1000": len(df[df["mrp"] <= 1000]),
            "1000-5000": len(df[(df["mrp"] > 1000) & (df["mrp"] <= 5000)]),
            "5000-20000": len(df[(df["mrp"] > 5000) & (df["mrp"] <= 20000)]),
            "20000+": len(df[df["mrp"] > 20000])
        },
        "category_compliance": df.groupby("category")["compliance_status"].value_counts().unstack().fillna(0).to_dict() if "category" in df.columns else {}
    }
    return jsonify(stats)

if __name__ == "__main__":
    print("Launching server...")
    app.run(debug=True, port=5001)
