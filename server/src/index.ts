import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { prisma } from './prisma/client';

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/game', async (req, res) => {
    const { players } = req.body;
    if (!players || !Array.isArray(players) || players.length === 0) {
        return res.status(400).json({ error: 'Игроки не указаны' });
    }

    const game = await prisma.game.create({
        data: {
            players: {
                create: players.map((name: string) => ({ name })),
            },
        },
        include: {
            players: true,
            rounds: true,
        },
    });

    res.json(game);
});

app.post('/round', async (req, res) => {
    const { gameId, scores, number } = req.body;
    if (typeof gameId !== 'number' || typeof number !== 'number' || typeof scores !== 'object') {
        return res.status(400).json({ error: 'Некорректные данные раунда' });
    }

    const round = await prisma.round.create({
        data: {
            gameId,
            scores: JSON.stringify(scores),
            number,
        },
    });
    res.json(round);
});

app.get('/game/:id', async (req, res) => {
    const id = Number(req.params.id);
    const game = await prisma.game.findUnique({
        where: { id },
        include: { rounds: true, players: true },
    });
    console.log(game);
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }

    const parsedRounds = game.rounds.map((r) => ({
        ...r,
        scores: JSON.parse(r.scores) as Record<string, number>,
    }));

    res.json({ ...game, rounds: parsedRounds });
});

app.post('/round', async (req, res) => {
    const { gameId, scores, number } = req.body;

    if (!gameId || !scores || !number) {
        return res.status(400).json({ error: 'Недостаточно данных для раунда' });
    }

    const round = await prisma.round.create({
        data: {
            gameId,
            scores: JSON.stringify(scores),
            number,
        },
    });

app.delete('/game/:id', async (req, res) => {
        const id = Number(req.params.id);

        const game = await prisma.game.delete({
            where: { id },
        });

        res.json({ message: 'Игра удалена', game });
    });

    res.json(round);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});