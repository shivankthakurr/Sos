#!/usr/bin/env python3
"""
Real Open-Source AI Detector
Evaluates text with fakespot-ai/roberta-base-ai-text-detection-v1 (RoBERTa classifier).
Scores per paragraph AND per document (reporting average, max, and full document).
"""

import sys
import os
import json
import warnings

# Suppress noisy HuggingFace / PyTorch warnings
warnings.filterwarnings("ignore")
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
except ImportError as e:
    print(json.dumps({
        "error": f"Required packages missing: {e}. Please run: pip install torch transformers",
        "document_score": None,
        "avg_paragraph_score": None
    }))
    sys.exit(1)

MODEL_ID = "fakespot-ai/roberta-base-ai-text-detection-v1"

_tokenizer = None
_model = None

def get_model():
    global _tokenizer, _model
    if _model is None:
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
        _model = AutoModelForSequenceClassification.from_pretrained(MODEL_ID)
        _model.eval()
    return _tokenizer, _model

def score_text_segment(text: str) -> float:
    """Score a single text segment. Returns AI probability as a percentage (0.0 - 100.0)."""
    text = text.strip()
    if not text or len(text.split()) < 3:
        return 0.0

    tok, mod = get_model()
    # Truncate to RoBERTa's max 512 tokens
    inputs = tok(text, return_tensors="pt", truncation=True, max_length=512)
    
    with torch.no_grad():
        outputs = mod(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)
        # Class 1 is 'AI', Class 0 is 'Human'
        ai_prob = float(probs[0][1].item()) * 100.0

    return round(ai_prob, 2)

def detect(text: str) -> dict:
    # Check for GPTZero API Key
    gptzero_key = os.environ.get("GPTZERO_API_KEY", "").strip()
    if not gptzero_key:
        # User requirement: Print a clear line saying "GPTZero not used". Never label heuristic as GPTZero.
        sys.stderr.write("INFO: GPTZero not used (GPTZERO_API_KEY not configured)\n")

    # Split into paragraphs (skipping headers or formatting lines)
    raw_paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    
    paragraph_results = []
    paragraph_scores = []

    for i, p in enumerate(raw_paragraphs):
        # Skip pure markdown headers or bullet indicators if very short
        if p.startswith("#") and len(p.split()) < 8:
            continue
        
        score = score_text_segment(p)
        paragraph_scores.append(score)
        paragraph_results.append({
            "index": i,
            "text": p[:120] + "..." if len(p) > 120 else p,
            "ai_score": score
        })

    # Full document score
    doc_score = score_text_segment(text)
    
    avg_score = round(sum(paragraph_scores) / max(len(paragraph_scores), 1), 2)
    max_score = max(paragraph_scores) if paragraph_scores else 0.0

    return {
        "detector": MODEL_ID,
        "document_score": doc_score,
        "avg_paragraph_score": avg_score,
        "max_paragraph_score": max_score,
        "paragraphs_scored": len(paragraph_scores),
        "paragraphs": paragraph_results
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if os.path.isfile(arg):
            with open(arg, "r", encoding="utf-8") as f:
                content = f.read()
        else:
            content = arg
    else:
        content = sys.stdin.read()

    result = detect(content)
    print(json.dumps(result, indent=2))
