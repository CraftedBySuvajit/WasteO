const mongoose = require('mongoose');

const transform = (_doc, ret) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};

const makeSchemaOptions = () => ({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true, transform },
  toObject: { virtuals: true, transform },
});

module.exports = { mongoose, makeSchemaOptions };
