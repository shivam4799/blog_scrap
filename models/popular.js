const mongoose = require("mongoose");
const { Schema } = mongoose;

const popularSchema = new Schema(
  {
    title: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals
    toObject: { virtuals: true }, // So `toObject()` output includes virtuals
  }
);

popularSchema.virtual("posts", {
  ref: "Post", // The model to use
  localField: "title", // Find people where `localField`
  foreignField: "title", // is equal to `foreignField`
  // If `justOne` is true, 'members' will be a single doc as opposed to
  // an array. `justOne` is false by default.
  // justOne: false,
  // options: { sort: { name: -1 }, limit: 5 }
  // count: true
  // options: { sort: { id: -1 }} // Query options, see http://bit.ly/mongoose-query-options
});

module.exports = Popular = mongoose.model("Popular", popularSchema);
