require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sessionRoutes = require('./routes/sessions');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/sessions', sessionRoutes);

// Тестовий маршрут для перевірки Supabase (залишаємо)
app.get('/test-db', async (req, res) => {
  try {
    const supabase = require('./config/supabase');
    const { data, error } = await supabase.from('sessions').select('*').limit(1);
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.use(errorHandler);

// Експортуємо app для тестів
module.exports = app;

// Запускаємо сервер тільки якщо файл виконується напряму (не імпортується)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}