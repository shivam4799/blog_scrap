const mongoose = require("mongoose");
const { Schema } = mongoose;

const popularSchema = new Schema(
  {
    name: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true }, // So `res.json()` and other `JSON.stringify()` functions include virtuals
    toObject: { virtuals: true }, // So `toObject()` output includes virtuals
  }
);

popularSchema.virtual("posts", {
  ref: "Post", // The model to use
  localField: "name", // Find people where `localField`
  foreignField: "id", // is equal to `foreignField`
});

module.exports = Popular = mongoose.model("Popular", popularSchema);
