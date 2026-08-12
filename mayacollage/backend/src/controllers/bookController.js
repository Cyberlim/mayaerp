import Book from '../models/bookModel.js';

export const createBook = async (req, res) => {
    try {
        const book = new Book(req.body);
        await book.save();
        res.status(201).json(book);
    } catch (error) {
        res.status(500).json({ message: 'Error adding book', error: error.message });
    }
};

export const getAllBooks = async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching books', error: error.message });
    }
};

export const updateBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!book) return res.status(404).json({ message: 'Book not found' });
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ message: 'Error updating book', error: error.message });
    }
};

export const deleteBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        res.status(200).json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting book', error: error.message });
    }
};

export const getBooksByShelf = async (req, res) => {
    try {
        const { shelfName } = req.params;
        const books = await Book.find({ shelf: shelfName }).sort({ title: 1 });
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching books for shelf', error: error.message });
    }
};
