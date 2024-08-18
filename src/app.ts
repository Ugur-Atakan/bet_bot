import express from 'express';
import matchRoutes from './routes/match.routes';
import dotenv from 'dotenv';

const app = express();
const port = process.env.PORT || 3000;

dotenv.config();

app.use(express.json());

// Match rotalarını kullanıyoruz
app.use('/api/match', matchRoutes);

// Sunucuyu başlat
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
