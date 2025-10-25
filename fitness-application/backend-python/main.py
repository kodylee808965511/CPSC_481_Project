import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
from pymongo import MongoClient, ASCENDING, DESCENDING


load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
API_NINJAS_KEY = os.getenv("API_NINJAS_KEY")
PORT = int(os.getenv("PORT")) if os.getenv("PORT") else 5001

if not MONGODB_URI:
    raise RuntimeError("Missing MONGODB_URI in environment configuration.")

# Mongo setup
client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
db = client[client.get_database().name]
exercise_search_log = db["exercise_search_log"]
recipe_search_log = db["recipe_search_log"]
nutrition_lookup_log = db["nutrition_lookup_log"]

app = FastAPI(title="Fitness Application Backend (Python)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class NutritionItem(BaseModel):
    name: Optional[str] = None
    calories: Optional[float] = None
    serving_size_g: Optional[float] = None
    fat_total_g: Optional[float] = None
    fat_saturated_g: Optional[float] = None
    protein_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    potassium_mg: Optional[float] = None
    cholesterol_mg: Optional[float] = None
    carbohydrates_total_g: Optional[float] = None
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None


@app.get("/api/health")
def health() -> Dict[str, Any]:
    return {"status": "ok", "at": __import__("datetime").datetime.utcnow().isoformat() + "Z"}


@app.get("/api/exercises")
async def get_exercises(
    muscle: Optional[str] = Query(default=None),
    type: Optional[str] = Query(default=None),
    difficulty: Optional[str] = Query(default=None),
    name: Optional[str] = Query(default=None),
    offset: Optional[int] = Query(default=None),
):
    if not muscle and not type and not name:
        raise HTTPException(status_code=400, detail="Provide at least one of muscle, type, or name to search exercises.")

    if not API_NINJAS_KEY:
        raise HTTPException(
            status_code=500,
            detail="Exercise API key is not configured. Add API_NINJAS_KEY to the environment file.",
        )

    params: Dict[str, Any] = {}
    if muscle:
        params["muscle"] = muscle
    if type:
        params["type"] = type
    if difficulty:
        params["difficulty"] = difficulty
    if name:
        params["name"] = name
    if offset is not None:
        params["offset"] = offset

    headers = {"X-Api-Key": API_NINJAS_KEY}
    url = "https://api.api-ninjas.com/v1/exercises"

    async with httpx.AsyncClient(timeout=10.0) as client_http:
        try:
            r = await client_http.get(url, headers=headers, params=params)
            if r.status_code >= 400:
                # Try to surface upstream error message
                try:
                    data = r.json()
                except Exception:
                    data = None
                detail = data if isinstance(data, str) else (data.get("error") if isinstance(data, dict) else "Exercise API returned an error.")
                raise HTTPException(status_code=r.status_code, detail=detail)

            from datetime import datetime
            data = r.json()
            exercises = data if isinstance(data, list) else []
            exercise_search_log.insert_one({
                "query": params,
                "results": len(exercises),
                "createdAt": datetime.utcnow(),
            })
            return exercises
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Failed to fetch exercises. Try again later.")


@app.get("/api/search-history")
def get_search_history():
    recent = list(exercise_search_log.find().sort("createdAt", DESCENDING).limit(10))
    # Fallback if createdAt does not exist: sort by _id descending
    if not recent:
        recent = list(exercise_search_log.find().sort("_id", DESCENDING).limit(10))
    normalized: List[Dict[str, Any]] = []
    for e in recent:
        q = e.get("query", {})
        normalized.append(
            {
                "id": str(e.get("_id")),
                "query": q if isinstance(q, dict) else dict(q),
                "results": e.get("results", 0),
                "createdAt": e.get("createdAt"),
            }
        )
    return normalized


@app.get("/api/recipes")
async def get_recipes(query: str = Query(..., min_length=1)):
    if not API_NINJAS_KEY:
        raise HTTPException(status_code=500, detail="Recipe API key is not configured. Set API_NINJAS_KEY in .env.")

    headers = {"X-Api-Key": API_NINJAS_KEY}
    url = "https://api.api-ninjas.com/v1/recipe"
    async with httpx.AsyncClient(timeout=10.0) as client_http:
        try:
            r = await client_http.get(url, headers=headers, params={"query": query})
            if r.status_code >= 400:
                try:
                    data = r.json()
                except Exception:
                    data = None
                detail = data if isinstance(data, str) else (data.get("error") if isinstance(data, dict) else "Recipe API returned an error.")
                raise HTTPException(status_code=r.status_code, detail=detail)

            from datetime import datetime
            data = r.json()
            recipes = data if isinstance(data, list) else []
            recipe_search_log.insert_one({
                "query": query,
                "results": len(recipes),
                "createdAt": datetime.utcnow(),
            })
            return recipes
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Failed to fetch recipes. Try again later.")


@app.get("/api/nutrition")
async def get_nutrition(query: str = Query(..., min_length=1)):
    if not API_NINJAS_KEY:
        raise HTTPException(status_code=500, detail="Nutrition API key is not configured. Set API_NINJAS_KEY in .env.")

    headers = {"X-Api-Key": API_NINJAS_KEY}
    url = "https://api.api-ninjas.com/v1/nutrition"
    async with httpx.AsyncClient(timeout=10.0) as client_http:
        try:
            r = await client_http.get(url, headers=headers, params={"query": query})
            if r.status_code >= 400:
                try:
                    data = r.json()
                except Exception:
                    data = None
                detail = data if isinstance(data, str) else (data.get("error") if isinstance(data, dict) else "Nutrition API returned an error.")
                raise HTTPException(status_code=r.status_code, detail=detail)

            from datetime import datetime
            data = r.json()
            items = data if isinstance(data, list) else []
            nutrition_lookup_log.insert_one({
                "query": query,
                "items": items,
                "createdAt": datetime.utcnow(),
            })
            return items
        except httpx.RequestError:
            raise HTTPException(status_code=500, detail="Failed to fetch nutrition info. Try again later.")


# Ported Java calculators (utility-only; not used by routes yet)
def bmi(weight_kg: float, height_cm: float) -> float:
    if weight_kg <= 0 or height_cm <= 0:
        raise ValueError("Invalid inputs")
    h = height_cm / 100.0
    return weight_kg / (h * h)


def bfp_deurenberg(bmi_value: float, age: int, is_male: bool) -> float:
    if bmi_value <= 0 or age <= 0:
        raise ValueError("Invalid inputs")
    sex = 1.0 if is_male else 0.0
    return 1.20 * bmi_value + 0.23 * age - 10.8 * sex - 5.4


def bmi_category(bmi_value: float) -> str:
    if bmi_value < 18.5:
        return "Underweight"
    if bmi_value < 25.0:
        return "Normal"
    if bmi_value < 30.0:
        return "Overweight"
    return "Obese"


def bfp_category(is_male: bool, bfp: float) -> str:
    if is_male:
        if bfp < 2:
            return "Below essential"
        if bfp <= 5:
            return "Essential"
        if bfp <= 13:
            return "Athletes"
        if bfp <= 17:
            return "Fitness"
        if bfp <= 24:
            return "Average"
        return "Obese"
    else:
        if bfp < 10:
            return "Below essential"
        if bfp <= 13:
            return "Essential"
        if bfp <= 20:
            return "Athletes"
        if bfp <= 24:
            return "Fitness"
        if bfp <= 31:
            return "Average"
        return "Obese"


def to_kg(weight: float, metric: bool) -> float:
    return weight if metric else weight * 0.45359237


def to_cm(height: float, metric: bool) -> float:
    return height if metric else height * 2.54


@app.get("/api/calc")
def calculate(
    age: int = Query(..., gt=0),
    sex: str = Query(..., regex="^(male|female)$"),
    height: float = Query(..., gt=0),
    weight: float = Query(..., gt=0),
    units: str = Query("metric", regex="^(metric|imperial)$"),
):
    metric = units == "metric"
    is_male = sex == "male"
    height_cm = to_cm(height, metric)
    weight_kg = to_kg(weight, metric)

    try:
        bmi_value = bmi(weight_kg, height_cm)
        bmi_cat = bmi_category(bmi_value)
        bfp_value = bfp_deurenberg(bmi_value, age, is_male)
        bfp_cat = bfp_category(is_male, bfp_value)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "bmi": round(bmi_value, 1),
        "bmiCategory": bmi_cat,
        "bfp": round(bfp_value, 1),
        "bfpCategory": bfp_cat,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
