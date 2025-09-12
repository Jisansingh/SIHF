print("🚀 Script started")
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os
import traceback

try:
    print("📂 Loading dataset...")
    df = pd.read_csv("results.csv")
    print("✅ Dataset loaded")
    print(df.head())

    print("🔢 Creating advanced features...")
    df["target"] = df["issues"].apply(lambda x: 1 if x == "OK" else 0)
    
    # Basic presence features
    df["mrp_present"] = df["mrp"].notnull().astype(int)
    df["expiry_present"] = df["expiry"].notnull().astype(int)
    df["weight_present"] = df["weight"].notnull().astype(int)
    
    # Price range feature
    df["price_range"] = pd.qcut(df["mrp"].fillna(0), q=5, labels=[0, 1, 2, 3, 4])
    
    # Weight standardization
    def standardize_weight(weight):
        if pd.isna(weight):
            return 0
        weight_str = str(weight).lower().strip()
        
        try:
            # Handle common units
            if any(unit in weight_str for unit in ['kg', 'g', 'ml', 'l']):
                # Extract numeric value using regex
                import re
                num_match = re.search(r'(\d+(?:\.\d+)?)', weight_str)
                if not num_match:
                    return 0
                value = float(num_match.group(1))
                
                # Convert based on unit
                if 'kg' in weight_str:
                    return value * 1000  # Convert kg to g
                elif 'g' in weight_str:
                    return value
                elif 'l' in weight_str and 'ml' not in weight_str:
                    return value * 1000  # Convert l to ml/g
                elif 'ml' in weight_str:
                    return value  # Assume 1ml = 1g
                
            # Try direct conversion if no unit specified
            return float(weight_str)
        except (ValueError, TypeError):
            # Return 0 for invalid formats
            return 0
    
    df["weight_std"] = df["weight"].apply(standardize_weight)
    df["weight_range"] = pd.qcut(df["weight_std"].fillna(0), q=5, labels=[0, 1, 2, 3, 4])
    
    # Expiry features
    from datetime import datetime
    def get_expiry_months(expiry):
        if pd.isna(expiry):
            return -1
        try:
            expiry_date = datetime.strptime(str(expiry), "%m/%Y")
            current_date = datetime.now()
            return (expiry_date.year - current_date.year) * 12 + (expiry_date.month - current_date.month)
        except:
            return -1
    
    df["months_to_expiry"] = df["expiry"].apply(get_expiry_months)
    df["expiry_range"] = pd.cut(df["months_to_expiry"], 
                               bins=[-float('inf'), -1, 0, 3, 6, 12, float('inf')],
                               labels=[0, 1, 2, 3, 4, 5])
    
    # Category encoding
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    df["category_encoded"] = le.fit_transform(df["category"].fillna("Unknown"))
    
    # Create final feature matrix
    X = df[["mrp_present", "expiry_present", "weight_present", 
            "price_range", "weight_range", "expiry_range", 
            "category_encoded"]]
    y = df["target"]

    print("📊 Splitting dataset...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("🌲 Training advanced Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced'
    )
    model.fit(X_train, y_train)

    print("✅ Model trained")
    # Print feature importances
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    print("\n📊 Feature Importances:")
    print(feature_importance)
    y_pred = model.predict(X_test)
    print("✅ Model Accuracy:", accuracy_score(y_test, y_pred))

    print("📦 Saving model...")
    BASE_DIR = os.path.dirname(__file__)
    model_path = os.path.join(BASE_DIR, "compliance_model.pkl")
    joblib.dump(model, model_path)
    print(f"✅ Model saved as {model_path}")

except Exception as e:
    print("❌ An error occurred:")
    traceback.print_exc()
