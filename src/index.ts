import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';

const app = express();
const prisma = new PrismaClient();

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Process handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// Cleanup on exit
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.post("/books", async (req, res) => {
    const {title, author, published} = req.body;

    // Validation checks
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: "Title is required and must be a non-empty string" });
    }

    if (!author || typeof author !== 'string' || author.trim().length === 0) {
        return res.status(400).json({ error: "Author is required and must be a non-empty string" });
    }

    if (published === undefined || !Number.isInteger(published)) {
        return res.status(400).json({ error: "Published must be an integer value" });
    }

    try {
        const book = await prisma.book.create({
            data: { 
                title: title.trim(),
                author: author.trim(),
                published: published // Must be an integer
            }
        });
        res.status(201).json(book);
    } catch (error) {
        console.error('Error creating book:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create book" });
    }
});
    
    app.get ("/books", async (req, res) => {
        try {
            const books = await prisma.book.findMany();
            res.status(200).json(books);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch books" });
        }
    });

    app.get("/books/:id", async (req, res) => {
        const { id } = req.params;
        try {
            const book = await prisma.book.findUnique({
                where: { id: Number(id) }
            });
            if (book) {
                res.status(200).json(book);
            } else {
                res.status(404).json({ error: "Book not found" });
            }
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch book" });
        }
    });

    app.put("/books/:id", async (req, res) => {
        const { id } = req.params;
        const { title, author, published } = req.body;

        // Validation checks
        if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
            return res.status(400).json({ error: "Title must be a non-empty string" });
        }

        if (author !== undefined && (typeof author !== 'string' || author.trim().length === 0)) {
            return res.status(400).json({ error: "Author must be a non-empty string" });
        }

        if (published !== undefined && !Number.isInteger(published)) {
            return res.status(400).json({ error: "Published must be an integer value" });
        }

        try {
            const book = await prisma.book.update({
                where: { id: Number(id) },
                data: {
                    ...(title && { title: title.trim() }),
                    ...(author && { author: author.trim() }),
                    ...(published !== undefined && { published })
                }
            });
            res.status(200).json(book);
        } catch (error) {
            res.status(500).json({ error: "Failed to update book" });
        }
    });

    app.delete("/books/:id", async (req, res) => {
        const { id } = req.params;
        try {
            await prisma.book.delete({
                where: { id: Number(id) }
            });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: "Failed to delete book" });
        }
    });
    
    const PORT = process.env.PORT || 3000;
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        await prisma.$disconnect();
        process.exit(1);
    }

