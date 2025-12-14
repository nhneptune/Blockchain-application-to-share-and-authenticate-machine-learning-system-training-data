#!/usr/bin/env python3
"""
train.py

Usage:
  # 1) Use default Iris dataset with RandomForest:
  python train.py --mode iris --model randomforest

  # 2) Use Iris with different models:
  python train.py --mode iris --model svm
  python train.py --mode iris --model gradientboosting

  # 3) Use CSV files with specific model:
  python train.py --mode csv --model svm --files /abs/path/to/file1.csv /abs/path/to/file2.csv

Outputs JSON to stdout with keys: success, accuracy, report, n_samples, model_path, model_type
Also saves model to ./models/model.pkl (relative to script path)

Available models: randomforest (default), svm, gradientboosting
"""

import argparse
import json
import os
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradienBoostingClassifiert
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_iris

ROOT = Path(__file__).resolve().parent
MODELS_DIR = ROOT.parent / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODELS_DIR / "model.pkl"

def load_from_csv(files):
    dfs = []
    for f in files:
        if not os.path.isabs(f):
            f = os.path.join(os.getcwd(), f)
        if not os.path.exists(f):
            raise FileNotFoundError(f"CSV file not found: {f}")
        df = pd.read_csv(f)
        dfs.append(df)
    if not dfs:
        raise ValueError("No CSV files provided")
    data = pd.concat(dfs, ignore_index=True)
    return data

def prepare_xy(df):
    # Expect 'label' column for target
    if 'label' not in df.columns:
        raise ValueError("CSV must contain a 'label' column")
    X = df.drop(columns=['label'])
    y = df['label']
    return X.values, y.values

def train_and_eval(X, y, model_type="randomforest"):
    # basic train/test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Select model
    if model_type.lower() == "svm":
        clf = SVC(kernel="rbf", random_state=42)
    elif model_type.lower() == "gradientboosting":
        clf = GradientBoostingClassifier(n_estimators=100, random_state=42)
    else:  # randomforest (default)
        clf = RandomForestClassifier(n_estimators=100, random_state=42)
    
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    acc = float(accuracy_score(y_test, preds))
    report = classification_report(y_test, preds, output_dict=True)
    cm = confusion_matrix(y_test, preds).tolist()
    return clf, acc, report, cm, len(y), model_type.lower()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["iris", "csv"], default="iris", help="iris(default) or csv")
    parser.add_argument("--model", choices=["randomforest", "svm", "gradientboosting"], default="randomforest", help="ML model to use")
    parser.add_argument("--files", nargs="*", help="List of CSV files (absolute or relative paths)")
    args = parser.parse_args()

    try:
        if args.mode == "iris":
            data = load_iris()
            X = data.data
            y = data.target
            feature_names = data.feature_names
        else:
            if not args.files:
                raise ValueError("No CSV files provided in csv mode")
            df = load_from_csv(args.files)
            X, y = prepare_xy(df)
            feature_names = list(df.drop(columns=['label']).columns)

        clf, acc, report, cm, n_samples, model_type = train_and_eval(X, y, args.model)

        # Save model
        joblib.dump(clf, MODEL_PATH.as_posix())

        out = {
            "success": True,
            "mode": args.mode,
            "model_type": model_type,
            "n_samples": n_samples,
            "accuracy": acc,
            "report": report,
            "confusion_matrix": cm,
            "model_path": MODEL_PATH.as_posix()
        }

        sys.stdout.write(json.dumps(out))
        sys.stdout.flush()
        return 0
    except Exception as e:
        err = {"success": False, "error": str(e)}
        sys.stdout.write(json.dumps(err))
        sys.stdout.flush()
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
