const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const Schema = mongoose.Schema;

const problemAndSolutionSchema = new mongoose.Schema(
  {
    uid: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalized_name: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      trim: true,
    },
    type: {
      type: Number, // 1: problem, 2: solution
      required: true,
      trim: true,
    },
    queueId: {
      type: String,
      trim: true,
    },
    category: {
      type: String, // category
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: false,
    },
    deletedBy: {
      type: String,
      trim: true,
    },
  },
  { timestamps: false, usePushEach: true }, // UTC format
);

problemAndSolutionSchema.plugin(mongooseDelete, { overrideMethods: true, deletedAt: true });

problemAndSolutionSchema.methods = {
  toJSON() {
    return {
      id: this._id,
      name: this.name,
      desc: this.desc,
      queueId: this.queueId,
      category: this.category,
      type: this.type,
      isActive: this.isActive,
    };
  },
};
module.exports = mongoose.model('problems_solutions', problemAndSolutionSchema);
