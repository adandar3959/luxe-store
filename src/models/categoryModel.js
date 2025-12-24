const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    // 👇 REMOVE "unique: true" from here
    name: { type: String, required: true }, 
    slug: { type: String, lowercase: true },
    image: { type: String },
    parentId: { type: mongoose.Schema.Types.String, default: null } 
});

// 👇 OPTIONAL: This ensures name + parent combination is unique (e.g. Can't have two "Shirts" under "Women")
categorySchema.index({ name: 1, parentId: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);