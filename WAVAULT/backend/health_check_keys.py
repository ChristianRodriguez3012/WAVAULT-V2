#!/usr/bin/env python3
import os
import time
import argparse
from dotenv import load_dotenv
import google.generativeai as genai

RESULT_OK = "OK"
RESULT_QUOTA = "QUOTA"
RESULT_INVALID = "INVALID"
RESULT_ERROR = "ERROR"


def discover_keys() -> list[str]:
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
    keys = []
    csv = os.environ.get("GEMINI_API_KEYS", "")
    if csv:
        keys.extend([k.strip() for k in csv.split(',') if k.strip()])
    base = os.environ.get("GEMINI_API_KEY", "")
    if base:
        keys.append(base)
    for i in range(2, 11):
        k = os.environ.get(f"GEMINI_API_KEY_{i}", "")
        if k:
            keys.append(k)
    # Filtrar placeholders, vacíos y duplicados preservando orden
    seen = set()
    active = []
    for k in keys:
        if not k or k in ("tu_api_key_aqui", "empty") or k in seen:
            continue
        seen.add(k)
        active.append(k)
    return active


def classify_error(err: Exception) -> str:
    s = str(err)
    ls = s.lower()
    if "429" in s or "quota" in ls or "limit" in ls:
        return RESULT_QUOTA
    if "403" in s or "invalid" in ls or "api key not valid" in ls:
        return RESULT_INVALID
    return RESULT_ERROR


def health_check_key(key: str, model: str = "gemini-2.0-flash-lite", prompt: str = "Say OK") -> tuple[str, float, str]:
    start = time.time()
    try:
        genai.configure(api_key=key)
        m = genai.GenerativeModel(model)
        _ = m.generate_content(prompt)
        elapsed = time.time() - start
        return RESULT_OK, elapsed, ""
    except Exception as e:
        elapsed = time.time() - start
        kind = classify_error(e)
        return kind, elapsed, str(e)


def mask(key: str) -> str:
    if len(key) <= 12:
        return key[:3] + "..." + key[-3:]
    return key[:10] + "..." + key[-5:]


def main():
    parser = argparse.ArgumentParser(description="Health check de Gemini API keys")
    parser.add_argument("--model", default="gemini-2.0-flash-lite", help="Modelo a usar (default: gemini-2.0-flash-lite)")
    parser.add_argument("--prompt", default="Say OK", help="Prompt mínimo para health check")
    args = parser.parse_args()

    keys = discover_keys()
    if not keys:
        print("❌ No se detectaron API keys. Revisa .env")
        raise SystemExit(1)

    print(f"🔎 Detectadas {len(keys)} key(s) para health check")
    print("")
    results = []
    for idx, key in enumerate(keys, start=1):
        print(f"🔍 KEY #{idx}: {mask(key)} → probando {args.model} ...")
        status, elapsed, err = health_check_key(key, model=args.model, prompt=args.prompt)
        if status == RESULT_OK:
            print(f"   ✅ OK en {elapsed:.2f}s")
        elif status == RESULT_QUOTA:
            print(f"   ⚠️  QUOTA en {elapsed:.2f}s → {err[:120]}")
        elif status == RESULT_INVALID:
            print(f"   ❌ INVALID en {elapsed:.2f}s → {err[:120]}")
        else:
            print(f"   ❗ ERROR en {elapsed:.2f}s → {err[:120]}")
        results.append((idx, status, elapsed, err))

    print("\n📊 RESUMEN")
    ok = sum(1 for _, s, _, _ in results if s == RESULT_OK)
    quota = sum(1 for _, s, _, _ in results if s == RESULT_QUOTA)
    invalid = sum(1 for _, s, _, _ in results if s == RESULT_INVALID)
    other = sum(1 for _, s, _, _ in results if s == RESULT_ERROR)
    print(f"   OK: {ok} | QUOTA: {quota} | INVALID: {invalid} | ERROR: {other}")

    # Código de salida: 0 si hay al menos una OK, 2 si todas QUOTA, 1 si todas INVALID, 3 si otros
    if ok > 0:
        raise SystemExit(0)
    if quota == len(results):
        raise SystemExit(2)
    if invalid == len(results):
        raise SystemExit(1)
    raise SystemExit(3)


if __name__ == "__main__":
    main()
