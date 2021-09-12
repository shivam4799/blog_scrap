const mongoose = require('mongoose');
  const { Schema } = mongoose;

  const sourceSchema = new Schema({
    id:String,
    title:  String,
    url:String,
    categories: [String],
    topics: [String],
    updated: String,
    image: String,
    posts: [String],
    items:[{type: Schema.Types.ObjectId,ref:'Post'}]
  });

 module.exports = Source = mongoose.model('Source', sourceSchema);