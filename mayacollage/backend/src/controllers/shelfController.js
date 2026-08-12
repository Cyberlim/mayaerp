import Shelf from '../models/shelfModel.js';
import Book from '../models/bookModel.js';

export const getShelves = async (req, res) => {
  try {
    const shelves = await Shelf.find().sort({ createdAt: -1 });
    
    // Dynamically calculate current book count for each shelf
    const updatedShelves = await Promise.all(shelves.map(async (shelf) => {
      const count = await Book.countDocuments({ shelf: shelf.name });
      return {
        ...shelf.toObject(),
        current: count
      };
    }));

    res.json(updatedShelves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createShelf = async (req, res) => {
  try {
    const shelf = new Shelf(req.body);
    const newShelf = await shelf.save();
    res.status(201).json(newShelf);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateShelf = async (req, res) => {
  try {
    const shelf = await Shelf.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(shelf);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteShelf = async (req, res) => {
  try {
    await Shelf.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shelf deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
