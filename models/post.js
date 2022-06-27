const mongoose = require("mongoose");
const { Schema } = mongoose;

const postSchema = new Schema({
  id: String,
  title: String, // String is shorthand for {type: String}
  originId: String,
  author: String,
  published: String,
  keywords: [String],
  canonicalUrl: String,
  image: String,
  votes: [{ type: String, default: [] }],
  votes_count: { type: Number, default: 0 },
  // views: { type: Number, default: 0 },
  views: [
    {
      type: Date,
      default: [],
    },
  ],
  source: {
    id: String,
    url: String,
    title: String,
    image: String,
  },
});

module.exports = Post = mongoose.model("Post", postSchema);
