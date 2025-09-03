const { isNull } = require('lodash');
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const Schema = mongoose.Schema;

const geoSchema = new Schema({
  type: {
    type: String,
    default: 'Point',
  },
  coordinates: {
    type: [Number],
  },
});

geoSchema.methods = {
  toJSON() {
    return {
      type: this.type,
      coordinates: this.coordinates,
    };
  },
};

const queueSchema = new mongoose.Schema(
  {
    uid: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    start_date: {
      type: Schema.Types.Date,
      required: true,
    },
    end_date: {
      type: Schema.Types.Date,
      required: true,
    },
    noOfDesk: {
      type: Number,
    },
    start_number: {
      type: Number,
      required: true,
    },
    end_number: {
      type: Number,
      required: true,
    },
    status: {
      type: Number,
      // required: true
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    address: {
      type: String,
    },
    location: {
      type: geoSchema,
      index: '2dsphere',
    },
    lattitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    isCancelled: {
      type: Boolean,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: false,
    },
    cancelled_date: {
      type: Schema.Types.Date,
      required: false,
    },
    cancelled_comment: {
      type: String,
      required: false,
    },
    merchant: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    customProps: {
      type: Schema.Types.Mixed,
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
  { timestamps: true, usePushEach: true }, // UTC format
);

queueSchema.plugin(mongooseDelete, { overrideMethods: true, deletedAt: true });

queueSchema.methods = {
  toJSON() {
    return {
      id: this._id,
      category: this.category,
      name: this.name,
      description: this.description,
      start_date: this.start_date,
      end_date: this.end_date,
      noOfDesk: this.noOfDesk,
      start_number: this.start_number,
      end_number: this.end_number,
      status: this.status,
      isActive: this.isActive,
      address: this.address,
      location: this.location ? this.location.toJSON() : {},
      lattitude: this.lattitude,
      longitude: this.longitude,
      isCancelled: this.isCancelled,
      cancelledBy: this.cancelledBy,
      cancelled_date: this.cancelled_date,
      cancelled_comment: this.cancelled_comment,
      merchant: this.merchant && !isNull(this.merchant) ? this.merchant.toJSON() : undefined,
      customProps: this.customProps,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedBy: this.updatedBy,
      updatedAt: this.updatedAt,
    };
  },
};
module.exports = mongoose.model('queue', queueSchema);
