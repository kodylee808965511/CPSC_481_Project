import express from 'express';
import cors from 'cors';
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Missing MONGODB_URI in environment configuration.');
  process.exit(1);
}

mongoose.set('strictQuery', true);
mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    console.log('Connected to MongoDB.');
    startServer();
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  });

const exerciseSearchSchema = new mongoose.Schema(
  {
    query: {
      type: Map,
      of: String,
      required: true
    },
    results: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

const ExerciseSearchLog = mongoose.model('ExerciseSearchLog', exerciseSearchSchema);
const recipeSearchSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true
    },
    results: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

const nutritionLookupSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true
    },
    items: [
      {
        name: String,
        calories: Number,
        serving_size_g: Number,
        fat_total_g: Number,
        fat_saturated_g: Number,
        protein_g: Number,
        sodium_mg: Number,
        potassium_mg: Number,
        cholesterol_mg: Number,
        carbohydrates_total_g: Number,
        fiber_g: Number,
        sugar_g: Number
      }
    ]
  },
  { timestamps: true }
);

const RecipeSearchLog = mongoose.model('RecipeSearchLog', recipeSearchSchema);
const NutritionLookupLog = mongoose.model('NutritionLookupLog', nutritionLookupSchema);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    at: new Date().toISOString()
  });
});

app.get('/api/exercises', async (req, res) => {
  const { muscle, type, difficulty, name, offset } = req.query;
  if (!muscle && !type && !name) {
    return res.status(400).json({
      error: 'Provide at least one of muscle, type, or name to search exercises.'
    });
  }

  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Exercise API key is not configured. Add API_NINJAS_KEY to the environment file.'
    });
  }

  const params = {};
  if (muscle) params.muscle = muscle;
  if (type) params.type = type;
  if (difficulty) params.difficulty = difficulty;
  if (name) params.name = name;
  if (offset) params.offset = offset;

  try {
    const response = await axios.get('https://api.api-ninjas.com/v1/exercises', {
      headers: {
        'X-Api-Key': apiKey
      },
      params,
      timeout: 10000
    });

    const exercises = Array.isArray(response.data) ? response.data : [];
    await ExerciseSearchLog.create({
      query: params,
      results: exercises.length
    });

    res.json(exercises);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        error:
          (typeof error.response.data === 'string'
            ? error.response.data
            : error.response.data?.error) || 'Exercise API returned an error.'
      });
    }

    console.error('Exercise lookup failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch exercises. Try again later.' });
  }
});

app.get('/api/search-history', async (req, res) => {
  try {
    const recent = await ExerciseSearchLog.find().sort({ createdAt: -1 }).limit(10).lean();
    res.json(
      recent.map((entry) => ({
        id: entry._id.toString(),
        query: Object.fromEntries(entry.query),
        results: entry.results,
        createdAt: entry.createdAt
      }))
    );
  } catch (error) {
    console.error('Failed to load search history:', error.message);
    res.status(500).json({ error: 'Failed to load search history.' });
  }
});

app.get('/api/recipes', async (req, res) => {
  const query = (req.query.query || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Provide a recipe query to search.' });
  }

  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Recipe API key is not configured. Set API_NINJAS_KEY in .env.' });
  }

  try {
    const response = await axios.get('https://api.api-ninjas.com/v1/recipe', {
      headers: {
        'X-Api-Key': apiKey
      },
      params: {
        query
      },
      timeout: 10000
    });

    const recipes = Array.isArray(response.data) ? response.data : [];
    await RecipeSearchLog.create({
      query,
      results: recipes.length
    });

    res.json(recipes);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        error:
          (typeof error.response.data === 'string'
            ? error.response.data
            : error.response.data?.error) || 'Recipe API returned an error.'
      });
    }

    console.error('Recipe lookup failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch recipes. Try again later.' });
  }
});

app.get('/api/nutrition', async (req, res) => {
  const query = (req.query.query || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Provide a food query to calculate nutrition.' });
  }

  const apiKey = process.env.API_NINJAS_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Nutrition API key is not configured. Set API_NINJAS_KEY in .env.' });
  }

  try {
    const response = await axios.get('https://api.api-ninjas.com/v1/nutrition', {
      headers: {
        'X-Api-Key': apiKey
      },
      params: {
        query
      },
      timeout: 10000
    });

    const nutrition = Array.isArray(response.data) ? response.data : [];
    await NutritionLookupLog.create({
      query,
      items: nutrition
    });

    res.json(nutrition);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        error:
          (typeof error.response.data === 'string'
            ? error.response.data
            : error.response.data?.error) || 'Nutrition API returned an error.'
      });
    }
    console.error('Nutrition lookup failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch nutrition info. Try again later.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${PORT} is already in use. Stop the other process using it or update PORT in your backend .env file.`
      );
    } else {
      console.error('Unexpected server error:', error);
    }
    process.exit(1);
  });
}
