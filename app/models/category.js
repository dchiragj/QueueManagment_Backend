const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: false, usePushEach: true }, // UTC format
);

categorySchema.methods = {
  toJSON() {
    return {
      id: this._id,
      name: this.name,
      slug: this.slug,
      isActive: this.isActive,
    };
  },
};
module.exports = mongoose.model('category', categorySchema);
