const mongoose = require('mongoose');

const mangaUrlSchema = new mongoose.Schema({
  text: { type: String, required: true },
  category: { type: String, required: true },
  chapters: {
    type: [
      {
        chapter: { type: String, required: true },
        images: { type: [String], required: true },
      },
    ],
    required: true,
  },
});

const MangaUrl = mongoose.model('MangaUrl', mangaUrlSchema);

module.exports = MangaUrl;